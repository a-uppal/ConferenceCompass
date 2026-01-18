import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { Post, PostEngagement } from '@/types/database';

interface PostWithEngagements extends Post {
  engagements?: PostEngagement[];
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface PostFilters {
  author: string | null;
  status: 'all' | 'scheduled' | 'published';
  platform: 'all' | 'linkedin' | 'twitter';
}

interface PostState {
  posts: PostWithEngagements[];
  isLoading: boolean;
  error: string | null;
  filters: PostFilters;
  selectedWeek: number;

  // Actions
  setFilters: (filters: Partial<PostFilters>) => void;
  setSelectedWeek: (week: number) => void;
  loadPosts: (conferenceId: string) => Promise<void>;
  updatePostStatus: (postId: string, status: Post['status'], linkedinUrl?: string) => Promise<void>;
  addEngagement: (postId: string, userId: string, type: PostEngagement['engagement_type']) => Promise<void>;
  removeEngagement: (postId: string, userId: string, type: PostEngagement['engagement_type']) => Promise<void>;
  getPostsByDate: (date: Date) => PostWithEngagements[];
  getPostsByWeek: (weekNumber: number) => PostWithEngagements[];
  getTeamEngagementStatus: (postId: string, teamMemberIds: string[]) => { userId: string; engaged: boolean }[];
}

export const usePostStore = create<PostState>()((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,
  filters: {
    author: null,
    status: 'all',
    platform: 'all',
  },
  selectedWeek: 1,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  setSelectedWeek: (week) => {
    set({ selectedWeek: week });
  },

  loadPosts: async (conferenceId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Load posts with author info and engagements
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:users!author_id (id, full_name, avatar_url),
          post_engagements (*)
        `)
        .eq('conference_id', conferenceId)
        .order('scheduled_date', { ascending: true });

      if (postsError) throw postsError;

      // Transform to match interface
      const posts: PostWithEngagements[] = (postsData || []).map((post) => ({
        ...post,
        engagements: post.post_engagements || [],
      }));

      set({ posts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updatePostStatus: async (postId: string, status: Post['status'], linkedinUrl?: string) => {
    try {
      const updates: Partial<Post> = { status };
      if (linkedinUrl) {
        updates.linkedin_url = linkedinUrl;
      }

      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, ...updates } : p
        ),
      }));

      // Log activity if published
      if (status === 'published') {
        const post = get().posts.find((p) => p.id === postId);
        if (post) {
          await supabase.from('team_activities').insert({
            team_id: post.conference_id,
            conference_id: post.conference_id,
            user_id: post.author_id,
            activity_type: 'post_published',
            entity_id: postId,
            description: `Published LinkedIn post: ${post.content_preview?.substring(0, 50) || 'New post'}...`,
          });
        }
      }
    } catch (error) {
      console.error('Error updating post status:', error);
      throw error;
    }
  },

  addEngagement: async (postId: string, userId: string, type: PostEngagement['engagement_type']) => {
    try {
      const { data, error } = await supabase
        .from('post_engagements')
        .insert({
          post_id: postId,
          user_id: userId,
          engagement_type: type,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, engagements: [...(p.engagements || []), data] }
            : p
        ),
      }));

      // Log activity
      const post = get().posts.find((p) => p.id === postId);
      if (post) {
        await supabase.from('team_activities').insert({
          team_id: post.conference_id,
          conference_id: post.conference_id,
          user_id: userId,
          activity_type: 'post_engaged',
          entity_id: postId,
          description: `${type === 'like' ? 'Liked' : type === 'comment' ? 'Commented on' : 'Shared'} team post`,
        });
      }
    } catch (error) {
      console.error('Error adding engagement:', error);
      throw error;
    }
  },

  removeEngagement: async (postId: string, userId: string, type: PostEngagement['engagement_type']) => {
    try {
      const { error } = await supabase
        .from('post_engagements')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('engagement_type', type);

      if (error) throw error;

      // Update local state
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                engagements: (p.engagements || []).filter(
                  (e) => !(e.user_id === userId && e.engagement_type === type)
                ),
              }
            : p
        ),
      }));
    } catch (error) {
      console.error('Error removing engagement:', error);
      throw error;
    }
  },

  getPostsByDate: (date: Date) => {
    const { posts, filters } = get();
    const dateStr = date.toISOString().split('T')[0];

    return posts.filter((post) => {
      // Date filter
      if (post.scheduled_date !== dateStr) return false;

      // Author filter
      if (filters.author && post.author_id !== filters.author) return false;

      // Status filter
      if (filters.status !== 'all' && post.status !== filters.status) return false;

      // Platform filter
      if (filters.platform !== 'all' && post.platform !== filters.platform) return false;

      return true;
    });
  },

  getPostsByWeek: (weekNumber: number) => {
    const { posts, filters } = get();

    return posts.filter((post) => {
      // Week filter
      if (post.week_number !== weekNumber) return false;

      // Author filter
      if (filters.author && post.author_id !== filters.author) return false;

      // Status filter
      if (filters.status !== 'all' && post.status !== filters.status) return false;

      // Platform filter
      if (filters.platform !== 'all' && post.platform !== filters.platform) return false;

      return true;
    });
  },

  getTeamEngagementStatus: (postId: string, teamMemberIds: string[]) => {
    const post = get().posts.find((p) => p.id === postId);
    if (!post) return [];

    return teamMemberIds.map((userId) => ({
      userId,
      engaged: (post.engagements || []).some((e) => e.user_id === userId),
    }));
  },
}));
