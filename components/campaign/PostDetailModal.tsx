import React from 'react';
import { View, StyleSheet, ScrollView, Linking, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, Avatar, Chip, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CampaignPost, CrossPollinationTask, PostStatus, PostPlatform } from '@/types/campaign';

interface PostDetailModalProps {
  visible: boolean;
  post: CampaignPost | null;
  crossPollinationTasks?: CrossPollinationTask[];
  onClose: () => void;
  onEdit?: () => void;
  onMarkPosted?: () => void;
  onSkip?: () => void;
  onDelete?: () => void;
}

const STATUS_CONFIG: Record<PostStatus, { color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }> = {
  draft: { color: '#64748B', icon: 'pencil-outline', label: 'Draft' },
  scheduled: { color: '#3B82F6', icon: 'clock-outline', label: 'Scheduled' },
  posted: { color: '#10B981', icon: 'check-circle', label: 'Posted' },
  published: { color: '#10B981', icon: 'check-circle', label: 'Published' },
  skipped: { color: '#EF4444', icon: 'close-circle', label: 'Skipped' },
};

const PLATFORM_CONFIG: Record<PostPlatform, { color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }> = {
  linkedin: { color: '#0A66C2', icon: 'linkedin', label: 'LinkedIn' },
  twitter: { color: '#1DA1F2', icon: 'twitter', label: 'Twitter' },
  both: { color: '#8B5CF6', icon: 'share-all', label: 'LinkedIn & Twitter' },
  other: { color: '#64748B', icon: 'share', label: 'Other' },
};

export function PostDetailModal({
  visible,
  post,
  crossPollinationTasks = [],
  onClose,
  onEdit,
  onMarkPosted,
  onSkip,
  onDelete,
}: PostDetailModalProps) {
  if (!post) return null;

  const statusConfig = STATUS_CONFIG[post.status];
  const platformConfig = PLATFORM_CONFIG[post.platform || 'linkedin'];

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return 'Time not set';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const openLinkedInPost = async () => {
    if (post.linkedin_url) {
      await Linking.openURL(post.linkedin_url);
    }
  };

  const pendingTasks = crossPollinationTasks.filter((t) => t.status === 'pending');
  const completedTasks = crossPollinationTasks.filter((t) => t.status === 'completed');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton icon="close" size={24} onPress={onClose} />
          <Text style={styles.headerTitle}>Post Details</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status & Platform */}
          <View style={styles.statusRow}>
            <Chip
              style={[styles.statusChip, { backgroundColor: statusConfig.color + '20' }]}
              textStyle={[styles.statusChipText, { color: statusConfig.color }]}
              icon={() => (
                <MaterialCommunityIcons
                  name={statusConfig.icon}
                  size={16}
                  color={statusConfig.color}
                />
              )}
            >
              {statusConfig.label}
            </Chip>
            <Chip
              style={[styles.platformChip, { backgroundColor: platformConfig.color + '20' }]}
              textStyle={[styles.platformChipText, { color: platformConfig.color }]}
              icon={() => (
                <MaterialCommunityIcons
                  name={platformConfig.icon}
                  size={16}
                  color={platformConfig.color}
                />
              )}
            >
              {platformConfig.label}
            </Chip>
          </View>

          {/* Author */}
          <View style={styles.authorSection}>
            {post.author?.avatar_url ? (
              <Avatar.Image size={48} source={{ uri: post.author.avatar_url }} />
            ) : (
              <Avatar.Text
                size={48}
                label={post.author?.full_name?.charAt(0) || '?'}
                style={{ backgroundColor: platformConfig.color }}
              />
            )}
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {post.author?.full_name || 'Team Member'}
              </Text>
              <Text style={styles.authorRole}>Author</Text>
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.scheduleGrid}>
              <View style={styles.scheduleItem}>
                <MaterialCommunityIcons name="calendar" size={20} color="#0D9488" />
                <View>
                  <Text style={styles.scheduleLabel}>Date</Text>
                  <Text style={styles.scheduleValue}>{formatDate(post.scheduled_date)}</Text>
                </View>
              </View>
              <View style={styles.scheduleItem}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#0D9488" />
                <View>
                  <Text style={styles.scheduleLabel}>Time</Text>
                  <Text style={styles.scheduleValue}>{formatTime(post.scheduled_time)}</Text>
                </View>
              </View>
              {post.week_number && (
                <View style={styles.scheduleItem}>
                  <MaterialCommunityIcons name="calendar-week" size={20} color="#0D9488" />
                  <View>
                    <Text style={styles.scheduleLabel}>Week</Text>
                    <Text style={styles.scheduleValue}>Week {post.week_number}</Text>
                  </View>
                </View>
              )}
              {post.day_of_week && (
                <View style={styles.scheduleItem}>
                  <MaterialCommunityIcons name="calendar-today" size={20} color="#0D9488" />
                  <View>
                    <Text style={styles.scheduleLabel}>Day</Text>
                    <Text style={styles.scheduleValue}>{post.day_of_week}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Phase & Theme */}
          {(post.phase || post.theme) && (
            <View style={styles.section}>
              {post.phase && (
                <View style={styles.phaseRow}>
                  <Text style={styles.sectionTitle}>Campaign Phase</Text>
                  <Chip style={styles.phaseChip}>
                    {post.phase.name}
                  </Chip>
                </View>
              )}
              {post.theme && (
                <>
                  <Text style={styles.themeLabel}>Theme / Hook</Text>
                  <Text style={styles.themeValue}>{post.theme}</Text>
                </>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Post Content</Text>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{post.content}</Text>
            </View>
            {post.content && (
              <Text style={styles.charCount}>
                {post.content.length} characters
              </Text>
            )}
          </View>

          {/* Visual Asset */}
          {post.visual_asset && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Visual Asset</Text>
              <View style={styles.visualBox}>
                <MaterialCommunityIcons name="image" size={24} color="#94A3B8" />
                <Text style={styles.visualText}>{post.visual_asset}</Text>
              </View>
            </View>
          )}

          {/* Cross-Pollination */}
          {post.cross_pollination_required && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cross-Pollination</Text>
              <View style={styles.crossPollInfo}>
                <View style={styles.crossPollStat}>
                  <Text style={styles.crossPollStatValue}>{post.cross_pollination_window_hours}h</Text>
                  <Text style={styles.crossPollStatLabel}>Window</Text>
                </View>
                <View style={styles.crossPollStat}>
                  <Text style={styles.crossPollStatValue}>{pendingTasks.length}</Text>
                  <Text style={styles.crossPollStatLabel}>Pending</Text>
                </View>
                <View style={styles.crossPollStat}>
                  <Text style={[styles.crossPollStatValue, { color: '#10B981' }]}>
                    {completedTasks.length}
                  </Text>
                  <Text style={styles.crossPollStatLabel}>Completed</Text>
                </View>
              </View>

              {crossPollinationTasks.length > 0 && (
                <View style={styles.tasksList}>
                  {crossPollinationTasks.map((task) => (
                    <View key={task.id} style={styles.taskItem}>
                      {task.commenter?.avatar_url ? (
                        <Avatar.Image size={24} source={{ uri: task.commenter.avatar_url }} />
                      ) : (
                        <Avatar.Text
                          size={24}
                          label={task.commenter?.full_name?.charAt(0) || '?'}
                        />
                      )}
                      <Text style={styles.taskName}>{task.commenter?.full_name}</Text>
                      <Chip
                        style={[
                          styles.taskStatusChip,
                          task.status === 'completed' && styles.taskStatusCompleted,
                          task.status === 'missed' && styles.taskStatusMissed,
                        ]}
                        textStyle={styles.taskStatusText}
                      >
                        {task.status}
                      </Chip>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* LinkedIn URL */}
          {post.linkedin_url && (
            <View style={styles.section}>
              <Button
                mode="outlined"
                icon="linkedin"
                onPress={openLinkedInPost}
                style={styles.linkedinButton}
              >
                View on LinkedIn
              </Button>
            </View>
          )}

          {/* Posted Timestamp */}
          {post.posted_at && (
            <View style={styles.postedInfo}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
              <Text style={styles.postedText}>
                Posted on {new Date(post.posted_at).toLocaleString()}
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {post.status === 'draft' && onEdit && (
            <Button mode="contained" onPress={onEdit} style={styles.actionButton}>
              Edit Post
            </Button>
          )}
          {post.status === 'scheduled' && (
            <>
              {onMarkPosted && (
                <Button
                  mode="contained"
                  onPress={onMarkPosted}
                  style={[styles.actionButton, styles.postedButton]}
                  icon="check-circle"
                >
                  Mark as Posted
                </Button>
              )}
              {onEdit && (
                <Button mode="outlined" onPress={onEdit} style={styles.actionButtonSmall}>
                  Edit
                </Button>
              )}
              {onSkip && (
                <Button
                  mode="outlined"
                  onPress={onSkip}
                  style={styles.actionButtonSmall}
                  textColor="#EF4444"
                >
                  Skip
                </Button>
              )}
            </>
          )}
          {(post.status === 'posted' || post.status === 'published') && post.linkedin_url && (
            <Button
              mode="contained"
              onPress={openLinkedInPost}
              style={[styles.actionButton, { backgroundColor: '#0A66C2' }]}
              icon="linkedin"
            >
              View on LinkedIn
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statusChip: {
    height: 32,
  },
  statusChipText: {
    fontSize: 13,
  },
  platformChip: {
    height: 32,
  },
  platformChipText: {
    fontSize: 13,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  authorRole: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    minWidth: '45%',
  },
  scheduleLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  scheduleValue: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseChip: {
    backgroundColor: '#334155',
  },
  themeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  themeValue: {
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  contentBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 8,
  },
  visualBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  visualText: {
    fontSize: 14,
    color: '#CBD5E1',
    flex: 1,
  },
  crossPollInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  crossPollStat: {
    alignItems: 'center',
  },
  crossPollStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  crossPollStatLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tasksList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  taskName: {
    flex: 1,
    fontSize: 13,
    color: '#F8FAFC',
  },
  taskStatusChip: {
    height: 24,
    backgroundColor: '#F59E0B20',
  },
  taskStatusCompleted: {
    backgroundColor: '#10B98120',
  },
  taskStatusMissed: {
    backgroundColor: '#EF444420',
  },
  taskStatusText: {
    fontSize: 10,
  },
  linkedinButton: {
    borderColor: '#0A66C2',
  },
  postedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  postedText: {
    fontSize: 13,
    color: '#10B981',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#0D9488',
  },
  postedButton: {
    backgroundColor: '#10B981',
  },
  actionButtonSmall: {
    flex: 0.5,
    borderColor: '#334155',
  },
});
