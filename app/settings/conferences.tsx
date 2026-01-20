import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Surface,
  Button,
  List,
  Divider,
  IconButton,
  Chip,
  FAB,
} from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTeam } from '@/hooks/useTeam';
import { Conference } from '@/types/database';

export default function ConferencesScreen() {
  const {
    conferences,
    activeConference,
    activeTeam,
    setActiveConference,
    deleteConference,
    isLoading,
  } = useTeam();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSetActive = (conference: Conference) => {
    setActiveConference(conference);
  };

  const handleEdit = (conference: Conference) => {
    router.push({
      pathname: '/settings/conference-form',
      params: { id: conference.id },
    });
  };

  const handleDelete = (conference: Conference) => {
    Alert.alert(
      'Delete Conference',
      `Are you sure you want to delete "${conference.name}"? This will also delete all contacts, sessions, and posts associated with this conference.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(conference.id);
              await deleteConference(conference.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete conference');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

    if (startDate.getFullYear() !== endDate.getFullYear()) {
      return `${startDate.toLocaleDateString(undefined, { ...options, year: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { ...options, year: 'numeric' })}`;
    }

    return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, { ...options, year: 'numeric' })}`;
  };

  const getConferenceStatus = (conference: Conference) => {
    const now = new Date();
    const start = new Date(conference.start_date);
    const end = new Date(conference.end_date);

    if (now < start) return { label: 'Upcoming', color: '#3B82F6' };
    if (now > end) return { label: 'Past', color: '#64748B' };
    return { label: 'Active', color: '#10B981' };
  };

  if (!activeTeam) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="account-group-outline" size={64} color="#64748B" />
        <Text style={styles.emptyText}>Join or create a team first</Text>
        <Text style={styles.emptySubtext}>
          You need to be part of a team to manage conferences
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {conferences.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color="#64748B" />
            <Text style={styles.emptyText}>No conferences yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first conference to start capturing contacts
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/settings/conference-form')}
              style={styles.createButton}
              icon="plus"
            >
              Create Conference
            </Button>
          </View>
        ) : (
          <>
            <Surface style={styles.infoCard}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#0D9488" />
              <Text style={styles.infoText}>
                Tap a conference to set it as active. The active conference is used when capturing contacts and sessions.
              </Text>
            </Surface>

            {conferences.map((conference) => {
              const status = getConferenceStatus(conference);
              const isActive = activeConference?.id === conference.id;
              const isDeleting = deletingId === conference.id;

              return (
                <Surface
                  key={conference.id}
                  style={[
                    styles.conferenceCard,
                    isActive && styles.activeCard,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <Text variant="titleMedium" style={styles.conferenceName}>
                        {conference.name}
                      </Text>
                      {isActive && (
                        <Chip
                          mode="flat"
                          style={styles.activeChip}
                          textStyle={styles.activeChipText}
                        >
                          Active
                        </Chip>
                      )}
                    </View>
                    <Chip
                      mode="outlined"
                      style={[styles.statusChip, { borderColor: status.color }]}
                      textStyle={[styles.statusChipText, { color: status.color }]}
                    >
                      {status.label}
                    </Chip>
                  </View>

                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar" size={16} color="#94A3B8" />
                      <Text style={styles.detailText}>
                        {formatDateRange(conference.start_date, conference.end_date)}
                      </Text>
                    </View>

                    {conference.location && (
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="map-marker" size={16} color="#94A3B8" />
                        <Text style={styles.detailText}>{conference.location}</Text>
                      </View>
                    )}

                    {conference.website_url && (
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="web" size={16} color="#94A3B8" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {conference.website_url}
                        </Text>
                      </View>
                    )}

                    {conference.description && (
                      <Text style={styles.description} numberOfLines={2}>
                        {conference.description}
                      </Text>
                    )}
                  </View>

                  <Divider style={styles.cardDivider} />

                  <View style={styles.cardActions}>
                    {!isActive && (
                      <Button
                        mode="outlined"
                        onPress={() => handleSetActive(conference)}
                        style={styles.actionButton}
                        compact
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      mode="text"
                      onPress={() => handleEdit(conference)}
                      style={styles.actionButton}
                      compact
                    >
                      Edit
                    </Button>
                    <IconButton
                      icon="delete-outline"
                      iconColor="#EF4444"
                      size={20}
                      onPress={() => handleDelete(conference)}
                      disabled={isDeleting}
                      loading={isDeleting}
                    />
                  </View>
                </Surface>
              );
            })}
          </>
        )}
      </ScrollView>

      {conferences.length > 0 && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/settings/conference-form')}
          label="New Conference"
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  createButton: {
    marginTop: 24,
    backgroundColor: '#0D9488',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
    backgroundColor: '#1E293B',
  },
  infoText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  conferenceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: '#0D9488',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  conferenceName: {
    fontWeight: '600',
  },
  activeChip: {
    backgroundColor: '#0D948820',
    height: 24,
  },
  activeChipText: {
    color: '#0D9488',
    fontSize: 11,
  },
  statusChip: {
    height: 24,
    backgroundColor: 'transparent',
  },
  statusChipText: {
    fontSize: 11,
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#94A3B8',
    fontSize: 14,
    flex: 1,
  },
  description: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  cardDivider: {
    marginVertical: 12,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginRight: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#0D9488',
  },
});
