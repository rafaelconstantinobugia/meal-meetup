import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from './useGeolocation';

interface LocationPreferences {
  max_distance_km: number;
  preferred_areas: string[];
  avoid_areas: string[];
}

interface MatchingOptions {
  includeLocation?: boolean;
  maxDistance?: number;
  requireSameCity?: boolean;
}

export const useLocationMatching = () => {
  const [locationPrefs, setLocationPrefs] = useState<LocationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentPosition, coordinates } = useGeolocation();

  // Load user's location preferences
  useEffect(() => {
    loadLocationPreferences();
  }, []);

  const loadLocationPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('matching_preferences')
        .select('max_distance_km')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setLocationPrefs({
          max_distance_km: data.max_distance_km || 25,
          preferred_areas: [],
          avoid_areas: []
        });
      }
    } catch (err) {
      console.error('Error loading location preferences:', err);
    }
  }, []);

  const updateLocationPreferences = useCallback(async (prefs: Partial<LocationPreferences>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('matching_preferences')
        .upsert({
          user_id: user.id,
          max_distance_km: prefs.max_distance_km,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setLocationPrefs(prev => prev ? { ...prev, ...prefs } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const findNearbyMatches = useCallback(async (
    dishId: string,
    options: MatchingOptions = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      let userLocation = coordinates;
      
      // Get current position if not available
      if (!userLocation && options.includeLocation) {
        userLocation = await getCurrentPosition();
      }

      const { data, error: fnError } = await supabase.functions.invoke('find-location-matches', {
        body: {
          dish_id: dishId,
          user_location: userLocation,
          max_distance: options.maxDistance || locationPrefs?.max_distance_km || 25,
          require_same_city: options.requireSameCity || false
        }
      });

      if (fnError) throw fnError;
      return data?.matches || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find nearby matches';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [coordinates, getCurrentPosition, locationPrefs]);

  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  return {
    locationPrefs,
    loading,
    error,
    updateLocationPreferences,
    findNearbyMatches,
    calculateDistance
  };
};