import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

/**
 * Register for push notifications and get the push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Skip push notifications on web - requires VAPID key configuration
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform detected - skipping push token registration');
    return null;
  }

  let token: string | null = null;

  // Check if running on a physical device (Expo Go or standalone)
  const isDevice = Constants.executionEnvironment !== 'storeClient';

  if (!isDevice) {
    console.log('[Notifications] Simulator detected - push tokens may not work');
  }

  // Check/request permissions
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }
  } catch (error) {
    console.error('[Notifications] Error checking permissions:', error);
    return null;
  }

  // Get the token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenData.data;
    console.log('[Notifications] Push token:', token);
  } catch (error) {
    console.error('[Notifications] Error getting push token:', error);
    return null;
  }

  // Configure for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('cross-pollination', {
      name: 'Cross-Pollination Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0D9488',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return token;
}

/**
 * Save push token to user's profile in Supabase
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  const platform = Platform.OS as 'ios' | 'android' | 'web';

  const { error } = await supabase
    .from('user_push_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('[Notifications] Error saving push token:', error);
    throw error;
  }
}

/**
 * Schedule a local notification for a cross-pollination task
 */
export async function scheduleTaskReminder(
  taskId: string,
  authorName: string,
  postTheme: string,
  requiredBy: Date
): Promise<string | null> {
  try {
    // Calculate when to send - 30 minutes before deadline
    const reminderTime = new Date(requiredBy.getTime() - 30 * 60 * 1000);
    const now = new Date();

    if (reminderTime <= now) {
      // If reminder time has passed, send immediately
      return await sendImmediateNotification(
        '⏰ Cross-Pollination Due Soon!',
        `${authorName}'s post on "${postTheme}" needs your comment within 30 minutes!`,
        { taskId, type: 'cross-pollination-reminder' }
      );
    }

    const secondsUntilReminder = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Cross-Pollination Reminder',
        body: `${authorName}'s post on "${postTheme}" needs your comment soon!`,
        data: { taskId, type: 'cross-pollination-reminder' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilReminder,
      },
    });

    console.log(`[Notifications] Scheduled reminder for task ${taskId}: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('[Notifications] Error scheduling reminder:', error);
    return null;
  }
}

/**
 * Send an immediate notification
 */
export async function sendImmediateNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Immediate
    });

    return notificationId;
  } catch (error) {
    console.error('[Notifications] Error sending notification:', error);
    return null;
  }
}

/**
 * Send cross-pollination alert when a teammate posts
 */
export async function sendCrossPollinationAlert(
  authorName: string,
  postTheme: string,
  taskId: string
): Promise<string | null> {
  return sendImmediateNotification(
    '🐝 Cross-Pollination Time!',
    `${authorName} just posted about "${postTheme}". Comment within 2 hours!`,
    { taskId, type: 'cross-pollination-alert' }
  );
}

/**
 * Send urgent reminder when time is running out
 */
export async function sendUrgentReminder(
  authorName: string,
  minutesRemaining: number,
  taskId: string
): Promise<string | null> {
  return sendImmediateNotification(
    '🚨 Urgent: Time Running Out!',
    `Only ${minutesRemaining} minutes left to comment on ${authorName}'s post!`,
    { taskId, type: 'cross-pollination-urgent' }
  );
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Set up notification response listener
 */
export function setupNotificationResponseListener(
  onResponse: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(onResponse);
}

/**
 * Set up notification received listener (when app is foregrounded)
 */
export function setupNotificationReceivedListener(
  onReceived: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(onReceived);
}
