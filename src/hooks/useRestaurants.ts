import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from './useGeolocation';

interface Restaurant {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  price_level?: number;
  photos?: string[];
  cuisine_types?: string[];
  distance?: number;
}

interface RestaurantFilters {
  maxDistance?: number;
  minRating?: number;
  priceRange?: number[];
  cuisineTypes?: string[];
  isOpen?: boolean;
}

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentPosition } = useGeolocation();

  const searchNearbyRestaurants = useCallback(async (
    dishType?: string,
    filters: RestaurantFilters = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Get current location
      const position = await getCurrentPosition();
      
      // Call our restaurant search edge function
      const { data, error: fnError } = await supabase.functions.invoke('search-restaurants', {
        body: {
          latitude: position.latitude,
          longitude: position.longitude,
          dish_type: dishType,
          ...filters
        }
      });

      if (fnError) throw fnError;
      
      setRestaurants(data?.restaurants || []);
      return data?.restaurants || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search restaurants';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getCurrentPosition]);

  const getRestaurantDetails = useCallback(async (placeId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-restaurant-details', {
        body: { place_id: placeId }
      });

      if (fnError) throw fnError;
      return data?.restaurant;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get restaurant details';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    restaurants,
    loading,
    error,
    searchNearbyRestaurants,
    getRestaurantDetails
  };
};