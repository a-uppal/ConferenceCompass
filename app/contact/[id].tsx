import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Text, Surface, Button, Chip, IconButton, TextInput, Divider } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContactStore } from '@/stores/contactStore';
import { Contact } from '@/types/database';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { contacts, updateContact, deleteContact, isLoading } = useContactStore();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<'none' | 'pending' | 'completed'>('none');

  useEffect(() => {
    const found = contacts.find((c) => c.id === id);
    if (found) {
      setContact(found);
      setEditedNotes(found.notes || '');
      setFollowUpStatus(found.follow_up_status);
    }
  }, [id, contacts]);

  if (!contact) {
    return (
      <View style={styles.container}>
        <Text>Contact not found</Text>
      </View>
    );
  }

  const handleCall = () => {
    if (contact.phone) {
      Linking.openURL(`tel:${contact.phone}`);
    }
  };

  const handleEmail = () => {
    if (contact.email) {
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleLinkedIn = () => {
    if (contact.linkedin_url) {
      Linking.openURL(contact.linkedin_url);
    }
  };

  const handleSaveChanges = async () => {
    try {
      await updateContact(contact.id, {
        notes: editedNotes,
        follow_up_status: followUpStatus,
        follow_up_date: followUpStatus === 'pending' ? new Date().toISOString().split('T')[0] : undefined,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating contact:', err);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.first_name} ${contact.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContact(contact.id);
              router.back();
            } catch (err) {
              console.error('Error deleting contact:', err);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
          </Text>
        </View>
        <Text variant="headlineSmall" style={styles.name}>
          {contact.first_name} {contact.last_name}
        </Text>
        {contact.title && (
          <Text variant="bodyMedium" style={styles.title}>
            {contact.title}
          </Text>
        )}
        {contact.company && (
          <Text variant="bodyMedium" style={styles.company}>
            {contact.company}
          </Text>
        )}

        <View style={styles.quickActions}>
          {contact.phone && (
            <IconButton
              icon="phone"
              mode="contained"
              containerColor="#0D9488"
              iconColor="#fff"
              onPress={handleCall}
            />
          )}
          {contact.email && (
            <IconButton
              icon="email"
              mode="contained"
              containerColor="#0D9488"
              iconColor="#fff"
              onPress={handleEmail}
            />
          )}
          {contact.linkedin_url && (
            <IconButton
              icon="linkedin"
              mode="contained"
              containerColor="#0077B5"
              iconColor="#fff"
              onPress={handleLinkedIn}
            />
          )}
        </View>
      </Surface>

      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Contact Information
        </Text>
        <Divider style={styles.divider} />

        {contact.email && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#94A3B8" />
            <Text style={styles.infoText}>{contact.email}</Text>
          </View>
        )}

        {contact.phone && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color="#94A3B8" />
            <Text style={styles.infoText}>{contact.phone}</Text>
          </View>
        )}

        {contact.linkedin_url && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="linkedin" size={20} color="#94A3B8" />
            <Text style={styles.infoText} numberOfLines={1}>
              {contact.linkedin_url.replace('https://www.linkedin.com/in/', '')}
            </Text>
          </View>
        )}
      </Surface>

      <Surface style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Follow-up Status
          </Text>
          {!isEditing && (
            <Button mode="text" onPress={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </View>
        <Divider style={styles.divider} />

        <View style={styles.chipRow}>
          <Chip
            selected={followUpStatus === 'none'}
            onPress={() => isEditing && setFollowUpStatus('none')}
            style={styles.chip}
            disabled={!isEditing}
          >
            None
          </Chip>
          <Chip
            selected={followUpStatus === 'pending'}
            onPress={() => isEditing && setFollowUpStatus('pending')}
            style={styles.chip}
            disabled={!isEditing}
          >
            Pending
          </Chip>
          <Chip
            selected={followUpStatus === 'completed'}
            onPress={() => isEditing && setFollowUpStatus('completed')}
            style={styles.chip}
            disabled={!isEditing}
          >
            Completed
          </Chip>
        </View>

        {contact.follow_up_date && (
          <Text variant="bodySmall" style={styles.followUpDate}>
            Last updated: {new Date(contact.follow_up_date).toLocaleDateString()}
          </Text>
        )}
      </Surface>

      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Notes
        </Text>
        <Divider style={styles.divider} />

        {isEditing ? (
          <TextInput
            value={editedNotes}
            onChangeText={setEditedNotes}
            multiline
            numberOfLines={4}
            mode="outlined"
            placeholder="Add notes about this contact..."
          />
        ) : (
          <Text style={styles.notesText}>
            {contact.notes || 'No notes yet.'}
          </Text>
        )}
      </Surface>

      {isEditing ? (
        <View style={styles.editActions}>
          <Button mode="outlined" onPress={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleSaveChanges} loading={isLoading}>
            Save Changes
          </Button>
        </View>
      ) : (
        <Button
          mode="outlined"
          textColor="#EF4444"
          onPress={handleDelete}
          style={styles.deleteButton}
        >
          Delete Contact
        </Button>
      )}

      <View style={styles.metadata}>
        <Text variant="bodySmall" style={styles.metadataText}>
          Captured: {new Date(contact.created_at).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    opacity: 0.7,
  },
  company: {
    opacity: 0.7,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#0D9488',
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#1E293B',
  },
  followUpDate: {
    marginTop: 12,
    opacity: 0.6,
  },
  notesText: {
    opacity: 0.8,
    lineHeight: 22,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    gap: 12,
  },
  deleteButton: {
    margin: 16,
    borderColor: '#EF4444',
  },
  metadata: {
    padding: 16,
    alignItems: 'center',
  },
  metadataText: {
    opacity: 0.5,
  },
});
