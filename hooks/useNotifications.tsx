import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { router } from 'expo-router';
import { useAuth } from './useAuth';
import {
  registerForPushNotificationsAsync,
  savePushToken,
  scheduleTaskReminder,
  sendCrossPollinationAlert,
  cancelNotification,
  setupNotificationResponseListener,
  setupNotificationReceivedListener,
} from '@/services/notifications';
import * as Notifications from 'expo-notifications';

interface NotificationContextType {
  pushToken: string | null;
  isRegistered: boolean;
  registerForNotifications: () => Promise<void>;
  scheduleTaskNotification: (
    taskId: string,
    authorName: string,
    postTheme: string,
    requiredBy: Date
  ) => Promise<string | null>;
  sendNewPostAlert: (authorName: string, postTheme: string, taskId: string) => Promise<void>;
  cancelTaskNotification: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Register for notifications when user logs in
  useEffect(() => {
    if (user && !isRegistered) {
      registerForNotifications();
    }
  }, [user]);

  // Set up notification listeners
  useEffect(() => {
    // When a notification is received while app is foregrounded
    notificationListener.current = setupNotificationReceivedListener((notification) => {
      console.log('[Notifications] Received:', notification);
    });

    // When user taps on a notification
    responseListener.current = setupNotificationResponseListener((response) => {
      console.log('[Notifications] Response:', response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    if (data?.type === 'cross-pollination-alert' || data?.type === 'cross-pollination-reminder') {
      // Navigate to pollinate tab
      router.push('/(tabs)/pollinate');
    }
  };

  const registerForNotifications = useCallback(async () => {
    try {
      const token = await registerForPushNotificationsAsync();

      if (token) {
        setPushToken(token);
        setIsRegistered(true);

        // Save token to Supabase if user is logged in
        if (user) {
          try {
            await savePushToken(user.id, token);
          } catch (error) {
            // Table might not exist yet, just log the error
            console.log('[Notifications] Could not save push token to database:', error);
          }
        }
      }
    } catch (error) {
      console.error('[Notifications] Registration error:', error);
    }
  }, [user]);

  const scheduleTaskNotification = useCallback(
    async (
      taskId: string,
      authorName: string,
      postTheme: string,
      requiredBy: Date
    ): Promise<string | null> => {
      return scheduleTaskReminder(taskId, authorName, postTheme, requiredBy);
    },
    []
  );

  const sendNewPostAlert = useCallback(
    async (authorName: string, postTheme: string, taskId: string): Promise<void> => {
      await sendCrossPollinationAlert(authorName, postTheme, taskId);
    },
    []
  );

  const cancelTaskNotification = useCallback(async (notificationId: string): Promise<void> => {
    await cancelNotification(notificationId);
  }, []);

  const value: NotificationContextType = {
    pushToken,
    isRegistered,
    registerForNotifications,
    scheduleTaskNotification,
    sendNewPostAlert,
    cancelTaskNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
