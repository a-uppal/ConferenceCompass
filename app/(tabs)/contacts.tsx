import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Searchbar, Card, Chip } from 'react-native-paper';
import { useState } from 'react';
import { router } from 'expo-router';

export default function ContactsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);

  const handleAddContact = () => {
    router.push('/contact/new');
  };

  const handleCapturePhoto = () => {
    router.push('/contact/capture');
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search contacts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.filterRow}>
        <Chip style={styles.chip} selected>All</Chip>
        <Chip style={styles.chip}>Pending Follow-up</Chip>
        <Chip style={styles.chip}>Today</Chip>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Contacts Yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Capture your first contact by taking a photo of a badge or adding manually.
          </Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.contactCard}>
              <Card.Title
                title={`${item.first_name} ${item.last_name}`}
                subtitle={`${item.title || ''} at ${item.company || ''}`}
              />
            </Card>
          )}
        />
      )}

      <FAB.Group
        open={false}
        visible
        icon="plus"
        actions={[
          {
            icon: 'camera',
            label: 'Capture Badge',
            onPress: handleCapturePhoto,
          },
          {
            icon: 'account-plus',
            label: 'Add Manually',
            onPress: handleAddContact,
          },
        ]}
        onStateChange={() => {}}
        fabStyle={styles.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
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
  contactCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  fab: {
    backgroundColor: '#0D9488',
  },
});
