import { useState, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { useCapacitor } from './useCapacitor';

interface Coordinates {
  latitude: number;
  longitude: number;
}

export const useGeolocation = () => {
  const { isNative } = useCapacitor();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const getCurrentPosition = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isNative) {
        const position = await Geolocation.getCurrentPosition();
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCoordinates(coords);
        return coords;
      } else {
        // Fallback for web
        return new Promise<Coordinates>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              setCoordinates(coords);
              resolve(coords);
            },
            (error) => reject(new Error(error.message))
          );
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isNative]);

  return {
    getCurrentPosition,
    coordinates,
    loading,
    error
  };
};