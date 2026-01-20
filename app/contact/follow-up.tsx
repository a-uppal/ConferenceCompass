import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  TextInput,
  ActivityIndicator,
  Avatar,
  IconButton,
  Snackbar,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useContactStore } from '@/stores/contactStore';
import {
  MessageStyleSelector,
  ChannelSelector,
  ReminderSelector,
} from '@/components/follow-up';
import {
  generateFollowUpMessage,
  copyAndOpenLinkedIn,
  copyAndOpenEmail,
  markFollowUpSent,
  scheduleReminder,
  GeneratedMessage,
} from '@/services/followUpService';
import { MessageStyle, FollowUpChannel, Contact } from '@/types/database';

export default function FollowUpComposerScreen() {
  const { user } = useAuth();
  const { contacts, loadContacts } = useContactStore();
  const params = useLocalSearchParams<{ contactId: string }>();
  const contactId = params.contactId;

  // Find contact from store
  const contact = contacts.find((c) => c.id === contactId);

  // State
  const [style, setStyle] = useState<MessageStyle>('professional');
  const [channel, setChannel] = useState<'linkedin' | 'email'>('linkedin');
  const [reminderDays, setReminderDays] = useState<number | null>(7);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [generationContext, setGenerationContext] = useState<GeneratedMessage['context'] | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Generate message on initial load and when style/channel changes
  useEffect(() => {
    if (contact && user && !isEdited) {
      generateMessage();
    }
  }, [style, channel]);

  const generateMessage = async () => {
    if (!contact || !user) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateFollowUpMessage(
        contact.id,
        user.id,
        style,
        channel,
        user.user_metadata?.full_name || user.email?.split('@')[0]
      );

      if (result.success && result.message) {
        setMessage(result.message);
        setSubject(result.subject || '');
        setGenerationContext(result.context);
        setIsEdited(false);
      } else {
        setError(result.error || 'Failed to generate message');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate message');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setIsEdited(false);
    generateMessage();
  };

  const handleMessageChange = (text: string) => {
    setMessage(text);
    setIsEdited(true);
  };

  const handleCopyAndOpen = async () => {
    if (!contact || !user || !message) return;

    setIsSending(true);

    try {
      // Open LinkedIn or Email
      if (channel === 'linkedin') {
        await copyAndOpenLinkedIn(message, contact.linkedin_url);
      } else {
        if (!contact.email) {
          Alert.alert('No Email', 'This contact does not have an email address.');
          setIsSending(false);
          return;
        }
        await copyAndOpenEmail(message, contact.email, subject);
      }

      // Show confirmation with option to mark as sent
      Alert.alert(
        'Message Copied!',
        `Your message has been copied to clipboard. ${
          channel === 'linkedin'
            ? 'Paste it in LinkedIn to send.'
            : 'Your email app should open with the message.'
        }`,
        [
          {
            text: 'Not Sent Yet',
            style: 'cancel',
            onPress: () => setIsSending(false),
          },
          {
            text: 'Mark as Sent',
            onPress: () => handleMarkAsSent(),
          },
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Failed to copy message');
      setIsSending(false);
    }
  };

  const handleMarkAsSent = async () => {
    if (!contact || !user) return;

    try {
      // Mark follow-up as sent
      await markFollowUpSent(
        contact.id,
        user.id,
        channel as FollowUpChannel,
        message,
        style,
        !isEdited // AI generated if not edited
      );

      // Schedule reminder if selected
      if (reminderDays) {
        const remindAt = new Date();
        remindAt.setDate(remindAt.getDate() + reminderDays);
        await scheduleReminder(contact.id, user.id, remindAt, 'follow_up');
      }

      setSnackbarMessage('Follow-up sent! Contact updated.');
      setSnackbarVisible(true);

      // Navigate back after a brief delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to mark as sent');
    } finally {
      setIsSending(false);
    }
  };

  if (!contact) {
    return (
      <View style={styles.container}>
        <Surface style={styles.errorCard}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text variant="titleMedium" style={styles.errorText}>
            Contact not found
          </Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </Surface>
      </View>
    );
  }

  const initials = `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contact Info Header */}
        <Surface style={styles.contactCard}>
          <Avatar.Text size={56} label={initials} style={styles.avatar} />
          <View style={styles.contactInfo}>
            <Text variant="titleLarge" style={styles.contactName}>
              {contact.first_name} {contact.last_name}
            </Text>
            {contact.title && contact.company && (
              <Text variant="bodyMedium" style={styles.contactRole}>
                {contact.title} at {contact.company}
              </Text>
            )}
            {contact.company && !contact.title && (
              <Text variant="bodyMedium" style={styles.contactRole}>
                {contact.company}
              </Text>
            )}
          </View>
        </Surface>

        {/* Context Used */}
        {generationContext && (
          <Surface style={styles.contextCard}>
            <Text variant="labelMedium" style={styles.contextTitle}>
              Context used for message:
            </Text>
            <View style={styles.contextItems}>
              <View style={styles.contextItem}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={14}
                  color="#94A3B8"
                />
                <Text variant="bodySmall" style={styles.contextText}>
                  {generationContext.conferenceName}
                  {generationContext.daysSinceConference > 0 &&
                    ` (${generationContext.daysSinceConference} days ago)`}
                </Text>
              </View>
              {generationContext.notesUsed.length > 0 && (
                <View style={styles.contextItem}>
                  <MaterialCommunityIcons
                    name="note-text-outline"
                    size={14}
                    color="#94A3B8"
                  />
                  <Text
                    variant="bodySmall"
                    style={styles.contextText}
                    numberOfLines={1}
                  >
                    Notes: "{generationContext.notesUsed[0]}"
                  </Text>
                </View>
              )}
              {generationContext.sessionsReferenced.length > 0 && (
                <View style={styles.contextItem}>
                  <MaterialCommunityIcons
                    name="presentation"
                    size={14}
                    color="#94A3B8"
                  />
                  <Text
                    variant="bodySmall"
                    style={styles.contextText}
                    numberOfLines={1}
                  >
                    Sessions: {generationContext.sessionsReferenced.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </Surface>
        )}

        {/* Style Selector */}
        <MessageStyleSelector
          selected={style}
          onSelect={setStyle}
          disabled={isGenerating}
        />

        {/* Channel Selector */}
        <ChannelSelector
          selected={channel}
          onSelect={setChannel}
          disabled={isGenerating}
          hasEmail={!!contact.email}
          hasLinkedIn={!!contact.linkedin_url}
        />

        {/* Message Display */}
        <Surface style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <Text variant="labelLarge" style={styles.messageLabel}>
              {isEdited ? 'Your Message (Edited)' : 'AI-Generated Message'}
            </Text>
            <IconButton
              icon="refresh"
              size={20}
              onPress={handleRegenerate}
              disabled={isGenerating}
            />
          </View>

          {channel === 'email' && subject && (
            <TextInput
              label="Subject"
              value={subject}
              onChangeText={setSubject}
              mode="outlined"
              style={styles.subjectInput}
            />
          )}

          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0D9488" />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Generating personalized message...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text variant="bodyMedium" style={styles.errorMessage}>
                {error}
              </Text>
              <Button mode="outlined" onPress={handleRegenerate}>
                Try Again
              </Button>
            </View>
          ) : (
            <TextInput
              value={message}
              onChangeText={handleMessageChange}
              mode="outlined"
              multiline
              numberOfLines={10}
              style={styles.messageInput}
            />
          )}
        </Surface>

        {/* Reminder Selector */}
        <ReminderSelector
          selected={reminderDays}
          onSelect={setReminderDays}
          disabled={isGenerating || isSending}
        />

        {/* Action Button */}
        <Button
          mode="contained"
          onPress={handleCopyAndOpen}
          loading={isSending}
          disabled={isGenerating || isSending || !message}
          icon={channel === 'linkedin' ? 'linkedin' : 'email'}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          {channel === 'linkedin' ? 'Copy & Open LinkedIn' : 'Copy & Open Email'}
        </Button>

        <Text variant="bodySmall" style={styles.helpText}>
          Message will be copied to clipboard. Paste it in{' '}
          {channel === 'linkedin' ? 'LinkedIn' : 'your email'} to send.
        </Text>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
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
    paddingBottom: 32,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#1E293B',
  },
  avatar: {
    backgroundColor: '#334155',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactName: {
    color: '#F8FAFC',
  },
  contactRole: {
    color: '#94A3B8',
    marginTop: 2,
  },
  contextCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#1E293B',
  },
  contextTitle: {
    color: '#94A3B8',
    marginBottom: 8,
  },
  contextItems: {
    gap: 6,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextText: {
    color: '#64748B',
    flex: 1,
  },
  messageCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#1E293B',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageLabel: {
    color: '#F8FAFC',
  },
  subjectInput: {
    marginBottom: 12,
  },
  messageInput: {
    minHeight: 200,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#94A3B8',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  errorMessage: {
    color: '#F59E0B',
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 8,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  helpText: {
    textAlign: 'center',
    color: '#64748B',
    marginBottom: 16,
  },
  errorCard: {
    margin: 20,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    gap: 16,
  },
  errorText: {
    color: '#F8FAFC',
  },
  snackbar: {
    backgroundColor: '#10B981',
  },
});
