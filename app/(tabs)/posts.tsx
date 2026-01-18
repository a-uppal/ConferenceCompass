import { useEffect, useState } from 'react';
import { View, StyleSheet, SectionList, ScrollView, RefreshControl, Linking, Alert } from 'react-native';
import { Text, Card, Chip, Button, Avatar, Surface, IconButton, SegmentedButtons, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { usePostStore } from '@/stores/postStore';
import { Post, PostEngagement } from '@/types/database';

interface PostWithEngagements extends Post {
  engagements?: PostEngagement[];
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export default function PostsScreen() {
  const { activeConference, teamMembers } = useTeam();
  const { user } = useAuth();
  const {
    posts,
    isLoading,
    filters,
    selectedWeek,
    setFilters,
    setSelectedWeek,
    loadPosts,
    updatePostStatus,
    addEngagement,
    removeEngagement,
    getPostsByWeek,
  } = usePostStore();

  const [viewMode, setViewMode] = useState<'week' | 'calendar'>('week');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeConference) {
      loadPosts(activeConference.id);
    }
  }, [activeConference]);

  const onRefresh = async () => {
    if (!activeConference) return;
    setRefreshing(true);
    await loadPosts(activeConference.id);
    setRefreshing(false);
  };

  // Get unique weeks from posts
  const weeks = [...new Set(posts.map((p) => p.week_number || 0))].sort((a, b) => a - b);

  // Group posts by date for the selected week
  const weekPosts = getPostsByWeek(selectedWeek);
  const postsByDate = weekPosts.reduce((acc, post) => {
    const date = post.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(post);
    return acc;
  }, {} as Record<string, PostWithEngagements[]>);

  const sections = Object.entries(postsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, datePosts]) => ({
      title: formatSectionDate(date),
      data: datePosts,
    }));

  function formatSectionDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }

  function getWeekLabel(weekNum: number): string {
    if (weekNum < 0) return `Week ${weekNum} (Pre-event)`;
    if (weekNum === 0) return 'Conference Week';
    return `Week +${weekNum} (Follow-up)`;
  }

  const openLinkedIn = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    } else {
      Alert.alert('No Link', 'This post doesn\'t have a LinkedIn URL yet.');
    }
  };

  const handleMarkPublished = async (post: PostWithEngagements) => {
    Alert.prompt(
      'Post Published',
      'Enter the LinkedIn post URL:',
      async (url) => {
        if (url) {
          try {
            await updatePostStatus(post.id, 'published', url);
            Alert.alert('Success', 'Post marked as published!');
          } catch (err) {
            Alert.alert('Error', 'Failed to update post status');
          }
        }
      },
      'plain-text'
    );
  };

  const handleEngagement = async (post: PostWithEngagements, type: PostEngagement['engagement_type']) => {
    if (!user) return;

    const hasEngaged = post.engagements?.some(
      (e) => e.user_id === user.id && e.engagement_type === type
    );

    try {
      if (hasEngaged) {
        await removeEngagement(post.id, user.id, type);
      } else {
        await addEngagement(post.id, user.id, type);
        // Open LinkedIn after marking engagement
        if (post.linkedin_url) {
          openLinkedIn(post.linkedin_url);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update engagement');
    }
  };

  const getEngagementCount = (post: PostWithEngagements): number => {
    return post.engagements?.length || 0;
  };

  const hasUserEngaged = (post: PostWithEngagements): boolean => {
    return post.engagements?.some((e) => e.user_id === user?.id) || false;
  };

  const getStatusColor = (status: Post['status']): string => {
    switch (status) {
      case 'published':
        return '#10B981';
      case 'skipped':
        return '#94A3B8';
      default:
        return '#3B82F6';
    }
  };

  const renderWeekSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.weekSelector}
    >
      {weeks.map((week) => {
        const isSelected = selectedWeek === week;
        const weekPostCount = getPostsByWeek(week).length;

        return (
          <Surface
            key={week}
            style={[styles.weekCard, isSelected && styles.weekCardSelected]}
            onTouchEnd={() => setSelectedWeek(week)}
          >
            <Text style={[styles.weekNum, isSelected && styles.weekTextSelected]}>
              {week === 0 ? 'CONF' : week > 0 ? `+${week}` : week}
            </Text>
            <Text style={[styles.weekLabel, isSelected && styles.weekTextSelected]}>
              {weekPostCount} posts
            </Text>
          </Surface>
        );
      })}
    </ScrollView>
  );

  const renderPost = ({ item }: { item: PostWithEngagements }) => {
    const isMyPost = item.author_id === user?.id;
    const engagementCount = getEngagementCount(item);
    const userEngaged = hasUserEngaged(item);
    const authorInitial = item.author?.full_name?.charAt(0) || 'U';

    return (
      <Card style={styles.postCard}>
        <Card.Title
          title={item.author?.full_name || 'Team Member'}
          subtitle={item.scheduled_time ? `Scheduled: ${item.scheduled_time}` : 'Time TBD'}
          left={(props) => (
            <Avatar.Text
              {...props}
              label={authorInitial}
              style={{ backgroundColor: isMyPost ? '#0D9488' : '#3B82F6' }}
            />
          )}
          right={() => (
            <View style={styles.statusContainer}>
              <Chip
                compact
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                textStyle={styles.statusChipText}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Chip>
            </View>
          )}
        />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.contentPreview} numberOfLines={4}>
            {item.content_preview || 'No preview available'}
          </Text>

          <View style={styles.postMeta}>
            {item.post_type && (
              <Chip compact style={styles.typeChip}>
                {item.post_type}
              </Chip>
            )}
            <Chip compact style={styles.platformChip} icon="linkedin">
              {item.platform}
            </Chip>
          </View>

          {/* Team Engagement Indicator */}
          {engagementCount > 0 && (
            <View style={styles.engagementRow}>
              <MaterialCommunityIcons name="account-group" size={16} color="#10B981" />
              <Text style={styles.engagementText}>
                {engagementCount} team member{engagementCount > 1 ? 's' : ''} engaged
              </Text>
            </View>
          )}
        </Card.Content>

        <Card.Actions style={styles.cardActions}>
          {item.status === 'published' ? (
            <>
              <Button
                mode={userEngaged ? 'contained' : 'outlined'}
                compact
                onPress={() => handleEngagement(item, 'like')}
                icon={userEngaged ? 'check' : 'thumb-up'}
                style={userEngaged ? styles.engagedButton : undefined}
              >
                {userEngaged ? 'Engaged' : 'Engage'}
              </Button>
              <Button
                mode="text"
                compact
                onPress={() => openLinkedIn(item.linkedin_url)}
                icon="open-in-new"
              >
                View Post
              </Button>
            </>
          ) : isMyPost ? (
            <>
              <Button
                mode="contained"
                compact
                onPress={() => handleMarkPublished(item)}
                style={styles.publishButton}
              >
                Mark Published
              </Button>
              <Button
                mode="text"
                compact
                onPress={() => updatePostStatus(item.id, 'skipped')}
              >
                Skip
              </Button>
            </>
          ) : (
            <Text style={styles.scheduledHint}>
              📅 Scheduled for {item.author?.full_name?.split(' ')[0]}
            </Text>
          )}
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(v) => setViewMode(v as 'week' | 'calendar')}
          buttons={[
            { value: 'week', label: 'By Week', icon: 'view-week' },
            { value: 'calendar', label: 'Calendar', icon: 'calendar' },
          ]}
          style={styles.segmented}
        />
      </View>

      {/* Week Selector */}
      {weeks.length > 0 && renderWeekSelector()}

      {/* Filter Row */}
      <View style={styles.filterRow}>
        <Chip
          style={[styles.chip, filters.status === 'all' && styles.chipSelected]}
          selected={filters.status === 'all'}
          onPress={() => setFilters({ status: 'all' })}
        >
          All
        </Chip>
        <Chip
          style={[styles.chip, filters.status === 'scheduled' && styles.chipSelected]}
          selected={filters.status === 'scheduled'}
          onPress={() => setFilters({ status: 'scheduled' })}
        >
          Scheduled
        </Chip>
        <Chip
          style={[styles.chip, filters.status === 'published' && styles.chipSelected]}
          selected={filters.status === 'published'}
          onPress={() => setFilters({ status: 'published' })}
        >
          Published
        </Chip>
      </View>

      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="linkedin" size={64} color="#94A3B8" />
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Posts Scheduled
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Import your LOTF Strategy Excel to populate the post calendar with scheduled LinkedIn content.
          </Text>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Posts This Week
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Select a different week or adjust filters.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D9488"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  controls: {
    padding: 16,
    paddingBottom: 8,
  },
  segmented: {
    backgroundColor: '#1E293B',
  },
  weekSelector: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  weekCard: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  weekCardSelected: {
    backgroundColor: '#0D9488',
  },
  weekNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  weekLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  weekTextSelected: {
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1E293B',
  },
  chipSelected: {
    backgroundColor: '#0D9488',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  postCard: {
    marginBottom: 12,
  },
  statusContainer: {
    marginRight: 8,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 11,
  },
  contentPreview: {
    lineHeight: 22,
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    backgroundColor: '#1E293B',
    height: 24,
  },
  platformChip: {
    backgroundColor: '#0A66C2',
    height: 24,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  engagementText: {
    color: '#10B981',
    fontSize: 13,
  },
  cardActions: {
    justifyContent: 'flex-start',
  },
  engagedButton: {
    backgroundColor: '#10B981',
  },
  publishButton: {
    backgroundColor: '#0D9488',
  },
  scheduledHint: {
    color: '#94A3B8',
    fontSize: 13,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 12,
    backgroundColor: '#0F172A',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
  },
});
