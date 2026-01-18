import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Surface, ProgressBar, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { useContactStore } from '@/stores/contactStore';
import { useSessionStore } from '@/stores/sessionStore';
import { usePostStore } from '@/stores/postStore';
import { useActivityStore } from '@/stores/activityStore';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { activeConference, teamMembers } = useTeam();
  const { contacts, loadContacts } = useContactStore();
  const { sessions, loadSessions } = useSessionStore();
  const { posts, loadPosts } = usePostStore();
  const { activities, checkIns, loadActivities, loadCheckIns } = useActivityStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeConference) {
      loadAllData();
    }
  }, [activeConference]);

  const loadAllData = async () => {
    if (!activeConference) return;
    await Promise.all([
      loadContacts(activeConference.id),
      loadSessions(activeConference.id),
      loadPosts(activeConference.id),
      loadActivities(activeConference.id, 10),
      loadCheckIns(activeConference.id),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Calculate metrics
  const myContacts = contacts.filter((c) => c.captured_by === user?.id);
  const attendedSessions = sessions.filter((s) => s.attendance?.status === 'attended');
  const publishedPosts = posts.filter((p) => p.status === 'published');
  const myPosts = posts.filter((p) => p.author_id === user?.id);
  const totalEngagements = posts.reduce((sum, p) => sum + (p.engagements?.length || 0), 0);

  // Conference progress (based on sessions)
  const totalSessions = sessions.length;
  const plannedOrAttended = sessions.filter(
    (s) => s.attendance?.status === 'planned' || s.attendance?.status === 'attended'
  ).length;
  const sessionProgress = totalSessions > 0 ? plannedOrAttended / totalSessions : 0;

  // Today's scheduled posts
  const today = new Date().toISOString().split('T')[0];
  const todayPosts = posts.filter((p) => p.scheduled_date === today && p.status === 'scheduled');

  // Get my check-in for today
  const myCheckIn = checkIns.find(
    (c) => c.user_id === user?.id && c.check_in_date === today
  );

  // Upcoming sessions (next 3)
  const now = new Date();
  const upcomingSessions = sessions
    .filter((s) => new Date(s.start_time) > now)
    .slice(0, 3);

  // Format conference dates
  const getConferenceDayInfo = () => {
    if (!activeConference) return null;
    const start = new Date(activeConference.start_date);
    const end = new Date(activeConference.end_date);
    const today = new Date();

    if (today < start) {
      const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { label: 'Days Until', value: daysUntil, status: 'upcoming' };
    } else if (today > end) {
      return { label: 'Status', value: 'Completed', status: 'completed' };
    } else {
      const dayNum = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return { label: `Day ${dayNum}/${totalDays}`, value: 'Live', status: 'live' };
    }
  };

  const conferenceDay = getConferenceDayInfo();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D9488" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text variant="headlineSmall" style={styles.greeting}>
              Welcome, {user?.user_metadata?.full_name?.split(' ')[0] || 'Team Member'}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {activeConference?.name || 'No Conference Selected'}
            </Text>
          </View>
          {conferenceDay && (
            <Chip
              style={[
                styles.dayChip,
                conferenceDay.status === 'live' && styles.liveChip,
                conferenceDay.status === 'completed' && styles.completedChip,
              ]}
              textStyle={styles.dayChipText}
            >
              {conferenceDay.status === 'live' ? '🔴 ' : ''}{conferenceDay.label}
            </Chip>
          )}
        </View>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <MetricCard
          icon="account-plus"
          label="Contacts"
          value={myContacts.length}
          total={contacts.length}
          color="#0D9488"
          onPress={() => router.push('/(tabs)/contacts')}
        />
        <MetricCard
          icon="calendar-check"
          label="Sessions"
          value={attendedSessions.length}
          total={sessions.length}
          color="#8B5CF6"
          onPress={() => router.push('/(tabs)/sessions')}
        />
        <MetricCard
          icon="linkedin"
          label="Posts"
          value={publishedPosts.length}
          total={posts.length}
          color="#0A66C2"
          onPress={() => router.push('/(tabs)/posts')}
        />
        <MetricCard
          icon="account-group"
          label="Team"
          value={totalEngagements}
          sublabel="engagements"
          color="#F59E0B"
          onPress={() => router.push('/(tabs)/team')}
        />
      </View>

      {/* Session Progress */}
      {totalSessions > 0 && (
        <Card style={styles.progressCard}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Session Coverage</Text>
              <Text style={styles.progressValue}>
                {plannedOrAttended}/{totalSessions}
              </Text>
            </View>
            <ProgressBar
              progress={sessionProgress}
              color="#0D9488"
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>
      )}

      {/* Today's Check-in */}
      <Card style={styles.card}>
        <Card.Title
          title={myCheckIn ? "Today's Focus" : "Daily Check-in"}
          left={(props) => (
            <MaterialCommunityIcons
              name={myCheckIn ? 'check-circle' : 'calendar-today'}
              size={24}
              color={myCheckIn ? '#10B981' : '#94A3B8'}
            />
          )}
        />
        <Card.Content>
          {myCheckIn ? (
            <>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(myCheckIn.status) }]}
                textStyle={styles.statusChipText}
              >
                {myCheckIn.status}
              </Chip>
              {myCheckIn.priorities && (
                <Text style={styles.prioritiesText}>{myCheckIn.priorities}</Text>
              )}
              {myCheckIn.location && (
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker" size={14} color="#94A3B8" />
                  <Text style={styles.locationText}>{myCheckIn.location}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>
              Share your priorities and location with your team!
            </Text>
          )}
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => router.push('/(tabs)/team')}>
            {myCheckIn ? 'Update Status' : 'Check In Now'}
          </Button>
        </Card.Actions>
      </Card>

      {/* Today's Posts */}
      {todayPosts.length > 0 && (
        <Card style={styles.card}>
          <Card.Title
            title="Today's Posts"
            subtitle={`${todayPosts.length} scheduled`}
            left={(props) => (
              <MaterialCommunityIcons name="linkedin" size={24} color="#0A66C2" />
            )}
          />
          <Card.Content>
            {todayPosts.slice(0, 2).map((post) => (
              <View key={post.id} style={styles.postItem}>
                <Text style={styles.postAuthor}>
                  {post.author?.full_name || 'Team Member'}
                </Text>
                <Text style={styles.postPreview} numberOfLines={2}>
                  {post.content_preview}
                </Text>
              </View>
            ))}
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => router.push('/(tabs)/posts')}>View All Posts</Button>
          </Card.Actions>
        </Card>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card style={styles.card}>
          <Card.Title
            title="Upcoming Sessions"
            left={(props) => (
              <MaterialCommunityIcons name="calendar-clock" size={24} color="#8B5CF6" />
            )}
          />
          <Card.Content>
            {upcomingSessions.map((session) => (
              <View key={session.id} style={styles.sessionItem}>
                <View style={styles.sessionTime}>
                  <Text style={styles.timeText}>
                    {new Date(session.start_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle} numberOfLines={1}>
                    {session.title}
                  </Text>
                  {session.location && (
                    <Text style={styles.sessionLocation}>{session.location}</Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => router.push('/(tabs)/sessions')}>View Schedule</Button>
          </Card.Actions>
        </Card>
      )}

      {/* Recent Activity */}
      {activities.length > 0 && (
        <Card style={styles.card}>
          <Card.Title
            title="Team Activity"
            left={(props) => (
              <MaterialCommunityIcons name="bell-ring" size={24} color="#F59E0B" />
            )}
          />
          <Card.Content>
            {activities.slice(0, 3).map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <MaterialCommunityIcons
                  name={getActivityIcon(activity.activity_type)}
                  size={16}
                  color={getActivityColor(activity.activity_type)}
                />
                <Text style={styles.activityText} numberOfLines={1}>
                  <Text style={styles.activityAuthor}>
                    {activity.user?.full_name?.split(' ')[0]}
                  </Text>
                  {' '}{activity.description}
                </Text>
              </View>
            ))}
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => router.push('/(tabs)/team')}>View All Activity</Button>
          </Card.Actions>
        </Card>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

interface MetricCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  total?: number;
  sublabel?: string;
  color: string;
  onPress?: () => void;
}

function MetricCard({ icon, label, value, total, sublabel, color, onPress }: MetricCardProps) {
  return (
    <Surface style={styles.metricCard} onTouchEnd={onPress}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
      <Text variant="headlineMedium" style={[styles.metricValue, { color }]}>
        {value}
      </Text>
      <Text variant="bodySmall" style={styles.metricLabel}>
        {sublabel || (total ? `of ${total} ${label}` : label)}
      </Text>
    </Surface>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'available':
      return '#10B981';
    case 'busy':
      return '#F59E0B';
    case 'in_session':
      return '#3B82F6';
    default:
      return '#94A3B8';
  }
}

function getActivityIcon(type: string): any {
  switch (type) {
    case 'contact_captured':
      return 'account-plus';
    case 'session_attended':
      return 'calendar-check';
    case 'post_published':
      return 'linkedin';
    case 'post_engaged':
      return 'thumb-up';
    case 'check_in':
      return 'map-marker-check';
    default:
      return 'bell';
  }
}

function getActivityColor(type: string): string {
  switch (type) {
    case 'contact_captured':
      return '#3B82F6';
    case 'session_attended':
      return '#10B981';
    case 'post_published':
      return '#0A66C2';
    case 'post_engaged':
      return '#F59E0B';
    case 'check_in':
      return '#8B5CF6';
    default:
      return '#94A3B8';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  subtitle: {
    color: '#94A3B8',
    marginTop: 4,
  },
  dayChip: {
    backgroundColor: '#1E293B',
  },
  liveChip: {
    backgroundColor: '#EF4444',
  },
  completedChip: {
    backgroundColor: '#10B981',
  },
  dayChipText: {
    color: '#fff',
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  metricValue: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  metricLabel: {
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  progressCard: {
    margin: 10,
    marginTop: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#94A3B8',
  },
  progressValue: {
    color: '#0D9488',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
  },
  card: {
    margin: 10,
    marginTop: 5,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusChipText: {
    color: '#fff',
  },
  prioritiesText: {
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  emptyText: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
  postItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  postAuthor: {
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  postPreview: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  sessionItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 12,
  },
  sessionTime: {
    width: 50,
  },
  timeText: {
    color: '#0D9488',
    fontWeight: '600',
    fontSize: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontWeight: '500',
  },
  sessionLocation: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  activityText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 13,
  },
  activityAuthor: {
    color: '#F8FAFC',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});
