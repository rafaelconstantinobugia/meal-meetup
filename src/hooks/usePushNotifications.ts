import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { useCapacitor } from './useCapacitor';

export const usePushNotifications = () => {
  const { isNative } = useCapacitor();
  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (!isNative) return;

    const setupPushNotifications = async () => {
      try {
        // Request permission
        const permission = await PushNotifications.requestPermissions();
        
        if (permission.receive === 'granted') {
          // Register for notifications
          await PushNotifications.register();
          setIsRegistered(true);
        }
      } catch (error) {
        console.error('Push notification setup failed:', error);
      }
    };

    // Listen for registration
    PushNotifications.addListener('registration', (token) => {
      setToken(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Registration error:', error);
    });

    // Listen for push notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    // Listen for notification actions
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
    });

    setupPushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [isNative]);

  return {
    token,
    isRegistered
  };
};