import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { TeamActivity, DailyCheckIn } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ActivityWithUser extends TeamActivity {
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface CheckInWithUser extends DailyCheckIn {
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface ActivityState {
  activities: ActivityWithUser[];
  checkIns: CheckInWithUser[];
  isLoading: boolean;
  error: string | null;
  realtimeChannel: RealtimeChannel | null;

  // Actions
  loadActivities: (conferenceId: string, limit?: number) => Promise<void>;
  loadCheckIns: (conferenceId: string, date?: string) => Promise<void>;
  submitCheckIn: (checkIn: Omit<DailyCheckIn, 'id' | 'created_at'>) => Promise<void>;
  subscribeToRealtime: (conferenceId: string) => void;
  unsubscribeFromRealtime: () => void;
  getActivitiesByType: (type: TeamActivity['activity_type']) => ActivityWithUser[];
  getTodayCheckIns: () => CheckInWithUser[];
}

export const useActivityStore = create<ActivityState>()((set, get) => ({
  activities: [],
  checkIns: [],
  isLoading: false,
  error: null,
  realtimeChannel: null,

  loadActivities: async (conferenceId: string, limit = 50) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('team_activities')
        .select(`
          *,
          user:users!user_id (id, full_name, avatar_url)
        `)
        .eq('conference_id', conferenceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      set({ activities: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadCheckIns: async (conferenceId: string, date?: string) => {
    const checkInDate = date || new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('daily_check_ins')
        .select(`
          *,
          user:users!user_id (id, full_name, avatar_url)
        `)
        .eq('conference_id', conferenceId)
        .eq('check_in_date', checkInDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ checkIns: data || [] });
    } catch (error: any) {
      console.error('Error loading check-ins:', error);
    }
  },

  submitCheckIn: async (checkIn) => {
    try {
      // Check if already checked in today
      const { data: existing } = await supabase
        .from('daily_check_ins')
        .select('id')
        .eq('conference_id', checkIn.conference_id)
        .eq('user_id', checkIn.user_id)
        .eq('check_in_date', checkIn.check_in_date)
        .single();

      if (existing) {
        // Update existing check-in
        const { error } = await supabase
          .from('daily_check_ins')
          .update({
            priorities: checkIn.priorities,
            location: checkIn.location,
            status: checkIn.status,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new check-in
        const { error } = await supabase
          .from('daily_check_ins')
          .insert(checkIn);

        if (error) throw error;

        // Log activity
        await supabase.from('team_activities').insert({
          team_id: checkIn.conference_id,
          conference_id: checkIn.conference_id,
          user_id: checkIn.user_id,
          activity_type: 'check_in',
          description: `Checked in: ${checkIn.priorities?.substring(0, 50) || 'Ready for the day'}...`,
        });
      }

      // Reload check-ins
      await get().loadCheckIns(checkIn.conference_id, checkIn.check_in_date);
    } catch (error) {
      console.error('Error submitting check-in:', error);
      throw error;
    }
  },

  subscribeToRealtime: (conferenceId: string) => {
    // Unsubscribe from existing channel if any
    get().unsubscribeFromRealtime();

    const channel = supabase
      .channel(`activities:${conferenceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_activities',
          filter: `conference_id=eq.${conferenceId}`,
        },
        async (payload) => {
          // Fetch the new activity with user info
          const { data } = await supabase
            .from('team_activities')
            .select(`
              *,
              user:users!user_id (id, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            set((state) => ({
              activities: [data, ...state.activities].slice(0, 50),
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'daily_check_ins',
          filter: `conference_id=eq.${conferenceId}`,
        },
        async (payload) => {
          const today = new Date().toISOString().split('T')[0];
          if (payload.new.check_in_date === today) {
            // Fetch with user info
            const { data } = await supabase
              .from('daily_check_ins')
              .select(`
                *,
                user:users!user_id (id, full_name, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              set((state) => ({
                checkIns: [...state.checkIns, data],
              }));
            }
          }
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromRealtime: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null });
    }
  },

  getActivitiesByType: (type) => {
    return get().activities.filter((a) => a.activity_type === type);
  },

  getTodayCheckIns: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().checkIns.filter((c) => c.check_in_date === today);
  },
}));
