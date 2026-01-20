import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { useTeam } from '@/hooks/useTeam';
import {
  ConferenceScheduleSlot,
  ConferenceScheduleInsert,
  ConferenceScheduleDay,
  UseConferenceScheduleReturn,
} from '@/types/campaign';

interface ConferenceScheduleContextType extends UseConferenceScheduleReturn {
  slotsByDay: ConferenceScheduleDay[];
  createSlot: (data: ConferenceScheduleInsert) => Promise<ConferenceScheduleSlot>;
  updateSlot: (id: string, data: Partial<ConferenceScheduleSlot>) => Promise<ConferenceScheduleSlot>;
  deleteSlot: (id: string) => Promise<void>;
  getSlotsByOwner: (ownerId: string) => ConferenceScheduleSlot[];
  getUnfilledSlots: () => ConferenceScheduleSlot[];
  isConferenceDay: () => boolean;
}

const ConferenceScheduleContext = createContext<ConferenceScheduleContextType | undefined>(undefined);

interface ConferenceScheduleProviderProps {
  children: ReactNode;
}

export function ConferenceScheduleProvider({ children }: ConferenceScheduleProviderProps) {
  const { activeConference } = useTeam();
  const [slots, setSlots] = useState<ConferenceScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load schedule when conference changes
  useEffect(() => {
    if (activeConference) {
      loadSchedule();
    } else {
      setSlots([]);
      setIsLoading(false);
    }
  }, [activeConference]);

  const loadSchedule = async () => {
    if (!activeConference) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('conference_schedule')
        .select(`
          *,
          owner:owner_id (id, full_name),
          actual_post:actual_post_id (
            id,
            content,
            theme,
            platform,
            linkedin_url,
            status
          )
        `)
        .eq('conference_id', activeConference.id)
        .order('schedule_day', { ascending: true })
        .order('schedule_time', { ascending: true });

      if (fetchError) throw fetchError;
      setSlots(data || []);
    } catch (err) {
      console.error('[useConferenceSchedule] Error loading schedule:', err);
      setError(err instanceof Error ? err : new Error('Failed to load schedule'));
    } finally {
      setIsLoading(false);
    }
  };

  const createSlot = async (data: ConferenceScheduleInsert): Promise<ConferenceScheduleSlot> => {
    const { data: slot, error: createError } = await supabase
      .from('conference_schedule')
      .insert(data)
      .select(`
        *,
        owner:owner_id (id, full_name)
      `)
      .single();

    if (createError) throw createError;

    await loadSchedule();
    return slot;
  };

  const updateSlot = async (
    id: string,
    data: Partial<ConferenceScheduleSlot>
  ): Promise<ConferenceScheduleSlot> => {
    const { data: slot, error: updateError } = await supabase
      .from('conference_schedule')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        owner:owner_id (id, full_name),
        actual_post:actual_post_id (id, content, theme, platform, linkedin_url, status)
      `)
      .single();

    if (updateError) throw updateError;

    await loadSchedule();
    return slot;
  };

  const deleteSlot = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('conference_schedule')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await loadSchedule();
  };

  const linkPostToSlot = async (slotId: string, postId: string): Promise<void> => {
    await updateSlot(slotId, { actual_post_id: postId } as Partial<ConferenceScheduleSlot>);
  };

  const refreshSchedule = async (): Promise<void> => {
    await loadSchedule();
  };

  // Computed values
  const todaySlots = slots.filter((s) => {
    const today = new Date().toISOString().split('T')[0];
    return s.schedule_day === today;
  });

  // Group slots by day
  const slotsByDay: ConferenceScheduleDay[] = slots.reduce((acc, slot) => {
    const existing = acc.find((d) => d.day === slot.schedule_day);
    if (existing) {
      existing.slots.push(slot);
    } else {
      acc.push({ day: slot.schedule_day, slots: [slot] });
    }
    return acc;
  }, [] as ConferenceScheduleDay[]);

  // Filter helpers
  const getSlotsByOwner = useCallback(
    (ownerId: string): ConferenceScheduleSlot[] => {
      return slots.filter((s) => s.owner_id === ownerId);
    },
    [slots]
  );

  const getUnfilledSlots = useCallback((): ConferenceScheduleSlot[] => {
    return slots.filter((s) => !s.actual_post_id);
  }, [slots]);

  const isConferenceDay = useCallback((): boolean => {
    if (!activeConference) return false;

    const today = new Date();
    const start = new Date(activeConference.start_date);
    const end = new Date(activeConference.end_date);

    // Set to start of day for comparison
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return today >= start && today <= end;
  }, [activeConference]);

  const value: ConferenceScheduleContextType = {
    slots,
    todaySlots,
    slotsByDay,
    isLoading,
    error,
    createSlot,
    updateSlot,
    deleteSlot,
    linkPostToSlot,
    refreshSchedule,
    getSlotsByOwner,
    getUnfilledSlots,
    isConferenceDay,
  };

  return (
    <ConferenceScheduleContext.Provider value={value}>
      {children}
    </ConferenceScheduleContext.Provider>
  );
}

export function useConferenceSchedule() {
  const context = useContext(ConferenceScheduleContext);
  if (context === undefined) {
    throw new Error('useConferenceSchedule must be used within a ConferenceScheduleProvider');
  }
  return context;
}
