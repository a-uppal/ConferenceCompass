import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { useContactStore } from '@/stores/contactStore';

export default function NewContactScreen() {
  const { user } = useAuth();
  const { activeConference } = useTeam();
  const { addContact, isLoading } = useContactStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<'none' | 'pending' | 'completed'>('none');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateLinkedIn = (url: string) => {
    if (!url) return true;
    return url.includes('linkedin.com');
  };

  const handleSave = async () => {
    try {
      setError('');

      if (!firstName.trim() || !lastName.trim()) {
        setError('First name and last name are required');
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      if (!validateLinkedIn(linkedinUrl)) {
        setError('Please enter a valid LinkedIn URL');
        return;
      }

      if (!activeConference || !user) {
        setError('No active conference selected');
        return;
      }

      await addContact({
        conference_id: activeConference.id,
        captured_by: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company: company.trim() || undefined,
        title: title.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        follow_up_status: followUpStatus,
        follow_up_date: followUpStatus === 'pending' ? new Date().toISOString().split('T')[0] : undefined,
      });

      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to save contact');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.form}>
          <Text variant="headlineSmall" style={styles.title}>
            Add New Contact
          </Text>

          {error ? (
            <HelperText type="error" visible style={styles.error}>
              {error}
            </HelperText>
          ) : null}

          <View style={styles.row}>
            <TextInput
              label="First Name *"
              value={firstName}
              onChangeText={setFirstName}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
            />
            <TextInput
              label="Last Name *"
              value={lastName}
              onChangeText={setLastName}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
            />
          </View>

          <TextInput
            label="Company"
            value={company}
            onChangeText={setCompany}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Job Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
            error={!!email && !validateEmail(email)}
          />

          <TextInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="LinkedIn Profile URL"
            value={linkedinUrl}
            onChangeText={setLinkedinUrl}
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
            placeholder="https://linkedin.com/in/username"
            error={!!linkedinUrl && !validateLinkedIn(linkedinUrl)}
          />

          <TextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={styles.input}
            mode="outlined"
          />

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Follow-up Status
          </Text>
          <View style={styles.chipRow}>
            <Chip
              selected={followUpStatus === 'none'}
              onPress={() => setFollowUpStatus('none')}
              style={styles.chip}
            >
              None
            </Chip>
            <Chip
              selected={followUpStatus === 'pending'}
              onPress={() => setFollowUpStatus('pending')}
              style={styles.chip}
            >
              Pending
            </Chip>
            <Chip
              selected={followUpStatus === 'completed'}
              onPress={() => setFollowUpStatus('completed')}
              style={styles.chip}
            >
              Completed
            </Chip>
          </View>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Save Contact
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    padding: 20,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#0D9488',
  },
  error: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#1E293B',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
});
