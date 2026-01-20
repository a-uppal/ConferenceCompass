// Follow-Up Service - Client-side service for AI-powered follow-up messages
import { Linking, Alert } from 'react-native';
import { supabase } from './supabase';

// Dynamic clipboard import with fallback
let Clipboard: any = null;
try {
  Clipboard = require('expo-clipboard');
} catch (e) {
  console.warn('expo-clipboard not available, will use alert fallback');
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (Clipboard?.setStringAsync) {
      await Clipboard.setStringAsync(text);
      return true;
    }
  } catch (e) {
    console.warn('Clipboard copy failed:', e);
  }
  // Fallback: show the text in an alert for manual copying
  Alert.alert('Copy this message', text, [{ text: 'OK' }]);
  return false;
}
import {
  Contact,
  FollowUpChannel,
  FollowUpHistory,
  FollowUpReminder,
  MessageStyle,
  ReminderType,
} from '@/types/database';

// =============================================
// Types
// =============================================

export interface GeneratedMessage {
  success: boolean;
  message: string | null;
  subject?: string; // For email
  context: {
    contactName: string;
    company?: string;
    conferenceName: string;
    notesUsed: string[];
    sessionsReferenced: string[];
    daysSinceConference: number;
  } | null;
  style: MessageStyle;
  channel: FollowUpChannel;
  error?: string;
}

export interface FollowUpStats {
  total: number;
  pending: number;
  completed: number;
  replied: number;
  meetingsBooked: number;
  completionRate: number;
}

// =============================================
// Message Generation
// =============================================

/**
 * Generate an AI-powered follow-up message for a contact
 */
export async function generateFollowUpMessage(
  contactId: string,
  userId: string,
  style: MessageStyle,
  channel: FollowUpChannel,
  userName?: string
): Promise<GeneratedMessage> {
  const { data, error } = await supabase.functions.invoke<GeneratedMessage>(
    'generate-follow-up',
    {
      body: {
        contactId,
        userId,
        style,
        channel: channel === 'phone' || channel === 'other' ? 'linkedin' : channel,
        userName,
      },
    }
  );

  if (error) {
    return {
      success: false,
      message: null,
      context: null,
      style,
      channel,
      error: error.message,
    };
  }

  return data || {
    success: false,
    message: null,
    context: null,
    style,
    channel,
    error: 'No response from AI service',
  };
}

// =============================================
// Copy & Open Actions
// =============================================

/**
 * Copy message to clipboard and open LinkedIn
 */
export async function copyAndOpenLinkedIn(
  message: string,
  linkedInUrl?: string
): Promise<void> {
  // Copy message to clipboard
  await copyToClipboard(message);

  // Open LinkedIn profile or messaging
  const url = linkedInUrl || 'https://www.linkedin.com/messaging/';

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    // Fallback to web version
    await Linking.openURL('https://www.linkedin.com/messaging/');
  }
}

/**
 * Copy message and open email composer
 */
export async function copyAndOpenEmail(
  message: string,
  email: string,
  subject?: string
): Promise<void> {
  // Copy message to clipboard as backup
  await copyToClipboard(message);

  // Build mailto URL
  const subjectParam = subject ? `subject=${encodeURIComponent(subject)}` : '';
  const bodyParam = `body=${encodeURIComponent(message)}`;
  const params = [subjectParam, bodyParam].filter(Boolean).join('&');
  const mailtoUrl = `mailto:${email}?${params}`;

  const canOpen = await Linking.canOpenURL(mailtoUrl);
  if (canOpen) {
    await Linking.openURL(mailtoUrl);
  }
}

/**
 * Generate LinkedIn search URL for a contact
 */
export function generateLinkedInSearchUrl(
  firstName: string,
  lastName: string,
  company?: string
): string {
  const query = company
    ? `${firstName} ${lastName} ${company}`
    : `${firstName} ${lastName}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}

// =============================================
// Follow-Up Status Management
// =============================================

/**
 * Mark a contact follow-up as sent and log to history
 */
export async function markFollowUpSent(
  contactId: string,
  userId: string,
  channel: FollowUpChannel,
  message: string,
  style?: MessageStyle,
  aiGenerated: boolean = true
): Promise<void> {
  const now = new Date().toISOString();

  // Update contact status
  const { error: updateError } = await supabase
    .from('contacts')
    .update({
      follow_up_status: 'completed',
      follow_up_channel: channel,
      follow_up_message: message,
      follow_up_sent_at: now,
      follow_up_response_status: 'pending',
    })
    .eq('id', contactId);

  if (updateError) {
    console.error('Error updating contact:', updateError);
    throw updateError;
  }

  // Log to follow-up history
  const { error: historyError } = await supabase
    .from('follow_up_history')
    .insert({
      contact_id: contactId,
      user_id: userId,
      channel,
      message_style: style,
      message_content: message,
      ai_generated: aiGenerated,
      sent_at: now,
    });

  if (historyError) {
    console.error('Error logging follow-up history:', historyError);
    // Don't throw - history logging is secondary
  }
}

/**
 * Update follow-up response status
 */
export async function updateResponseStatus(
  contactId: string,
  status: 'replied' | 'no_response' | 'meeting_booked',
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .update({
      follow_up_response_status: status,
    })
    .eq('id', contactId);

  if (error) throw error;

  // If there's a note, update the latest history entry
  if (notes) {
    const { data: history } = await supabase
      .from('follow_up_history')
      .select('id')
      .eq('contact_id', contactId)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (history) {
      await supabase
        .from('follow_up_history')
        .update({
          response_received: true,
          response_at: new Date().toISOString(),
          response_type: status === 'meeting_booked' ? 'meeting_scheduled' :
                         status === 'replied' ? 'positive' : 'neutral',
          notes,
        })
        .eq('id', history.id);
    }
  }
}

// =============================================
// Reminder Management
// =============================================

/**
 * Schedule a follow-up reminder
 */
export async function scheduleReminder(
  contactId: string,
  userId: string,
  remindAt: Date,
  reminderType: ReminderType = 'follow_up'
): Promise<FollowUpReminder> {
  const { data, error } = await supabase
    .from('follow_up_reminders')
    .insert({
      contact_id: contactId,
      user_id: userId,
      remind_at: remindAt.toISOString(),
      reminder_type: reminderType,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get pending reminders for a user
 */
export async function getPendingReminders(
  userId: string
): Promise<FollowUpReminder[]> {
  const { data, error } = await supabase
    .from('follow_up_reminders')
    .select(`
      *,
      contact:contacts(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('remind_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Dismiss a reminder
 */
export async function dismissReminder(reminderId: string): Promise<void> {
  const { error } = await supabase
    .from('follow_up_reminders')
    .update({ status: 'dismissed' })
    .eq('id', reminderId);

  if (error) throw error;
}

/**
 * Mark reminder as sent (called after notification is delivered)
 */
export async function markReminderSent(
  reminderId: string,
  notificationId?: string
): Promise<void> {
  const { error } = await supabase
    .from('follow_up_reminders')
    .update({
      status: 'sent',
      notification_id: notificationId,
    })
    .eq('id', reminderId);

  if (error) throw error;
}

// =============================================
// Follow-Up History
// =============================================

/**
 * Get follow-up history for a contact
 */
export async function getFollowUpHistory(
  contactId: string
): Promise<FollowUpHistory[]> {
  const { data, error } = await supabase
    .from('follow_up_history')
    .select('*')
    .eq('contact_id', contactId)
    .order('sent_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// =============================================
// Dashboard & Stats
// =============================================

/**
 * Get contacts that need follow-up, sorted by priority
 */
export async function getContactsNeedingFollowUp(
  conferenceId: string,
  userId: string
): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('conference_id', conferenceId)
    .eq('captured_by', userId)
    .in('follow_up_status', ['none', 'pending'])
    .order('priority_score', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get completed follow-ups for a conference
 */
export async function getCompletedFollowUps(
  conferenceId: string,
  userId: string
): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('conference_id', conferenceId)
    .eq('captured_by', userId)
    .eq('follow_up_status', 'completed')
    .order('follow_up_sent_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Calculate follow-up statistics for a conference
 */
export async function getFollowUpStats(
  conferenceId: string,
  userId: string
): Promise<FollowUpStats> {
  const { data, error } = await supabase
    .from('contacts')
    .select('follow_up_status, follow_up_response_status')
    .eq('conference_id', conferenceId)
    .eq('captured_by', userId);

  if (error) throw error;

  const contacts = data || [];
  const total = contacts.length;
  const pending = contacts.filter(c =>
    c.follow_up_status === 'none' || c.follow_up_status === 'pending'
  ).length;
  const completed = contacts.filter(c => c.follow_up_status === 'completed').length;
  const replied = contacts.filter(c => c.follow_up_response_status === 'replied').length;
  const meetingsBooked = contacts.filter(c =>
    c.follow_up_response_status === 'meeting_booked'
  ).length;

  return {
    total,
    pending,
    completed,
    replied,
    meetingsBooked,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

/**
 * Update contact priority score based on notes content
 * Higher scores for contacts mentioning budget, timeline, decision-maker keywords
 */
export async function calculatePriorityScore(contact: Contact): Promise<number> {
  let score = 0;
  const notes = (contact.notes || '').toLowerCase();

  // High priority keywords
  const highPriorityKeywords = [
    'budget', 'q1', 'q2', 'q3', 'q4', 'timeline', 'decision',
    'approve', 'interested', 'pilot', 'demo', 'follow up', 'urgent',
    'ceo', 'cto', 'vp', 'director', 'head of', 'chief',
  ];

  for (const keyword of highPriorityKeywords) {
    if (notes.includes(keyword)) {
      score += 10;
    }
  }

  // Title-based scoring
  const title = (contact.title || '').toLowerCase();
  if (title.includes('ceo') || title.includes('cto') || title.includes('chief')) {
    score += 20;
  } else if (title.includes('vp') || title.includes('vice president') || title.includes('director')) {
    score += 15;
  } else if (title.includes('head') || title.includes('lead') || title.includes('manager')) {
    score += 10;
  }

  // Has email (easier to follow up)
  if (contact.email) {
    score += 5;
  }

  // Has LinkedIn (can connect)
  if (contact.linkedin_url) {
    score += 5;
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Update priority scores for all contacts in a conference
 */
export async function updateAllPriorityScores(
  conferenceId: string,
  userId: string
): Promise<void> {
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('conference_id', conferenceId)
    .eq('captured_by', userId);

  if (!contacts) return;

  for (const contact of contacts) {
    const score = await calculatePriorityScore(contact);
    await supabase
      .from('contacts')
      .update({ priority_score: score })
      .eq('id', contact.id);
  }
}
