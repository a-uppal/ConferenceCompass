import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Avatar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Contact } from '@/types/database';

interface Props {
  contact: Contact;
  onPress: () => void;
  showPriority?: boolean;
  compact?: boolean;
}

export function FollowUpCard({
  contact,
  onPress,
  showPriority = true,
  compact = false,
}: Props) {
  const initials = `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();

  const getStatusColor = () => {
    switch (contact.follow_up_status) {
      case 'completed':
        return '#10B981'; // Green
      case 'pending':
        return '#F59E0B'; // Amber
      default:
        return '#94A3B8'; // Gray
    }
  };

  const getResponseStatusColor = () => {
    switch (contact.follow_up_response_status) {
      case 'replied':
        return '#10B981'; // Green
      case 'meeting_booked':
        return '#0D9488'; // Teal
      case 'no_response':
        return '#EF4444'; // Red
      case 'pending':
        return '#F59E0B'; // Amber
      default:
        return '#94A3B8'; // Gray
    }
  };

  const getResponseStatusText = () => {
    switch (contact.follow_up_response_status) {
      case 'replied':
        return 'Replied';
      case 'meeting_booked':
        return 'Meeting Booked';
      case 'no_response':
        return 'No Response';
      case 'pending':
        return 'Awaiting Reply';
      default:
        return null;
    }
  };

  const getDaysSinceCaptured = () => {
    const capturedDate = new Date(contact.created_at);
    const today = new Date();
    const days = Math.floor(
      (today.getTime() - capturedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const getPriorityLabel = () => {
    const score = contact.priority_score || 0;
    if (score >= 50) return { label: 'Hot Lead', color: '#EF4444' };
    if (score >= 30) return { label: 'High Priority', color: '#F59E0B' };
    if (score >= 10) return { label: 'Medium', color: '#0D9488' };
    return null;
  };

  const priority = getPriorityLabel();
  const responseStatus = getResponseStatusText();

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Surface style={styles.compactCard}>
          <Avatar.Text
            size={36}
            label={initials}
            style={styles.compactAvatar}
          />
          <View style={styles.compactInfo}>
            <Text variant="labelLarge" style={styles.name}>
              {contact.first_name} {contact.last_name}
            </Text>
            <Text variant="bodySmall" style={styles.company}>
              {contact.company || contact.title || 'No company'}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#94A3B8"
          />
        </Surface>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Surface style={styles.card}>
        <View style={styles.header}>
          <Avatar.Text size={48} label={initials} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text variant="titleMedium" style={styles.name}>
              {contact.first_name} {contact.last_name}
            </Text>
            {contact.company && (
              <Text variant="bodyMedium" style={styles.company}>
                {contact.title ? `${contact.title} at ` : ''}
                {contact.company}
              </Text>
            )}
          </View>
          {showPriority && priority && (
            <Chip
              style={[styles.priorityChip, { backgroundColor: `${priority.color}20` }]}
              textStyle={{ color: priority.color, fontSize: 10 }}
            >
              {priority.label}
            </Chip>
          )}
        </View>

        {contact.notes && (
          <View style={styles.notesContainer}>
            <MaterialCommunityIcons
              name="note-text-outline"
              size={14}
              color="#94A3B8"
            />
            <Text
              variant="bodySmall"
              style={styles.notes}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {contact.notes}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color="#64748B"
            />
            <Text variant="bodySmall" style={styles.footerText}>
              Captured {getDaysSinceCaptured()}
            </Text>
          </View>

          {contact.follow_up_status === 'completed' && responseStatus && (
            <View style={styles.responseStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getResponseStatusColor() },
                ]}
              />
              <Text
                variant="bodySmall"
                style={[styles.statusText, { color: getResponseStatusColor() }]}
              >
                {responseStatus}
              </Text>
            </View>
          )}

          {contact.follow_up_status !== 'completed' && (
            <View style={styles.actionHint}>
              <Text variant="labelSmall" style={styles.actionText}>
                Follow Up
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={14}
                color="#0D9488"
              />
            </View>
          )}
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#1E293B',
  },
  compactCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    backgroundColor: '#334155',
  },
  compactAvatar: {
    backgroundColor: '#334155',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: '#F8FAFC',
  },
  company: {
    color: '#94A3B8',
    marginTop: 2,
  },
  priorityChip: {
    height: 24,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 8,
  },
  notes: {
    flex: 1,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: '#64748B',
  },
  responseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: '500',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#0D9488',
  },
});

export default FollowUpCard;
