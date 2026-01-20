import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Avatar,
  IconButton,
  useTheme,
  TouchableRipple,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { useContactStore } from '@/stores/contactStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useActivityStore } from '@/stores/activityStore';
import { ConferenceSelector } from '@/components/ConferenceSelector';
import { getTodayString, getConferenceDayNumber } from '@/utils/dateUtils';

// Types for the HUD
type StatItem = { label: string; value: number; icon: string; route: string; color: string };

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { activeConference, isLoading: teamLoading } = useTeam();
  const { contacts, loadContacts } = useContactStore();
  const { sessions, loadSessions } = useSessionStore();
  const { activities, checkIns, loadActivities, loadCheckIns } = useActivityStore();

  const [refreshing, setRefreshing] = useState(false);

  // --- Data Loading & Memoization ---
  useEffect(() => {
    if (activeConference) loadAllData();
  }, [activeConference]);

  const loadAllData = async () => {
    if (!activeConference) return;
    await Promise.all([
      loadContacts(activeConference.id),
      loadSessions(activeConference.id),
      loadActivities(activeConference.id, 5),
      loadCheckIns(activeConference.id),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const stats: StatItem[] = useMemo(() => {
    const myContacts = contacts.filter((c) => c.captured_by === user?.id).length;
    const attended = sessions.filter((s) => s.attendance?.status === 'attended').length;
    const pendingTasks = contacts.filter((c) => c.follow_up_status === 'pending').length;

    return [
      { label: 'Contacts', value: myContacts, icon: 'account-plus', route: '/(tabs)/contacts', color: theme.colors.primary },
      { label: 'Attended', value: attended, icon: 'calendar-check', route: '/(tabs)/sessions', color: '#8B5CF6' },
      { label: 'Pending', value: pendingTasks, icon: 'checkbox-marked-circle-outline', route: '/(tabs)/team', color: '#F59E0B' },
    ];
  }, [contacts, sessions, user, theme]);

  const today = getTodayString();
  const myCheckIn = checkIns.find((c) => c.user_id === user?.id && c.check_in_date === today);

  const getDayStatus = () => {
    if (!activeConference) return null;
    const dayNumber = getConferenceDayNumber(activeConference.start_date);
    return dayNumber > 0 ? `Day ${dayNumber}` : 'Pre-Conf';
  };

  // --- Render Guards ---
  if (!activeConference && !teamLoading) return <ConferenceSelector />;

  // --- Sub-Components ---

  const StatCard = ({ item }: { item: StatItem }) => (
    <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <TouchableRipple
        onPress={() => router.push(item.route as any)}
        style={styles.statRipple}
        borderless
      >
        <View style={styles.statContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
            <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
          </View>
          <View>
            <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
              {item.value}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.label}
            </Text>
          </View>
        </View>
      </TouchableRipple>
    </Surface>
  );

  const ActionTile = ({
    title,
    subtitle,
    icon,
    action,
    accent
  }: { title: string, subtitle: string, icon: string, action: () => void, accent?: boolean }) => (
    <Surface style={[styles.actionTile, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <TouchableRipple onPress={action} style={{ padding: 16 }}>
        <View style={styles.actionRow}>
          <View style={[styles.actionIcon, { backgroundColor: accent ? `${theme.colors.primary}20` : theme.colors.surfaceVariant }]}>
            <MaterialCommunityIcons name={icon as any} size={24} color={accent ? theme.colors.primary : theme.colors.onSurfaceVariant} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text variant="titleSmall" style={{ fontWeight: '600' }}>{title}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{subtitle}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
        </View>
      </TouchableRipple>
    </Surface>
  );

  // --- Main Render ---

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold', letterSpacing: 1 }}>
              {activeConference?.name.toUpperCase()}
            </Text>
            <Text variant="headlineMedium" style={{ color: theme.colors.onBackground, fontWeight: 'bold' }}>
              {getDayStatus()}
            </Text>
          </View>
          <Avatar.Text
            size={48}
            label={user?.user_metadata?.full_name?.charAt(0) || 'U'}
            style={{ backgroundColor: theme.colors.surfaceVariant }}
            color={theme.colors.primary}
          />
        </View>

        {/* HUD Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <StatCard key={index} item={stat} />
          ))}
        </View>

        {/* Primary Call to Action: Check In */}
        <View style={styles.section}>
          <Surface style={[styles.checkInCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <View style={styles.checkInHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                  {myCheckIn ? "Status Updated" : "Daily Check-In Required"}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                  {myCheckIn ? `Focus: ${myCheckIn.priorities?.substring(0, 30)}...` : "Share your location and priorities with the team."}
                </Text>
              </View>
              <IconButton
                icon={myCheckIn ? "check-circle" : "alert-circle-outline"}
                iconColor={myCheckIn ? theme.colors.primary : theme.colors.error}
                size={28}
              />
            </View>
            <Button
              mode="contained"
              onPress={() => router.push('/(tabs)/team')}
              style={{ marginTop: 12, borderRadius: 8 }}
              contentStyle={{ paddingVertical: 4 }}
            >
              {myCheckIn ? "Update Status" : "Check In Now"}
            </Button>
          </Surface>
        </View>

        {/* Upcoming / Live Now */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Happening Now
          </Text>
          {sessions.length === 0 ? (
            <Surface style={[styles.emptyState, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <MaterialCommunityIcons name="calendar-blank" size={32} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                No sessions scheduled
              </Text>
            </Surface>
          ) : (
            sessions.slice(0, 2).map((session) => (
              <Surface key={session.id} style={[styles.sessionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <View style={styles.sessionTimeBar}>
                  <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 12 }}>
                    {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'})}
                  </Text>
                  <View style={[styles.verticalLine, { backgroundColor: theme.colors.outline }]} />
                </View>
                <View style={{ flex: 1, paddingVertical: 12, paddingRight: 12 }}>
                  <Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.onSurface }}>{session.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                     <MaterialCommunityIcons name="map-marker" size={12} color={theme.colors.onSurfaceVariant} />
                     <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                       {session.location || 'TBA'}
                     </Text>
                  </View>
                </View>
                <IconButton icon="chevron-right" size={20} onPress={() => router.push(`/session/${session.id}`)} />
              </Surface>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Quick Actions
          </Text>
          <View style={{ gap: 12 }}>
            <ActionTile
              title="Capture Badge"
              subtitle="Scan a new contact"
              icon="camera"
              accent
              action={() => router.push('/contact/capture')}
            />
            <ActionTile
              title="Compose Post"
              subtitle="Share updates to LinkedIn"
              icon="linkedin"
              action={() => router.push('/post/new')}
            />
          </View>
        </View>

        {/* Recent Activity */}
        {activities.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Team Activity
            </Text>
            <Surface style={[styles.activityCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              {activities.slice(0, 3).map((activity, idx) => (
                <View key={activity.id}>
                  <View style={styles.activityItem}>
                    <MaterialCommunityIcons
                      name={getActivityIcon(activity.activity_type)}
                      size={16}
                      color={getActivityColor(activity.activity_type, theme)}
                    />
                    <Text style={styles.activityText} numberOfLines={1}>
                      <Text style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
                        {activity.user?.full_name?.split(' ')[0]}
                      </Text>
                      <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        {' '}{activity.description}
                      </Text>
                    </Text>
                  </View>
                  {idx < 2 && <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />}
                </View>
              ))}
            </Surface>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function getActivityIcon(type: string): any {
  switch (type) {
    case 'contact_captured': return 'account-plus';
    case 'session_attended': return 'calendar-check';
    case 'post_published': return 'linkedin';
    case 'post_engaged': return 'thumb-up';
    case 'check_in': return 'map-marker-check';
    default: return 'bell';
  }
}

function getActivityColor(type: string, theme: any): string {
  switch (type) {
    case 'contact_captured': return '#3B82F6';
    case 'session_attended': return '#10B981';
    case 'post_published': return '#0A66C2';
    case 'post_engaged': return '#F59E0B';
    case 'check_in': return '#8B5CF6';
    default: return theme.colors.onSurfaceVariant;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statRipple: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  checkInCard: {
    borderRadius: 16,
    padding: 20,
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  actionTile: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  sessionTimeBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalLine: {
    width: 1,
    flex: 1,
    marginTop: 4,
  },
  emptyState: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCard: {
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  activityText: {
    flex: 1,
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
