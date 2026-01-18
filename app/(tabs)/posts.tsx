import { View, StyleSheet, SectionList } from 'react-native';
import { Text, Card, Chip, Button, Avatar } from 'react-native-paper';
import { useState } from 'react';
import { Linking } from 'react-native';

export default function PostsScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  const openLinkedIn = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <Chip
          style={styles.chip}
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
        >
          All Posts
        </Chip>
        <Chip
          style={styles.chip}
          selected={filter === 'today'}
          onPress={() => setFilter('today')}
        >
          Today
        </Chip>
        <Chip
          style={styles.chip}
          selected={filter === 'mine'}
          onPress={() => setFilter('mine')}
        >
          My Posts
        </Chip>
      </View>

      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Posts Scheduled
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Import your LOTF Strategy Excel to populate the post calendar with scheduled LinkedIn content.
          </Text>
          <Button mode="contained" style={styles.importButton}>
            Import Strategy
          </Button>
        </View>
      ) : (
        <SectionList
          sections={[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.postCard}>
              <Card.Title
                title={item.author_name}
                subtitle={item.scheduled_time || 'Time TBD'}
                left={(props) => <Avatar.Text {...props} label={item.author_name?.charAt(0) || 'U'} />}
              />
              <Card.Content>
                <Text variant="bodyMedium" numberOfLines={3}>
                  {item.content_preview || 'No preview available'}
                </Text>
                {item.post_type && (
                  <Chip style={styles.typeChip}>{item.post_type}</Chip>
                )}
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => openLinkedIn(item.linkedin_url)}>
                  Open in LinkedIn
                </Button>
                <Button>Mark Engaged</Button>
              </Card.Actions>
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
  filterRow: {
    flexDirection: 'row',
    padding: 16,
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
    marginBottom: 24,
  },
  importButton: {
    backgroundColor: '#0D9488',
  },
  postCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  typeChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#1E293B',
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
