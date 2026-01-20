import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { useTeam } from '@/hooks/useTeam';
import {
  CampaignPhase,
  CampaignPhaseInsert,
  CampaignStats,
  UseCampaignReturn,
} from '@/types/campaign';

interface CampaignContextType extends UseCampaignReturn {
  createPhase: (data: CampaignPhaseInsert) => Promise<CampaignPhase>;
  updatePhase: (id: string, data: Partial<CampaignPhase>) => Promise<CampaignPhase>;
  deletePhase: (id: string) => Promise<void>;
  getCurrentWeek: () => number;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

interface CampaignProviderProps {
  children: ReactNode;
}

export function CampaignProvider({ children }: CampaignProviderProps) {
  const { activeConference } = useTeam();
  const [phases, setPhases] = useState<CampaignPhase[]>([]);
  const [currentPhase, setCurrentPhase] = useState<CampaignPhase | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Calculate current week relative to conference start
  const getCurrentWeek = useCallback((): number => {
    if (!activeConference) return 0;

    const now = new Date();
    const conferenceStart = new Date(activeConference.start_date);
    const diffTime = conferenceStart.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Negative weeks before conference, positive during/after
    const weeksUntil = Math.ceil(diffDays / 7);

    // Return week number (e.g., -8 means 8 weeks before conference)
    return -weeksUntil;
  }, [activeConference]);

  // Load phases when conference changes
  useEffect(() => {
    if (activeConference) {
      loadPhases();
      loadStats();
    } else {
      setPhases([]);
      setCurrentPhase(null);
      setStats(null);
      setIsLoading(false);
    }
  }, [activeConference]);

  // Determine current phase based on week
  useEffect(() => {
    if (phases.length > 0) {
      const week = getCurrentWeek();
      const active = phases.find(
        (p) => week >= p.week_start && week <= p.week_end
      );
      setCurrentPhase(active || null);
    }
  }, [phases, getCurrentWeek]);

  const loadPhases = async () => {
    if (!activeConference) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('campaign_phases')
        .select('*')
        .eq('conference_id', activeConference.id)
        .order('order_index', { ascending: true });

      if (fetchError) throw fetchError;
      setPhases(data || []);
    } catch (err) {
      console.error('[useCampaign] Error loading phases:', err);
      setError(err instanceof Error ? err : new Error('Failed to load phases'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!activeConference) return;

    try {
      // Use the database function if available, otherwise calculate manually
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_campaign_stats', { conf_id: activeConference.id });

      if (statsError) {
        // Fallback to manual calculation
        const stats = await calculateStatsManually();
        setStats(stats);
      } else if (statsData && statsData.length > 0) {
        const row = statsData[0];
        setStats({
          total_posts: row.total_posts || 0,
          draft_posts: row.draft_posts || 0,
          scheduled_posts: row.scheduled_posts || 0,
          posted_posts: row.posted_posts || 0,
          cross_pollination_pending: row.cross_pollination_pending || 0,
          cross_pollination_completed: row.cross_pollination_completed || 0,
          cross_pollination_missed: row.cross_pollination_missed || 0,
          cross_pollination_compliance_rate: row.cross_pollination_compliance_rate || 0,
        });
      }
    } catch (err) {
      console.error('[useCampaign] Error loading stats:', err);
      // Don't set error for stats - just log it
    }
  };

  const calculateStatsManually = async (): Promise<CampaignStats> => {
    if (!activeConference) {
      return {
        total_posts: 0,
        draft_posts: 0,
        scheduled_posts: 0,
        posted_posts: 0,
        cross_pollination_pending: 0,
        cross_pollination_completed: 0,
        cross_pollination_missed: 0,
        cross_pollination_compliance_rate: 0,
      };
    }

    // Get post counts
    const { data: posts } = await supabase
      .from('posts')
      .select('status')
      .eq('conference_id', activeConference.id);

    const postStats = (posts || []).reduce(
      (acc, post) => {
        acc.total++;
        if (post.status === 'draft') acc.draft++;
        else if (post.status === 'scheduled') acc.scheduled++;
        else if (post.status === 'posted' || post.status === 'published') acc.posted++;
        return acc;
      },
      { total: 0, draft: 0, scheduled: 0, posted: 0 }
    );

    // Get cross-pollination counts
    const { data: crossPoll } = await supabase
      .from('cross_pollination')
      .select('status, post_id!inner(conference_id)')
      .eq('post_id.conference_id', activeConference.id);

    const cpStats = (crossPoll || []).reduce(
      (acc, task) => {
        if (task.status === 'pending') acc.pending++;
        else if (task.status === 'completed') acc.completed++;
        else if (task.status === 'missed') acc.missed++;
        return acc;
      },
      { pending: 0, completed: 0, missed: 0 }
    );

    const totalCp = cpStats.pending + cpStats.completed + cpStats.missed;
    const complianceRate = totalCp > 0 ? (cpStats.completed / totalCp) * 100 : 0;

    return {
      total_posts: postStats.total,
      draft_posts: postStats.draft,
      scheduled_posts: postStats.scheduled,
      posted_posts: postStats.posted,
      cross_pollination_pending: cpStats.pending,
      cross_pollination_completed: cpStats.completed,
      cross_pollination_missed: cpStats.missed,
      cross_pollination_compliance_rate: Math.round(complianceRate * 100) / 100,
    };
  };

  const createPhase = async (data: CampaignPhaseInsert): Promise<CampaignPhase> => {
    const { data: phase, error: createError } = await supabase
      .from('campaign_phases')
      .insert(data)
      .select()
      .single();

    if (createError) throw createError;

    await loadPhases();
    return phase;
  };

  const updatePhase = async (
    id: string,
    data: Partial<CampaignPhase>
  ): Promise<CampaignPhase> => {
    const { data: phase, error: updateError } = await supabase
      .from('campaign_phases')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    await loadPhases();
    return phase;
  };

  const deletePhase = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('campaign_phases')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await loadPhases();
  };

  const refreshPhases = async (): Promise<void> => {
    await loadPhases();
    await loadStats();
  };

  const value: CampaignContextType = {
    phases,
    currentPhase,
    stats,
    isLoading,
    error,
    refreshPhases,
    createPhase,
    updatePhase,
    deletePhase,
    getCurrentWeek,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
}
