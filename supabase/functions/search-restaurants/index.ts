import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { latitude, longitude, dish_type, maxDistance = 10, minRating = 3.0 } = await req.json()

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Google Places API key should be set in Edge Function secrets
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')
    
    if (!GOOGLE_PLACES_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build search query based on dish type
    let query = 'restaurant'
    if (dish_type) {
      query = `${dish_type} restaurant`
    }

    // Search for nearby restaurants
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${maxDistance * 1000}&type=restaurant&keyword=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`
    
    const placesResponse = await fetch(placesUrl)
    const placesData = await placesResponse.json()

    if (placesData.status !== 'OK') {
      console.error('Google Places API error:', placesData)
      return new Response(
        JSON.stringify({ error: 'Failed to search restaurants' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter and format results
    const restaurants = placesData.results
      .filter((place: any) => !minRating || place.rating >= minRating)
      .map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.vicinity,
        rating: place.rating,
        price_level: place.price_level,
        photos: place.photos?.map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        ) || [],
        cuisine_types: place.types?.filter((type: string) => 
          ['restaurant', 'food', 'establishment'].includes(type)
        ) || [],
        distance: calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }))
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, 20) // Limit to top 20 results

    return new Response(
      JSON.stringify({ restaurants }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error searching restaurants:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}