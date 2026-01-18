import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Avatar, Button, Chip, Surface, TextInput, Modal, Portal, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { useActivityStore } from '@/stores/activityStore';
import { TeamActivity, DailyCheckIn } from '@/types/database';

interface CheckInWithUser extends DailyCheckIn {
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface ActivityWithUser extends TeamActivity {
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export default function TeamScreen() {
  const { user } = useAuth();
  const { activeConference, teamMembers } = useTeam();
  const {
    activities,
    checkIns,
    isLoading,
    loadActivities,
    loadCheckIns,
    submitCheckIn,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  } = useActivityStore();

  const [refreshing, setRefreshing] = useState(false);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [priorities, setPriorities] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<DailyCheckIn['status']>('available');

  useEffect(() => {
    if (activeConference) {
      loadActivities(activeConference.id);
      loadCheckIns(activeConference.id);
      subscribeToRealtime(activeConference.id);
    }

    return () => {
      unsubscribeFromRealtime();
    };
  }, [activeConference]);

  const onRefresh = async () => {
    if (!activeConference) return;
    setRefreshing(true);
    await Promise.all([
      loadActivities(activeConference.id),
      loadCheckIns(activeConference.id),
    ]);
    setRefreshing(false);
  };

  const handleCheckIn = async () => {
    if (!user || !activeConference) return;

    try {
      await submitCheckIn({
        conference_id: activeConference.id,
        user_id: user.id,
        check_in_date: new Date().toISOString().split('T')[0],
        priorities,
        location,
        status,
      });
      setCheckInModalVisible(false);
      setPriorities('');
      setLocation('');
      Alert.alert('Success', 'Check-in submitted!');
    } catch (err) {
      Alert.alert('Error', 'Failed to submit check-in');
    }
  };

  const hasCheckedInToday = checkIns.some(
    (c) => c.user_id === user?.id && c.check_in_date === new Date().toISOString().split('T')[0]
  );

  const getActivityIcon = (type: TeamActivity['activity_type']): string => {
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
  };

  const getActivityColor = (type: TeamActivity['activity_type']): string => {
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
  };

  const getStatusColor = (status: DailyCheckIn['status']): string => {
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
  };

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const renderTeamMember = ({ item }: { item: any }) => {
    const memberCheckIn = checkIns.find((c) => c.user_id === item.user_id);
    const memberStatus = memberCheckIn?.status || 'available';

    return (
      <Surface style={styles.memberCard}>
        <View style={styles.memberAvatarContainer}>
          <Avatar.Text
            size={48}
            label={item.user?.full_name?.charAt(0) || 'U'}
            style={{ backgroundColor: item.user_id === user?.id ? '#0D9488' : '#3B82F6' }}
          />
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(memberStatus) }]} />
        </View>
        <Text variant="bodyMedium" style={styles.memberName} numberOfLines={1}>
          {item.user?.full_name?.split(' ')[0] || 'Team'}
        </Text>
        <Text style={styles.memberRole}>{item.role}</Text>
        {memberCheckIn?.location && (
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={12} color="#94A3B8" />
            <Text style={styles.locationText} numberOfLines={1}>
              {memberCheckIn.location}
            </Text>
          </View>
        )}
      </Surface>
    );
  };

  const renderActivity = ({ item }: { item: ActivityWithUser }) => (
    <Card style={styles.activityCard}>
      <Card.Title
        title={item.user?.full_name || 'Team Member'}
        subtitle={formatTimeAgo(item.created_at)}
        left={(props) => (
          <View style={[styles.activityIconContainer, { backgroundColor: getActivityColor(item.activity_type) }]}>
            <MaterialCommunityIcons
              name={getActivityIcon(item.activity_type) as any}
              size={20}
              color="#fff"
            />
          </View>
        )}
        titleStyle={styles.activityTitle}
        subtitleStyle={styles.activityTime}
      />
      <Card.Content>
        <Text style={styles.activityDescription}>{item.description}</Text>
      </Card.Content>
    </Card>
  );

  const renderCheckIn = ({ item }: { item: CheckInWithUser }) => (
    <Surface style={styles.checkInItem}>
      <Avatar.Text
        size={36}
        label={item.user?.full_name?.charAt(0) || 'U'}
        style={{ backgroundColor: '#3B82F6' }}
      />
      <View style={styles.checkInContent}>
        <View style={styles.checkInHeader}>
          <Text style={styles.checkInName}>{item.user?.full_name}</Text>
          <Chip
            compact
            style={[styles.statusChipSmall, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusChipText}
          >
            {item.status}
          </Chip>
        </View>
        {item.priorities && (
          <Text style={styles.checkInPriorities} numberOfLines={2}>
            {item.priorities}
          </Text>
        )}
        {item.location && (
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={12} color="#94A3B8" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        )}
      </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D9488" />
        }
      >
        {/* Check-in Card */}
        <Surface style={styles.checkInCard}>
          <MaterialCommunityIcons
            name={hasCheckedInToday ? 'check-circle' : 'calendar-today'}
            size={32}
            color={hasCheckedInToday ? '#10B981' : '#0D9488'}
          />
          <Text variant="titleMedium" style={styles.checkInTitle}>
            {hasCheckedInToday ? "You're Checked In!" : 'Daily Check-in'}
          </Text>
          <Text variant="bodyMedium" style={styles.checkInText}>
            {hasCheckedInToday
              ? 'Your team can see your status and location'
              : 'Share your priorities for today with the team'}
          </Text>
          <Button
            mode={hasCheckedInToday ? 'outlined' : 'contained'}
            style={hasCheckedInToday ? undefined : styles.checkInButton}
            onPress={() => setCheckInModalVisible(true)}
          >
            {hasCheckedInToday ? 'Update Status' : 'Check In Now'}
          </Button>
        </Surface>

        {/* Today's Check-ins */}
        {checkIns.length > 0 && (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Today's Check-ins ({checkIns.length})
            </Text>
            <FlatList
              horizontal
              data={checkIns}
              keyExtractor={(item) => item.id}
              renderItem={renderCheckIn}
              contentContainerStyle={styles.checkInList}
              showsHorizontalScrollIndicator={false}
            />
          </>
        )}

        {/* Team Members */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Team Members
        </Text>

        {teamMembers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No team members yet. Create or join a team to collaborate during the conference.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <FlatList
            horizontal
            data={teamMembers}
            keyExtractor={(item) => item.id}
            renderItem={renderTeamMember}
            contentContainerStyle={styles.memberList}
            showsHorizontalScrollIndicator={false}
          />
        )}

        {/* Activity Feed */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Activity Feed
        </Text>

        {activities.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <MaterialCommunityIcons name="bell-outline" size={40} color="#94A3B8" style={styles.emptyIcon} />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No team activity yet. Actions like capturing contacts, attending sessions, and publishing posts will appear here in real-time.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.activityList}>
            {activities.slice(0, 20).map((activity) => (
              <View key={activity.id}>{renderActivity({ item: activity })}</View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Check-in Modal */}
      <Portal>
        <Modal
          visible={checkInModalVisible}
          onDismiss={() => setCheckInModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Daily Check-in
          </Text>

          <Text style={styles.inputLabel}>Your Status</Text>
          <SegmentedButtons
            value={status}
            onValueChange={(v) => setStatus(v as DailyCheckIn['status'])}
            buttons={[
              { value: 'available', label: 'Available', icon: 'check-circle' },
              { value: 'busy', label: 'Busy', icon: 'clock' },
              { value: 'in_session', label: 'In Session', icon: 'calendar' },
            ]}
            style={styles.statusSegmented}
          />

          <TextInput
            label="Your Priorities Today"
            value={priorities}
            onChangeText={setPriorities}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="What are you focusing on today?"
            style={styles.input}
          />

          <TextInput
            label="Current Location (optional)"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            placeholder="e.g., Main Hall, Booth #42, Coffee Area"
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button onPress={() => setCheckInModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleCheckIn} style={styles.submitButton}>
              Submit Check-in
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  checkInCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkInTitle: {
    color: '#0D9488',
    marginTop: 12,
    marginBottom: 8,
  },
  checkInText: {
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 16,
  },
  checkInButton: {
    backgroundColor: '#0D9488',
  },
  sectionTitle: {
    color: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  checkInList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  checkInItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    minWidth: 280,
    gap: 12,
  },
  checkInContent: {
    flex: 1,
  },
  checkInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  checkInName: {
    fontWeight: '600',
    color: '#F8FAFC',
  },
  checkInPriorities: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  statusChipSmall: {
    height: 22,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 10,
  },
  memberList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  memberCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  memberAvatarContainer: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  memberName: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  memberRole: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  activityList: {
    paddingHorizontal: 16,
  },
  activityCard: {
    marginBottom: 8,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitle: {
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
  },
  activityDescription: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: -8,
  },
  emptyCard: {
    margin: 16,
  },
  emptyIcon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  emptyText: {
    opacity: 0.6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
  modal: {
    backgroundColor: '#1E293B',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    color: '#F8FAFC',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 8,
  },
  statusSegmented: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#0D9488',
  },
});
