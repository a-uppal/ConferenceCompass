import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { Session, SessionAttendance, SessionCapture, TalkingPoint } from '@/types/database';
import { toLocalDateString } from '@/utils/dateUtils';

interface SessionFilters {
  search: string;
  date: string | null; // ISO date string
  track: string | null;
  attendanceStatus: 'all' | 'planned' | 'attending' | 'attended';
}

interface SessionWithDetails extends Session {
  talking_points?: TalkingPoint[];
  attendance?: SessionAttendance;
  captures?: SessionCapture[];
}

interface SessionState {
  sessions: SessionWithDetails[];
  isLoading: boolean;
  error: string | null;
  filters: SessionFilters;
  selectedDate: Date;

  // Actions
  setFilters: (filters: Partial<SessionFilters>) => void;
  setSelectedDate: (date: Date) => void;
  loadSessions: (conferenceId: string) => Promise<void>;
  loadSessionDetails: (sessionId: string) => Promise<SessionWithDetails | null>;
  updateAttendance: (sessionId: string, userId: string, status: SessionAttendance['status'], takeaways?: string) => Promise<void>;
  addCapture: (capture: Omit<SessionCapture, 'id' | 'created_at'>) => Promise<SessionCapture>;
  getSessionsByDate: (date: Date) => SessionWithDetails[];
  getTracks: () => string[];
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    date: null,
    track: null,
    attendanceStatus: 'all',
  },
  selectedDate: new Date(),

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  loadSessions: async (conferenceId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Load sessions with talking points
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          talking_points (*)
        `)
        .eq('conference_id', conferenceId)
        .order('start_time', { ascending: true });

      if (sessionsError) throw sessionsError;

      // Load user's attendance for all sessions
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const sessionIds = sessionsData?.map((s) => s.id) || [];
        const { data: attendanceData } = await supabase
          .from('session_attendance')
          .select('*')
          .eq('user_id', user.id)
          .in('session_id', sessionIds);

        // Merge attendance into sessions
        const sessionsWithAttendance = sessionsData?.map((session) => ({
          ...session,
          attendance: attendanceData?.find((a) => a.session_id === session.id),
        })) || [];

        set({ sessions: sessionsWithAttendance, isLoading: false });
      } else {
        set({ sessions: sessionsData || [], isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadSessionDetails: async (sessionId: string) => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          talking_points (*),
          session_attendance (*),
          session_captures (*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Get current user to find their attendance
      const { data: { user } } = await supabase.auth.getUser();

      // Transform Supabase response to match SessionWithDetails interface
      const sessionWithDetails: SessionWithDetails = {
        ...session,
        talking_points: session.talking_points || [],
        attendance: user
          ? (session.session_attendance as SessionAttendance[])?.find(
              (a: SessionAttendance) => a.user_id === user.id
            )
          : undefined,
        captures: (session.session_captures as SessionCapture[]) || [],
      };

      return sessionWithDetails;
    } catch (error) {
      console.error('Error loading session details:', error);
      return null;
    }
  },

  updateAttendance: async (sessionId: string, userId: string, status: SessionAttendance['status'], takeaways?: string) => {
    try {
      const { data: existing } = await supabase
        .from('session_attendance')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        await supabase
          .from('session_attendance')
          .update({
            status,
            key_takeaways: takeaways,
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('session_attendance')
          .insert({
            session_id: sessionId,
            user_id: userId,
            status,
            key_takeaways: takeaways,
          });
      }

      // Update local state
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                attendance: {
                  id: existing?.id || '',
                  session_id: sessionId,
                  user_id: userId,
                  status,
                  key_takeaways: takeaways,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              }
            : s
        ),
      }));

      // Log activity
      const session = get().sessions.find((s) => s.id === sessionId);
      if (session && status === 'attended') {
        await supabase.from('team_activities').insert({
          team_id: session.conference_id,
          conference_id: session.conference_id,
          user_id: userId,
          activity_type: 'session_attended',
          entity_id: sessionId,
          description: `Attended session: ${session.title}`,
        });
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  },

  addCapture: async (capture) => {
    const { data, error } = await supabase
      .from('session_captures')
      .insert(capture)
      .select()
      .single();

    if (error) throw error;

    // Update local state
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === capture.session_id
          ? {
              ...s,
              captures: [...(s.captures || []), data],
            }
          : s
      ),
    }));

    return data;
  },

  getSessionsByDate: (date: Date) => {
    const { sessions, filters } = get();
    const dateStr = toLocalDateString(date);

    return sessions.filter((session) => {
      // Date filter - use local timezone comparison
      const sessionDate = toLocalDateString(new Date(session.start_time));
      if (sessionDate !== dateStr) return false;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          session.title.toLowerCase().includes(searchLower) ||
          session.speaker_name?.toLowerCase().includes(searchLower) ||
          session.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Track filter
      if (filters.track && session.track !== filters.track) return false;

      // Attendance status filter
      if (filters.attendanceStatus !== 'all') {
        const sessionAttendanceStatus = session.attendance?.status;
        // Sessions without attendance don't match any specific filter
        if (!sessionAttendanceStatus) return false;
        if (sessionAttendanceStatus !== filters.attendanceStatus) return false;
      }

      return true;
    });
  },

  getTracks: () => {
    const { sessions } = get();
    const tracks = new Set<string>();
    sessions.forEach((s) => {
      if (s.track) tracks.add(s.track);
    });
    return Array.from(tracks).sort();
  },
}));
