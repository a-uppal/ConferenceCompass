import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import {
  CrossPollinationTask,
  CrossPollinationInsert,
  CrossPollinationComplete,
  UseCrossPollinationReturn,
} from '@/types/campaign';

interface CrossPollinationContextType extends UseCrossPollinationReturn {
  myPendingTasks: CrossPollinationTask[];
  urgentTasks: CrossPollinationTask[];
  createTask: (data: CrossPollinationInsert) => Promise<CrossPollinationTask>;
  getTasksForPost: (postId: string) => CrossPollinationTask[];
  markTaskMissed: (taskId: string) => Promise<void>;
  checkAndUpdateMissedTasks: () => Promise<void>;
}

const CrossPollinationContext = createContext<CrossPollinationContextType | undefined>(undefined);

interface CrossPollinationProviderProps {
  children: ReactNode;
}

export function CrossPollinationProvider({ children }: CrossPollinationProviderProps) {
  const { activeConference } = useTeam();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<CrossPollinationTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load tasks when conference changes
  useEffect(() => {
    if (activeConference) {
      loadTasks();
    } else {
      setTasks([]);
      setIsLoading(false);
    }
  }, [activeConference]);

  // Check for missed tasks periodically
  useEffect(() => {
    if (!activeConference) return;

    const interval = setInterval(() => {
      checkAndUpdateMissedTasks();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [activeConference]);

  const loadTasks = async () => {
    if (!activeConference) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('cross_pollination')
        .select(`
          *,
          commenter:commenter_id (id, full_name, avatar_url),
          post:post_id (
            id,
            conference_id,
            author_id,
            scheduled_date,
            content,
            theme,
            platform,
            linkedin_url,
            author:author_id (id, full_name, avatar_url)
          )
        `)
        .eq('post.conference_id', activeConference.id)
        .order('required_by', { ascending: true });

      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err) {
      console.error('[useCrossPollination] Error loading tasks:', err);
      setError(err instanceof Error ? err : new Error('Failed to load tasks'));
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async (data: CrossPollinationInsert): Promise<CrossPollinationTask> => {
    const { data: task, error: createError } = await supabase
      .from('cross_pollination')
      .insert(data)
      .select(`
        *,
        commenter:commenter_id (id, full_name, avatar_url),
        post:post_id (
          id,
          conference_id,
          author_id,
          scheduled_date,
          content,
          theme,
          platform,
          linkedin_url
        )
      `)
      .single();

    if (createError) throw createError;

    await loadTasks();
    return task;
  };

  const completeTask = async (
    taskId: string,
    data: CrossPollinationComplete
  ): Promise<void> => {
    const { error: updateError } = await supabase
      .from('cross_pollination')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        comment_url: data.comment_url,
        comment_text: data.comment_text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updateError) throw updateError;

    await loadTasks();
  };

  const markTaskMissed = async (taskId: string): Promise<void> => {
    const { error: updateError } = await supabase
      .from('cross_pollination')
      .update({
        status: 'missed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updateError) throw updateError;

    await loadTasks();
  };

  const checkAndUpdateMissedTasks = async (): Promise<void> => {
    if (!activeConference) return;

    try {
      // Call the database function to mark missed tasks
      await supabase.rpc('mark_missed_cross_pollination');

      // Reload tasks to reflect changes
      await loadTasks();
    } catch (err) {
      console.error('[useCrossPollination] Error checking missed tasks:', err);
    }
  };

  const refreshTasks = async (): Promise<void> => {
    await loadTasks();
  };

  // Computed values
  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  const myPendingTasks = tasks.filter(
    (t) => t.status === 'pending' && t.commenter_id === user?.id
  );

  const urgentTasks = tasks.filter((t) => {
    if (t.status !== 'pending') return false;
    const requiredBy = new Date(t.required_by);
    const now = new Date();
    const hoursRemaining = (requiredBy.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursRemaining <= 1 && hoursRemaining > 0; // Within 1 hour
  });

  const getTasksForPost = useCallback(
    (postId: string): CrossPollinationTask[] => {
      return tasks.filter((t) => t.post_id === postId);
    },
    [tasks]
  );

  const value: CrossPollinationContextType = {
    tasks,
    pendingTasks,
    myPendingTasks,
    urgentTasks,
    isLoading,
    error,
    createTask,
    completeTask,
    refreshTasks,
    getTasksForPost,
    markTaskMissed,
    checkAndUpdateMissedTasks,
  };

  return (
    <CrossPollinationContext.Provider value={value}>
      {children}
    </CrossPollinationContext.Provider>
  );
}

export function useCrossPollination() {
  const context = useContext(CrossPollinationContext);
  if (context === undefined) {
    throw new Error('useCrossPollination must be used within a CrossPollinationProvider');
  }
  return context;
}
