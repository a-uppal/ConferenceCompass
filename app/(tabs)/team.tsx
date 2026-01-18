import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Avatar, Button, Chip, Surface } from 'react-native-paper';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function TeamScreen() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  return (
    <View style={styles.container}>
      <Surface style={styles.checkInCard}>
        <Text variant="titleMedium" style={styles.checkInTitle}>
          Daily Check-in
        </Text>
        <Text variant="bodyMedium" style={styles.checkInText}>
          Share your priorities for today with the team
        </Text>
        <Button mode="contained" style={styles.checkInButton}>
          Check In Now
        </Button>
      </Surface>

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
          <Card.Actions>
            <Button>Create Team</Button>
            <Button>Join Team</Button>
          </Card.Actions>
        </Card>
      ) : (
        <FlatList
          horizontal
          data={teamMembers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Surface style={styles.memberCard}>
              <Avatar.Text
                size={48}
                label={item.full_name?.charAt(0) || 'U'}
              />
              <Text variant="bodyMedium" style={styles.memberName}>
                {item.full_name}
              </Text>
              <Chip style={styles.statusChip}>
                {item.status || 'Available'}
              </Chip>
            </Surface>
          )}
          contentContainerStyle={styles.memberList}
        />
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Activity Feed
      </Text>

      {activities.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No team activity yet. Actions like capturing contacts, attending sessions, and publishing posts will appear here.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.activityCard}>
              <Card.Title
                title={item.user_name}
                subtitle={item.description}
                left={(props) => (
                  <Avatar.Text {...props} label={item.user_name?.charAt(0) || 'U'} />
                )}
              />
            </Card>
          )}
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
  checkInCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkInTitle: {
    color: '#0D9488',
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
    paddingBottom: 8,
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
  memberName: {
    marginTop: 8,
    textAlign: 'center',
  },
  statusChip: {
    marginTop: 8,
    backgroundColor: '#1E293B',
  },
  emptyCard: {
    margin: 16,
  },
  emptyText: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
  activityCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
