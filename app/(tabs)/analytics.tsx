import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Divider, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTeam } from '@/hooks/useTeam';
import { useCampaign } from '@/hooks/useCampaign';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useCrossPollination } from '@/hooks/useCrossPollination';
import { ConferenceSelector } from '@/components/ConferenceSelector';
import {
  BarChart,
  StatsGrid,
  HorizontalProgress,
  WeeklyHeatmap,
} from '@/components/campaign/AnalyticsCharts';
import { CampaignPost, DayOfWeek } from '@/types/campaign';

type TimeRange = 'week' | 'phase' | 'all';

export default function AnalyticsScreen() {
  const { activeConference, isLoading: teamLoading } = useTeam();
  const { phases, currentPhase, stats, getCurrentWeek } = useCampaign();
  const { posts, refreshPosts } = useSocialPosts();
  const { tasks, refreshTasks } = useCrossPollination();

  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const currentWeek = getCurrentWeek();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshPosts(), refreshTasks()]);
    setRefreshing(false);
  }, [refreshPosts, refreshTasks]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!posts.length) {
      return {
        postsByStatus: [],
        postsByPhase: [],
        postsByAuthor: [],
        weeklyActivity: [],
        crossPollinationRate: 0,
        avgPostsPerWeek: 0,
        topPerformer: null,
      };
    }

    // Filter posts by time range
    let filteredPosts = posts;
    if (timeRange === 'week') {
      filteredPosts = posts.filter((p) => p.week_number === currentWeek);
    } else if (timeRange === 'phase' && currentPhase) {
      filteredPosts = posts.filter((p) => p.phase_id === currentPhase.id);
    }

    // Posts by status
    const statusCounts = {
      draft: filteredPosts.filter((p) => p.status === 'draft').length,
      scheduled: filteredPosts.filter((p) => p.status === 'scheduled').length,
      posted: filteredPosts.filter((p) => p.status === 'posted' || p.status === 'published').length,
      skipped: filteredPosts.filter((p) => p.status === 'skipped').length,
    };

    const postsByStatus = [
      { label: 'Draft', value: statusCounts.draft, color: '#64748B' },
      { label: 'Scheduled', value: statusCounts.scheduled, color: '#F59E0B' },
      { label: 'Posted', value: statusCounts.posted, color: '#10B981' },
      { label: 'Skipped', value: statusCounts.skipped, color: '#EF4444' },
    ];

    // Posts by phase
    const postsByPhase = phases.map((phase) => ({
      label: phase.name.substring(0, 6),
      value: posts.filter((p) => p.phase_id === phase.id).length,
      color: getPhaseColor(phase.name),
    }));

    // Posts by author
    const authorMap = new Map<string, { name: string; count: number }>();
    filteredPosts.forEach((post) => {
      const authorName = post.author?.full_name || 'Unknown';
      const authorId = post.author_id;
      if (authorMap.has(authorId)) {
        authorMap.get(authorId)!.count++;
      } else {
        authorMap.set(authorId, { name: authorName, count: 1 });
      }
    });

    const postsByAuthor = Array.from(authorMap.values())
      .sort((a, b) => b.count - a.count)
      .map((author) => ({
        label: author.name.split(' ')[0],
        value: author.count,
        color: '#0D9488',
      }));

    // Weekly activity heatmap
    const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyActivity = days.map((day) => {
      const dayPosts = filteredPosts.filter((p) => p.day_of_week === day);
      return {
        day,
        posts: dayPosts.length,
        engagement: dayPosts.filter((p) => p.status === 'posted' || p.status === 'published').length,
      };
    });

    // Cross-pollination rate
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const crossPollinationRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Average posts per week
    const weekNumbers = [...new Set(posts.map((p) => p.week_number).filter(Boolean))];
    const avgPostsPerWeek = weekNumbers.length > 0 ? posts.length / weekNumbers.length : 0;

    // Top performer
    const topPerformer = postsByAuthor.length > 0 ? postsByAuthor[0] : null;

    return {
      postsByStatus,
      postsByPhase,
      postsByAuthor,
      weeklyActivity,
      crossPollinationRate,
      avgPostsPerWeek,
      topPerformer,
    };
  }, [posts, tasks, phases, currentPhase, timeRange, currentWeek]);

  // Show conference selector if no conference is active
  if (!activeConference && !teamLoading) {
    return <ConferenceSelector />;
  }

  const overviewStats = [
    {
      label: 'Total Posts',
      value: posts.length,
      color: '#F8FAFC',
    },
    {
      label: 'Posted',
      value: posts.filter((p) => p.status === 'posted' || p.status === 'published').length,
      color: '#10B981',
    },
    {
      label: 'Pending',
      value: posts.filter((p) => p.status === 'draft' || p.status === 'scheduled').length,
      color: '#F59E0B',
    },
    {
      label: 'Compliance',
      value: `${Math.round(analyticsData.crossPollinationRate)}%`,
      color: analyticsData.crossPollinationRate >= 80 ? '#10B981' : '#F59E0B',
    },
  ];

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
      {/* Time Range Filter */}
      <View style={styles.filterSection}>
        <SegmentedButtons
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as TimeRange)}
          buttons={[
            { value: 'week', label: 'This Week' },
            { value: 'phase', label: 'Current Phase' },
            { value: 'all', label: 'All Time' },
          ]}
          style={styles.segmented}
        />
      </View>

      {/* Overview Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Campaign Overview</Text>
        <StatsGrid stats={overviewStats} columns={4} />
      </View>

      {/* Current Phase Progress */}
      {currentPhase && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.phaseHeader}>
              <MaterialCommunityIcons
                name="flag"
                size={20}
                color={getPhaseColor(currentPhase.name)}
              />
              <Text style={styles.cardTitle}>Current Phase: {currentPhase.name}</Text>
            </View>
            <Text style={styles.phaseGoal}>{currentPhase.goal}</Text>
            <View style={styles.phaseProgress}>
              <HorizontalProgress
                label="Phase Posts"
                value={posts.filter((p) => p.phase_id === currentPhase.id).length}
                maxValue={getPhaseTarget(currentPhase.name)}
                color={getPhaseColor(currentPhase.name)}
              />
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Posts by Status */}
      <View style={styles.section}>
        <BarChart data={analyticsData.postsByStatus} title="Posts by Status" height={180} />
      </View>

      {/* Weekly Activity */}
      <View style={styles.section}>
        <WeeklyHeatmap data={analyticsData.weeklyActivity} title="Weekly Posting Activity" />
      </View>

      {/* Posts by Phase */}
      {analyticsData.postsByPhase.length > 0 && (
        <View style={styles.section}>
          <BarChart data={analyticsData.postsByPhase} title="Posts by Phase" height={180} />
        </View>
      )}

      {/* Cross-Pollination Stats */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="bee-flower" size={20} color="#0D9488" />
            <Text style={styles.cardTitle}>Cross-Pollination Performance</Text>
          </View>
          <Divider style={styles.divider} />

          <HorizontalProgress
            label="Completed Tasks"
            value={tasks.filter((t) => t.status === 'completed').length}
            maxValue={tasks.length || 1}
            color="#10B981"
          />
          <HorizontalProgress
            label="Pending Tasks"
            value={tasks.filter((t) => t.status === 'pending').length}
            maxValue={tasks.length || 1}
            color="#F59E0B"
          />
          <HorizontalProgress
            label="Missed Tasks"
            value={tasks.filter((t) => t.status === 'missed').length}
            maxValue={tasks.length || 1}
            color="#EF4444"
          />

          <View style={styles.complianceRow}>
            <Text style={styles.complianceLabel}>Overall Compliance Rate</Text>
            <Text
              style={[
                styles.complianceValue,
                {
                  color:
                    analyticsData.crossPollinationRate >= 80
                      ? '#10B981'
                      : analyticsData.crossPollinationRate >= 50
                      ? '#F59E0B'
                      : '#EF4444',
                },
              ]}
            >
              {Math.round(analyticsData.crossPollinationRate)}%
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Team Performance */}
      {analyticsData.postsByAuthor.length > 0 && (
        <View style={styles.section}>
          <BarChart data={analyticsData.postsByAuthor} title="Posts by Team Member" height={180} />
        </View>
      )}

      {/* Key Insights */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lightbulb" size={20} color="#F59E0B" />
            <Text style={styles.cardTitle}>Key Insights</Text>
          </View>
          <Divider style={styles.divider} />

          <View style={styles.insightsList}>
            <InsightItem
              icon="chart-line"
              text={`Average ${analyticsData.avgPostsPerWeek.toFixed(1)} posts per week`}
              type={analyticsData.avgPostsPerWeek >= 3 ? 'positive' : 'neutral'}
            />
            {analyticsData.topPerformer && (
              <InsightItem
                icon="trophy"
                text={`Top contributor: ${analyticsData.topPerformer.label} (${analyticsData.topPerformer.value} posts)`}
                type="positive"
              />
            )}
            <InsightItem
              icon="bee"
              text={
                analyticsData.crossPollinationRate >= 80
                  ? 'Excellent cross-pollination compliance!'
                  : analyticsData.crossPollinationRate >= 50
                  ? 'Cross-pollination needs improvement'
                  : 'Critical: Cross-pollination rate too low'
              }
              type={
                analyticsData.crossPollinationRate >= 80
                  ? 'positive'
                  : analyticsData.crossPollinationRate >= 50
                  ? 'neutral'
                  : 'negative'
              }
            />
            {currentPhase && (
              <InsightItem
                icon="calendar-check"
                text={`Currently in ${currentPhase.name} phase (Week ${currentWeek})`}
                type="neutral"
              />
            )}
          </View>
        </Card.Content>
      </Card>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// Helper component for insights
function InsightItem({
  icon,
  text,
  type,
}: {
  icon: string;
  text: string;
  type: 'positive' | 'neutral' | 'negative';
}) {
  const color =
    type === 'positive' ? '#10B981' : type === 'negative' ? '#EF4444' : '#94A3B8';

  return (
    <View style={styles.insightItem}>
      <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      <Text style={[styles.insightText, { color }]}>{text}</Text>
    </View>
  );
}

// Helper functions
function getPhaseColor(phaseName: string): string {
  const colors: Record<string, string> = {
    Agitate: '#EF4444',
    Educate: '#3B82F6',
    Hype: '#F59E0B',
    Conference: '#10B981',
    'Follow-Up': '#8B5CF6',
  };
  return colors[phaseName] || '#0D9488';
}

function getPhaseTarget(phaseName: string): number {
  const targets: Record<string, number> = {
    Agitate: 6,
    Educate: 6,
    Hype: 5,
    Conference: 20,
    'Follow-Up': 9,
  };
  return targets[phaseName] || 10;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  filterSection: {
    padding: 16,
  },
  segmented: {
    backgroundColor: '#1E293B',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseGoal: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 16,
  },
  phaseProgress: {
    marginTop: 8,
  },
  divider: {
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  complianceLabel: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  complianceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insightText: {
    fontSize: 13,
    flex: 1,
  },
});
