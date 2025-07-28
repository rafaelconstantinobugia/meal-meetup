import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useCapacitor } from './useCapacitor';

export const useHaptics = () => {
  const { isNative } = useCapacitor();

  const impact = useCallback(async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (isNative) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
  }, [isNative]);

  const vibrate = useCallback(async () => {
    if (isNative) {
      try {
        await Haptics.vibrate();
      } catch (error) {
        console.log('Vibration not available:', error);
      }
    }
  }, [isNative]);

  const notification = useCallback(async () => {
    if (isNative) {
      try {
        await Haptics.notification({ type: NotificationType.Success });
      } catch (error) {
        console.log('Notification haptic not available:', error);
      }
    }
  }, [isNative]);

  return {
    impact,
    vibrate,
    notification
  };
};