import { View, StyleSheet, SectionList } from 'react-native';
import { Text, Card, Chip, SegmentedButtons } from 'react-native-paper';
import { useState } from 'react';
import { router } from 'expo-router';

export default function SessionsScreen() {
  const [viewMode, setViewMode] = useState('list');
  const [sessions, setSessions] = useState<any[]>([]);

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            { value: 'list', label: 'List' },
            { value: 'calendar', label: 'Calendar' },
          ]}
          style={styles.segmented}
        />
      </View>

      <View style={styles.filterRow}>
        <Chip style={styles.chip} selected>All Days</Chip>
        <Chip style={styles.chip}>Today</Chip>
        <Chip style={styles.chip}>My Sessions</Chip>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Sessions Loaded
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Import the conference schedule to see sessions with integrated talking points.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              style={styles.sessionCard}
              onPress={() => router.push(`/session/${item.id}`)}
            >
              <Card.Title
                title={item.title}
                subtitle={`${item.start_time} - ${item.location}`}
              />
              <Card.Content>
                <Text variant="bodySmall">{item.speaker_name}</Text>
              </Card.Content>
            </Card>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
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
  controls: {
    padding: 16,
    paddingBottom: 8,
  },
  segmented: {
    backgroundColor: '#1E293B',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1E293B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#F8FAFC',
    marginBottom: 12,
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
  },
  sessionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0F172A',
  },
});
