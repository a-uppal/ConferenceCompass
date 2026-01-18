import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, Searchbar, Card, Chip, Avatar, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { useTeam } from '@/hooks/useTeam';
import { useContactStore } from '@/stores/contactStore';
import { Contact } from '@/types/database';

export default function ContactsScreen() {
  const { activeConference } = useTeam();
  const {
    contacts,
    isLoading,
    filters,
    setFilters,
    loadContacts,
    getFilteredContacts,
  } = useContactStore();

  const [fabOpen, setFabOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeConference) {
      loadContacts(activeConference.id);
    }
  }, [activeConference]);

  const onRefresh = async () => {
    if (!activeConference) return;
    setRefreshing(true);
    await loadContacts(activeConference.id);
    setRefreshing(false);
  };

  const filteredContacts = getFilteredContacts();

  const handleAddContact = () => {
    setFabOpen(false);
    router.push('/contact/new');
  };

  const handleCapturePhoto = () => {
    setFabOpen(false);
    router.push('/contact/capture');
  };

  const handleContactPress = (contact: Contact) => {
    router.push(`/contact/${contact.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
      default:
        return '#94A3B8';
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <Card style={styles.contactCard} onPress={() => handleContactPress(item)}>
      <Card.Title
        title={`${item.first_name} ${item.last_name}`}
        subtitle={item.company ? `${item.title || ''} at ${item.company}` : item.title}
        left={(props) => (
          <Avatar.Text
            {...props}
            size={40}
            label={`${item.first_name.charAt(0)}${item.last_name.charAt(0)}`}
            style={{ backgroundColor: '#0D9488' }}
          />
        )}
        right={(props) => (
          <View style={styles.statusIndicator}>
            {item.follow_up_status !== 'none' && (
              <Chip
                compact
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(item.follow_up_status) },
                ]}
                textStyle={styles.statusChipText}
              >
                {item.follow_up_status}
              </Chip>
            )}
            {item.linkedin_url && (
              <IconButton
                icon="linkedin"
                size={20}
                iconColor="#0077B5"
                onPress={() => {}}
              />
            )}
          </View>
        )}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search contacts..."
        onChangeText={(text) => setFilters({ search: text })}
        value={filters.search}
        style={styles.searchbar}
      />

      <View style={styles.filterRow}>
        <Chip
          style={[
            styles.chip,
            filters.followUpStatus === 'all' && styles.chipSelected,
          ]}
          selected={filters.followUpStatus === 'all'}
          onPress={() => setFilters({ followUpStatus: 'all' })}
        >
          All ({contacts.length})
        </Chip>
        <Chip
          style={[
            styles.chip,
            filters.followUpStatus === 'pending' && styles.chipSelected,
          ]}
          selected={filters.followUpStatus === 'pending'}
          onPress={() => setFilters({ followUpStatus: 'pending' })}
        >
          Pending
        </Chip>
        <Chip
          style={[
            styles.chip,
            filters.dateRange === 'today' && styles.chipSelected,
          ]}
          selected={filters.dateRange === 'today'}
          onPress={() =>
            setFilters({
              dateRange: filters.dateRange === 'today' ? 'all' : 'today',
            })
          }
        >
          Today
        </Chip>
      </View>

      {filteredContacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            {contacts.length === 0 ? 'No Contacts Yet' : 'No Matches'}
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {contacts.length === 0
              ? 'Capture your first contact by taking a photo of a badge or adding manually.'
              : 'Try adjusting your search or filters.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D9488"
            />
          }
        />
      )}

      <FAB.Group
        open={fabOpen}
        visible
        icon={fabOpen ? 'close' : 'plus'}
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
        onStateChange={({ open }) => setFabOpen(open)}
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
    marginBottom: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1E293B',
  },
  chipSelected: {
    backgroundColor: '#0D9488',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  contactCard: {
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    marginRight: 4,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 10,
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
  fab: {
    backgroundColor: '#0D9488',
  },
});
