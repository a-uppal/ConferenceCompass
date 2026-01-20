import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Surface,
  SegmentedButtons,
  ActivityIndicator,
  Button,
  ProgressBar,
} from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { FollowUpCard } from '@/components/follow-up';
import {
  getContactsNeedingFollowUp,
  getCompletedFollowUps,
  getFollowUpStats,
  FollowUpStats,
} from '@/services/followUpService';
import { Contact } from '@/types/database';

type FilterType = 'pending' | 'completed' | 'all';

export default function FollowUpsScreen() {
  const { user } = useAuth();
  const { activeConference } = useTeam();

  const [filter, setFilter] = useState<FilterType>('pending');
  const [pendingContacts, setPendingContacts] = useState<Contact[]>([]);
  const [completedContacts, setCompletedContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<FollowUpStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!activeConference || !user) return;

    try {
      const [pending, completed, statsData] = await Promise.all([
        getContactsNeedingFollowUp(activeConference.id, user.id),
        getCompletedFollowUps(activeConference.id, user.id),
        getFollowUpStats(activeConference.id, user.id),
      ]);

      setPendingContacts(pending);
      setCompletedContacts(completed);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading follow-up data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeConference, user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleContactPress = (contact: Contact) => {
    if (contact.follow_up_status === 'completed') {
      // Go to contact detail
      router.push(`/contact/${contact.id}`);
    } else {
      // Go to follow-up composer
      router.push(`/contact/follow-up?contactId=${contact.id}`);
    }
  };

  const getDisplayContacts = () => {
    switch (filter) {
      case 'pending':
        return pendingContacts;
      case 'completed':
        return completedContacts;
      case 'all':
        return [...pendingContacts, ...completedContacts];
    }
  };

  const displayContacts = getDisplayContacts();

  // Split pending contacts into hot leads and others
  const hotLeads = pendingContacts.filter((c) => (c.priority_score || 0) >= 50);
  const regularPending = pendingContacts.filter((c) => (c.priority_score || 0) < 50);

  if (!activeConference) {
    return (
      <View style={styles.container}>
        <Surface style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="calendar-alert"
            size={48}
            color="#94A3B8"
          />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Conference Selected
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Select a conference from the home screen to view follow-ups.
          </Text>
        </Surface>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading follow-ups...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Stats Summary */}
      {stats && (
        <Surface style={styles.statsCard}>
          <Text variant="titleMedium" style={styles.statsTitle}>
            Post-Conference Summary
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {stats.total}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Contacts
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                variant="headlineMedium"
                style={[styles.statNumber, { color: '#10B981' }]}
              >
                {stats.completed}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Followed Up
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                variant="headlineMedium"
                style={[styles.statNumber, { color: '#F59E0B' }]}
              >
                {stats.pending}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Pending
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text variant="bodySmall" style={styles.progressLabel}>
                Completion Rate
              </Text>
              <Text variant="bodySmall" style={styles.progressPercent}>
                {stats.completionRate}%
              </Text>
            </View>
            <ProgressBar
              progress={stats.completionRate / 100}
              color="#0D9488"
              style={styles.progressBar}
            />
          </View>

          {stats.meetingsBooked > 0 && (
            <View style={styles.meetingsRow}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={20}
                color="#0D9488"
              />
              <Text variant="bodyMedium" style={styles.meetingsText}>
                {stats.meetingsBooked} meeting{stats.meetingsBooked > 1 ? 's' : ''} booked!
              </Text>
            </View>
          )}
        </Surface>
      )}

      {/* Filter Tabs */}
      <SegmentedButtons
        value={filter}
        onValueChange={(value) => setFilter(value as FilterType)}
        buttons={[
          { value: 'pending', label: `Pending (${pendingContacts.length})` },
          { value: 'completed', label: `Done (${completedContacts.length})` },
          { value: 'all', label: 'All' },
        ]}
        style={styles.filterButtons}
      />

      {/* Hot Leads Section (only show on pending filter) */}
      {filter === 'pending' && hotLeads.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="fire" size={20} color="#EF4444" />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Hot Leads ({hotLeads.length})
            </Text>
          </View>
          {hotLeads.map((contact) => (
            <FollowUpCard
              key={contact.id}
              contact={contact}
              onPress={() => handleContactPress(contact)}
              showPriority
            />
          ))}
        </View>
      )}

      {/* Regular Contacts Section */}
      {filter === 'pending' && regularPending.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color="#F59E0B"
            />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Needs Follow-Up ({regularPending.length})
            </Text>
          </View>
          {regularPending.map((contact) => (
            <FollowUpCard
              key={contact.id}
              contact={contact}
              onPress={() => handleContactPress(contact)}
              showPriority={false}
            />
          ))}
        </View>
      )}

      {/* Completed Section */}
      {filter === 'completed' && completedContacts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color="#10B981"
            />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Completed ({completedContacts.length})
            </Text>
          </View>
          {completedContacts.map((contact) => (
            <FollowUpCard
              key={contact.id}
              contact={contact}
              onPress={() => handleContactPress(contact)}
              showPriority={false}
            />
          ))}
        </View>
      )}

      {/* All View */}
      {filter === 'all' && displayContacts.length > 0 && (
        <View style={styles.section}>
          {displayContacts.map((contact) => (
            <FollowUpCard
              key={contact.id}
              contact={contact}
              onPress={() => handleContactPress(contact)}
              showPriority
            />
          ))}
        </View>
      )}

      {/* Empty State */}
      {displayContacts.length === 0 && (
        <Surface style={styles.emptyCard}>
          <MaterialCommunityIcons
            name={filter === 'completed' ? 'check-circle' : 'account-group'}
            size={48}
            color="#94A3B8"
          />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            {filter === 'completed'
              ? 'No follow-ups completed yet'
              : filter === 'pending'
              ? 'All caught up!'
              : 'No contacts captured'}
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {filter === 'completed'
              ? 'Complete some follow-ups to see them here.'
              : filter === 'pending'
              ? "You've followed up with everyone. Great job!"
              : 'Start capturing contacts at the conference.'}
          </Text>
          {filter !== 'completed' && pendingContacts.length === 0 && (
            <Button
              mode="contained"
              onPress={() => router.push('/contact/capture')}
              icon="camera"
              style={styles.captureButton}
            >
              Capture Badge
            </Button>
          )}
        </Surface>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    marginTop: 16,
    color: '#94A3B8',
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#1E293B',
  },
  statsTitle: {
    color: '#F8FAFC',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#94A3B8',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    color: '#94A3B8',
  },
  progressPercent: {
    color: '#0D9488',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  meetingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  meetingsText: {
    color: '#0D9488',
    fontWeight: '500',
  },
  filterButtons: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F8FAFC',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  emptyTitle: {
    color: '#F8FAFC',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  captureButton: {
    marginTop: 16,
  },
});
