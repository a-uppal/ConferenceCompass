import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardScreen() {
  const { user } = useAuth();

  // Placeholder metrics - will be replaced with real data
  const metrics = {
    contactsCaptured: 0,
    sessionsAttended: 0,
    postsPublished: 0,
    teamEngagements: 0,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.greeting}>
          Welcome, {user?.user_metadata?.full_name || 'Team Member'}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          LOTF 2026 Conference
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          icon="account-plus"
          label="Contacts"
          value={metrics.contactsCaptured}
          color="#0D9488"
        />
        <MetricCard
          icon="calendar-check"
          label="Sessions"
          value={metrics.sessionsAttended}
          color="#8B5CF6"
        />
        <MetricCard
          icon="post"
          label="Posts"
          value={metrics.postsPublished}
          color="#F59E0B"
        />
        <MetricCard
          icon="handshake"
          label="Engagements"
          value={metrics.teamEngagements}
          color="#EF4444"
        />
      </View>

      <Card style={styles.activityCard}>
        <Card.Title title="Today's Priority" />
        <Card.Content>
          <Text variant="bodyMedium">
            No priorities set yet. Check in with your team!
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button>Set Today's Focus</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.activityCard}>
        <Card.Title title="Team Activity" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.emptyState}>
            No recent team activity. Be the first to capture a contact or attend a session!
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.activityCard}>
        <Card.Title title="Upcoming Posts" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.emptyState}>
            No posts scheduled. Import your LOTF Strategy to see the post calendar.
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button>Import Strategy</Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}

interface MetricCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  color: string;
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  return (
    <Surface style={styles.metricCard}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
      <Text variant="headlineMedium" style={[styles.metricValue, { color }]}>
        {value}
      </Text>
      <Text variant="bodySmall" style={styles.metricLabel}>
        {label}
      </Text>
    </Surface>
  );
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
  greeting: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  subtitle: {
    color: '#94A3B8',
    marginTop: 4,
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
  },
  activityCard: {
    margin: 10,
    marginTop: 5,
  },
  emptyState: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
});
