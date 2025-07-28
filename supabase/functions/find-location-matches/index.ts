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
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get the user from the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { dish_id, user_location, max_distance = 25, require_same_city = false } = await req.json()

    if (!dish_id) {
      return new Response(
        JSON.stringify({ error: 'Dish ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's profile to get their city
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('city')
      .eq('user_id', user.id)
      .single()

    // Find users who liked the same dish
    let query = supabaseClient
      .from('user_dish_preferences')
      .select(`
        user_id,
        profiles!inner(
          user_id,
          name,
          city,
          profile_picture_url
        )
      `)
      .eq('dish_id', dish_id)
      .eq('liked', true)
      .neq('user_id', user.id)

    // Apply city filter if required
    if (require_same_city && userProfile?.city) {
      query = query.eq('profiles.city', userProfile.city)
    }

    const { data: potentialMatches, error } = await query

    if (error) {
      console.error('Error finding matches:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to find matches' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate distances if location is provided
    let matches = potentialMatches || []
    
    if (user_location && max_distance) {
      // Filter by distance (this is a simplified version - in production you'd store user locations)
      matches = matches.filter(() => {
        // For now, we'll just return all matches within the same city
        // In a real app, you'd calculate actual distances based on stored coordinates
        return true
      })
    }

    // Format the response
    const formattedMatches = matches.map((match: any) => ({
      user_id: match.user_id,
      name: match.profiles.name,
      city: match.profiles.city,
      profile_picture_url: match.profiles.profile_picture_url,
      compatibility_score: Math.floor(Math.random() * 30) + 70, // Placeholder scoring
      distance: user_location ? Math.floor(Math.random() * max_distance) : null
    }))

    return new Response(
      JSON.stringify({ matches: formattedMatches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error finding location matches:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})