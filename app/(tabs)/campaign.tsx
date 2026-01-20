import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { useCampaign } from '@/hooks/useCampaign';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useCrossPollination } from '@/hooks/useCrossPollination';
import { ConferenceSelector } from '@/components/ConferenceSelector';
import {
  PhaseIndicator,
  CampaignStats,
  WeeklyPostsPreview,
  CrossPollinationWidget,
  TeamPersonasCard,
} from '@/components/campaign';
import { TeamPersona } from '@/types/campaign';
import { supabase } from '@/services/supabase';

export default function CampaignDashboardScreen() {
  const { user } = useAuth();
  const { activeConference, isLoading: teamLoading } = useTeam();
  const {
    phases,
    currentPhase,
    stats,
    getCurrentWeek,
    refreshPhases,
    isLoading: campaignLoading,
  } = useCampaign();
  const {
    posts,
    refreshPosts,
    isLoading: postsLoading,
  } = useSocialPosts();
  const {
    pendingTasks,
    urgentTasks,
    myPendingTasks,
    completeTask,
    refreshTasks,
    isLoading: crossPollLoading,
  } = useCrossPollination();

  const [personas, setPersonas] = useState<TeamPersona[]>([]);
  const [personasLoading, setPersonasLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentWeek = getCurrentWeek();

  // Calculate days until conference
  const getDaysUntilConference = (): number => {
    if (!activeConference) return 0;
    const now = new Date();
    const conferenceStart = new Date(activeConference.start_date);
    const diffTime = conferenceStart.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Load personas
  useEffect(() => {
    if (activeConference) {
      loadPersonas();
    }
  }, [activeConference]);

  const loadPersonas = async () => {
    if (!activeConference) return;

    setPersonasLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_personas')
        .select(`
          *,
          user:user_id (id, full_name, avatar_url)
        `)
        .eq('conference_id', activeConference.id);

      if (error) throw error;
      setPersonas(data || []);
    } catch (err) {
      console.error('[CampaignDashboard] Error loading personas:', err);
    } finally {
      setPersonasLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshPhases(),
      refreshPosts(),
      refreshTasks(),
      loadPersonas(),
    ]);
    setRefreshing(false);
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId, {});
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  const handleViewPersona = (persona: TeamPersona) => {
    // Navigate to persona detail or show modal
    console.log('View persona:', persona);
  };

  // Get this week's posts
  const thisWeekPosts = posts.filter((p) => p.week_number === Math.abs(currentWeek));

  // My pending tasks (for the current user)
  const myTasks = pendingTasks.filter((t) => t.commenter_id === user?.id);

  // Show conference selector if no conference is active
  if (!activeConference && !teamLoading) {
    return <ConferenceSelector />;
  }

  const isLoading = campaignLoading || postsLoading || crossPollLoading || personasLoading;

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading campaign data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0D9488"
          colors={['#0D9488']}
        />
      }
    >
      {/* Phase Timeline & Countdown */}
      <PhaseIndicator
        phases={phases}
        currentPhase={currentPhase}
        currentWeek={currentWeek}
        daysUntilConference={getDaysUntilConference()}
      />

      {/* Campaign Stats */}
      <CampaignStats stats={stats} />

      {/* Cross-Pollination Widget (show user's pending tasks) */}
      <CrossPollinationWidget
        pendingTasks={myTasks.length > 0 ? myTasks : pendingTasks}
        urgentTasks={urgentTasks.filter((t) => t.commenter_id === user?.id)}
        onCompleteTask={handleCompleteTask}
        onViewAll={() => router.push('/(tabs)/posts')}
      />

      {/* This Week's Posts */}
      <WeeklyPostsPreview
        posts={thisWeekPosts}
        currentWeek={currentWeek}
        onViewAll={() => router.push('/(tabs)/posts')}
      />

      {/* Team Personas */}
      <TeamPersonasCard
        personas={personas}
        onViewPersona={handleViewPersona}
      />

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  bottomPadding: {
    height: 20,
  },
});
