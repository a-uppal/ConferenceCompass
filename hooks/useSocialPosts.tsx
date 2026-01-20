import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import {
  CampaignPost,
  CampaignPostInsert,
  CampaignPostUpdate,
  UseSocialPostsReturn,
  DayOfWeek,
} from '@/types/campaign';

interface SocialPostsContextType extends UseSocialPostsReturn {
  getPostsByWeek: (week: number) => CampaignPost[];
  getPostsByPhase: (phaseId: string) => CampaignPost[];
  getPostsByAuthor: (authorId: string) => CampaignPost[];
  getPostsByDay: (day: DayOfWeek) => CampaignPost[];
  getThisWeekPosts: () => CampaignPost[];
  getTodayPosts: () => CampaignPost[];
}

const SocialPostsContext = createContext<SocialPostsContextType | undefined>(undefined);

interface SocialPostsProviderProps {
  children: ReactNode;
}

export function SocialPostsProvider({ children }: SocialPostsProviderProps) {
  const { activeConference } = useTeam();
  const { user } = useAuth();
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load posts when conference changes
  useEffect(() => {
    if (activeConference) {
      loadPosts();
    } else {
      setPosts([]);
      setIsLoading(false);
    }
  }, [activeConference]);

  const loadPosts = async () => {
    if (!activeConference) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          author:author_id (id, full_name, avatar_url),
          phase:phase_id (*)
        `)
        .eq('conference_id', activeConference.id)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (fetchError) throw fetchError;
      setPosts(data || []);
    } catch (err) {
      console.error('[useSocialPosts] Error loading posts:', err);
      setError(err instanceof Error ? err : new Error('Failed to load posts'));
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = async (data: CampaignPostInsert): Promise<CampaignPost> => {
    if (!user) throw new Error('Must be authenticated to create a post');

    const postData = {
      ...data,
      author_id: data.author_id || user.id,
    };

    const { data: post, error: createError } = await supabase
      .from('posts')
      .insert(postData)
      .select(`
        *,
        author:author_id (id, full_name, avatar_url),
        phase:phase_id (*)
      `)
      .single();

    if (createError) throw createError;

    // Refresh posts to get updated list
    await loadPosts();
    return post;
  };

  const updatePost = async (
    id: string,
    data: CampaignPostUpdate
  ): Promise<CampaignPost> => {
    const { data: post, error: updateError } = await supabase
      .from('posts')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        author:author_id (id, full_name, avatar_url),
        phase:phase_id (*)
      `)
      .single();

    if (updateError) throw updateError;

    await loadPosts();
    return post;
  };

  const deletePost = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await loadPosts();
  };

  const markAsPosted = async (id: string, url?: string): Promise<void> => {
    const updateData: CampaignPostUpdate = {
      status: 'posted',
      posted_at: new Date().toISOString(),
    };

    if (url) {
      updateData.linkedin_url = url;
    }

    await updatePost(id, updateData);
  };

  const refreshPosts = async (): Promise<void> => {
    await loadPosts();
  };

  // Filter helpers
  const getPostsByWeek = useCallback(
    (week: number): CampaignPost[] => {
      return posts.filter((p) => p.week_number === week);
    },
    [posts]
  );

  const getPostsByPhase = useCallback(
    (phaseId: string): CampaignPost[] => {
      return posts.filter((p) => p.phase_id === phaseId);
    },
    [posts]
  );

  const getPostsByAuthor = useCallback(
    (authorId: string): CampaignPost[] => {
      return posts.filter((p) => p.author_id === authorId);
    },
    [posts]
  );

  const getPostsByDay = useCallback(
    (day: DayOfWeek): CampaignPost[] => {
      return posts.filter((p) => p.day_of_week === day);
    },
    [posts]
  );

  const getThisWeekPosts = useCallback((): CampaignPost[] => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Saturday
    weekEnd.setHours(23, 59, 59, 999);

    return posts.filter((p) => {
      const postDate = new Date(p.scheduled_date);
      return postDate >= weekStart && postDate <= weekEnd;
    });
  }, [posts]);

  const getTodayPosts = useCallback((): CampaignPost[] => {
    const today = new Date().toISOString().split('T')[0];
    return posts.filter((p) => p.scheduled_date === today);
  }, [posts]);

  const value: SocialPostsContextType = {
    posts,
    isLoading,
    error,
    createPost,
    updatePost,
    deletePost,
    markAsPosted,
    refreshPosts,
    getPostsByWeek,
    getPostsByPhase,
    getPostsByAuthor,
    getPostsByDay,
    getThisWeekPosts,
    getTodayPosts,
  };

  return (
    <SocialPostsContext.Provider value={value}>
      {children}
    </SocialPostsContext.Provider>
  );
}

export function useSocialPosts() {
  const context = useContext(SocialPostsContext);
  if (context === undefined) {
    throw new Error('useSocialPosts must be used within a SocialPostsProvider');
  }
  return context;
}
