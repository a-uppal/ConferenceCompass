import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Avatar, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CampaignPost, DayOfWeek, PostStatus } from '@/types/campaign';

interface WeeklyPostsPreviewProps {
  posts: CampaignPost[];
  currentWeek: number;
  onViewAll?: () => void;
}

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: '#64748B',
  scheduled: '#3B82F6',
  posted: '#10B981',
  published: '#10B981',
  skipped: '#EF4444',
};

const STATUS_ICONS: Record<PostStatus, keyof typeof MaterialCommunityIcons.glyphMap> = {
  draft: 'pencil-outline',
  scheduled: 'clock-outline',
  posted: 'check-circle',
  published: 'check-circle',
  skipped: 'close-circle',
};

const PLATFORM_COLORS = {
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
  both: '#8B5CF6',
  other: '#64748B',
};

export function WeeklyPostsPreview({ posts, currentWeek, onViewAll }: WeeklyPostsPreviewProps) {
  // Group posts by day
  const postsByDay = DAYS.reduce((acc, day) => {
    acc[day] = posts.filter((p) => p.day_of_week === day);
    return acc;
  }, {} as Record<DayOfWeek, CampaignPost[]>);

  // Get today's day of week
  const today = new Date();
  const todayIndex = today.getDay();
  const todayDay = DAYS[(todayIndex + 6) % 7]; // Convert Sunday=0 to Mon-based

  return (
    <Card style={styles.container}>
      <Card.Title
        title={`Week ${Math.abs(currentWeek)} Posts`}
        subtitle={`${posts.length} posts scheduled`}
        left={(props) => (
          <MaterialCommunityIcons name="calendar-week" size={24} color="#0D9488" />
        )}
      />
      <Card.Content>
        {/* Day Grid */}
        <View style={styles.dayGrid}>
          {DAYS.map((day) => {
            const dayPosts = postsByDay[day];
            const isToday = day === todayDay;
            const hasPosted = dayPosts.some((p) => p.status === 'posted' || p.status === 'published');
            const hasPending = dayPosts.some((p) => p.status === 'scheduled');

            return (
              <View
                key={day}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isToday && styles.todayLabel,
                  ]}
                >
                  {day}
                </Text>
                <View style={styles.dayIndicators}>
                  {dayPosts.length === 0 ? (
                    <View style={styles.emptyDot} />
                  ) : (
                    dayPosts.slice(0, 3).map((post, idx) => (
                      <View
                        key={post.id}
                        style={[
                          styles.postDot,
                          { backgroundColor: STATUS_COLORS[post.status] },
                        ]}
                      />
                    ))
                  )}
                  {dayPosts.length > 3 && (
                    <Text style={styles.morePosts}>+{dayPosts.length - 3}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Today's Posts Detail */}
        {posts.filter((p) => p.day_of_week === todayDay).length > 0 && (
          <View style={styles.todaySection}>
            <Text style={styles.todaySectionTitle}>Today's Posts</Text>
            {posts
              .filter((p) => p.day_of_week === todayDay)
              .slice(0, 2)
              .map((post) => (
                <PostPreviewCard key={post.id} post={post} />
              ))}
          </View>
        )}

        {/* Upcoming Posts */}
        {posts.filter((p) => p.status === 'scheduled').length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.upcomingSectionTitle}>Upcoming</Text>
            {posts
              .filter((p) => p.status === 'scheduled')
              .slice(0, 2)
              .map((post) => (
                <PostPreviewCard key={post.id} post={post} compact />
              ))}
          </View>
        )}
      </Card.Content>
      <Card.Actions>
        <Button onPress={onViewAll || (() => router.push('/(tabs)/posts'))}>
          View All Posts
        </Button>
      </Card.Actions>
    </Card>
  );
}

interface PostPreviewCardProps {
  post: CampaignPost;
  compact?: boolean;
}

function PostPreviewCard({ post, compact }: PostPreviewCardProps) {
  const platformColor = PLATFORM_COLORS[post.platform || 'linkedin'];

  return (
    <TouchableOpacity style={[styles.postCard, compact && styles.postCardCompact]}>
      <View style={styles.postHeader}>
        {post.author?.avatar_url ? (
          <Avatar.Image size={compact ? 24 : 32} source={{ uri: post.author.avatar_url }} />
        ) : (
          <Avatar.Text
            size={compact ? 24 : 32}
            label={post.author?.full_name?.charAt(0) || '?'}
            style={{ backgroundColor: platformColor }}
          />
        )}
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor} numberOfLines={1}>
            {post.author?.full_name || 'Team Member'}
          </Text>
          {!compact && (
            <View style={styles.postMetaRow}>
              <MaterialCommunityIcons
                name={post.platform === 'linkedin' ? 'linkedin' : post.platform === 'twitter' ? 'twitter' : 'share'}
                size={12}
                color={platformColor}
              />
              <Text style={styles.postTime}>
                {post.scheduled_time || 'TBD'}
              </Text>
            </View>
          )}
        </View>
        <Chip
          style={[styles.statusChip, { backgroundColor: STATUS_COLORS[post.status] + '30' }]}
          textStyle={[styles.statusChipText, { color: STATUS_COLORS[post.status] }]}
          icon={() => (
            <MaterialCommunityIcons
              name={STATUS_ICONS[post.status]}
              size={12}
              color={STATUS_COLORS[post.status]}
            />
          )}
        >
          {post.status}
        </Chip>
      </View>

      {!compact && post.theme && (
        <Text style={styles.postTheme} numberOfLines={1}>
          {post.theme}
        </Text>
      )}

      {!compact && post.content && (
        <Text style={styles.postContent} numberOfLines={2}>
          {post.content}
        </Text>
      )}

      {post.cross_pollination_required && (
        <View style={styles.crossPollBadge}>
          <MaterialCommunityIcons name="account-multiple" size={10} color="#0D9488" />
          <Text style={styles.crossPollText}>Cross-poll required</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
  },
  dayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayCell: {
    backgroundColor: '#0D948820',
  },
  dayLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 6,
  },
  todayLabel: {
    color: '#0D9488',
    fontWeight: '700',
  },
  dayIndicators: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    minHeight: 12,
  },
  postDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  morePosts: {
    fontSize: 9,
    color: '#64748B',
    marginLeft: 2,
  },
  todaySection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  todaySectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
    marginBottom: 8,
  },
  upcomingSection: {
    marginTop: 12,
  },
  upcomingSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  postCard: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  postCardCompact: {
    padding: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postMeta: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  postTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: 10,
    marginLeft: -4,
  },
  postTheme: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 10,
  },
  postContent: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  crossPollBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  crossPollText: {
    fontSize: 10,
    color: '#0D9488',
  },
});
