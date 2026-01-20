import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Text, Avatar, Chip, IconButton, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CampaignPost, PostStatus, PostPlatform } from '@/types/campaign';

interface PostCardProps {
  post: CampaignPost;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkPosted?: () => void;
  onSkip?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

const STATUS_CONFIG: Record<PostStatus, { color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }> = {
  draft: { color: '#64748B', icon: 'pencil-outline', label: 'Draft' },
  scheduled: { color: '#3B82F6', icon: 'clock-outline', label: 'Scheduled' },
  posted: { color: '#10B981', icon: 'check-circle', label: 'Posted' },
  published: { color: '#10B981', icon: 'check-circle', label: 'Published' },
  skipped: { color: '#EF4444', icon: 'close-circle', label: 'Skipped' },
};

const PLATFORM_CONFIG: Record<PostPlatform, { color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  linkedin: { color: '#0A66C2', icon: 'linkedin' },
  twitter: { color: '#1DA1F2', icon: 'twitter' },
  both: { color: '#8B5CF6', icon: 'share-all' },
  other: { color: '#64748B', icon: 'share' },
};

export function PostCard({
  post,
  onPress,
  onEdit,
  onDelete,
  onMarkPosted,
  onSkip,
  showActions = true,
  compact = false,
}: PostCardProps) {
  const [menuVisible, setMenuVisible] = React.useState(false);

  const statusConfig = STATUS_CONFIG[post.status];
  const platformConfig = PLATFORM_CONFIG[post.platform || 'linkedin'];

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return 'TBD';
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

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.containerCompact]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorSection}>
          {post.author?.avatar_url ? (
            <Avatar.Image size={compact ? 32 : 40} source={{ uri: post.author.avatar_url }} />
          ) : (
            <Avatar.Text
              size={compact ? 32 : 40}
              label={post.author?.full_name?.charAt(0) || '?'}
              style={{ backgroundColor: platformConfig.color }}
            />
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName} numberOfLines={1}>
              {post.author?.full_name || 'Team Member'}
            </Text>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons
                name={platformConfig.icon}
                size={12}
                color={platformConfig.color}
              />
              <Text style={styles.dateText}>
                {formatDate(post.scheduled_date)} · {formatTime(post.scheduled_time)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Chip
            style={[styles.statusChip, { backgroundColor: statusConfig.color + '20' }]}
            textStyle={[styles.statusChipText, { color: statusConfig.color }]}
            icon={() => (
              <MaterialCommunityIcons
                name={statusConfig.icon}
                size={12}
                color={statusConfig.color}
              />
            )}
          >
            {statusConfig.label}
          </Chip>

          {showActions && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              {onEdit && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onEdit();
                  }}
                  title="Edit"
                  leadingIcon="pencil"
                />
              )}
              {post.status === 'scheduled' && onMarkPosted && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onMarkPosted();
                  }}
                  title="Mark as Posted"
                  leadingIcon="check-circle"
                />
              )}
              {post.linkedin_url && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    openLinkedInPost();
                  }}
                  title="View on LinkedIn"
                  leadingIcon="linkedin"
                />
              )}
              {post.status === 'scheduled' && onSkip && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onSkip();
                  }}
                  title="Skip Post"
                  leadingIcon="skip-next"
                />
              )}
              <Divider />
              {onDelete && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onDelete();
                  }}
                  title="Delete"
                  leadingIcon="delete"
                  titleStyle={{ color: '#EF4444' }}
                />
              )}
            </Menu>
          )}
        </View>
      </View>

      {/* Phase & Theme */}
      {!compact && (post.phase || post.theme) && (
        <View style={styles.metaSection}>
          {post.phase && (
            <Chip style={styles.phaseChip} textStyle={styles.phaseChipText}>
              {post.phase.name}
            </Chip>
          )}
          {post.theme && (
            <Text style={styles.themeText} numberOfLines={1}>
              {post.theme}
            </Text>
          )}
        </View>
      )}

      {/* Content Preview */}
      {post.content && (
        <Text style={[styles.contentText, compact && styles.contentTextCompact]} numberOfLines={compact ? 2 : 4}>
          {post.content}
        </Text>
      )}

      {/* Visual Asset Indicator */}
      {!compact && post.visual_asset && (
        <View style={styles.visualIndicator}>
          <MaterialCommunityIcons name="image" size={14} color="#94A3B8" />
          <Text style={styles.visualText}>Visual attached</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {/* Week & Day */}
        <View style={styles.footerLeft}>
          {post.week_number && (
            <Text style={styles.weekText}>W{post.week_number}</Text>
          )}
          {post.day_of_week && (
            <Text style={styles.dayText}>{post.day_of_week}</Text>
          )}
        </View>

        {/* Cross-Pollination Badge */}
        {post.cross_pollination_required && (
          <View style={styles.crossPollBadge}>
            <MaterialCommunityIcons name="account-multiple" size={12} color="#0D9488" />
            <Text style={styles.crossPollText}>
              {post.cross_pollination_window_hours}h window
            </Text>
          </View>
        )}

        {/* Posted Link */}
        {post.linkedin_url && (
          <TouchableOpacity style={styles.linkedinLink} onPress={openLinkedInPost}>
            <MaterialCommunityIcons name="open-in-new" size={12} color="#0A66C2" />
            <Text style={styles.linkedinLinkText}>View</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  containerCompact: {
    padding: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    height: 26,
  },
  statusChipText: {
    fontSize: 11,
    marginLeft: -4,
  },
  metaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  phaseChip: {
    height: 24,
    backgroundColor: '#334155',
  },
  phaseChipText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  themeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  contentText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 20,
    marginTop: 10,
  },
  contentTextCompact: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  visualIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  visualText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  dayText: {
    fontSize: 11,
    color: '#64748B',
  },
  crossPollBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D948820',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  crossPollText: {
    fontSize: 10,
    color: '#0D9488',
  },
  linkedinLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkedinLinkText: {
    fontSize: 11,
    color: '#0A66C2',
    fontWeight: '500',
  },
});
