import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    const { photo_id, choice } = await req.json()

    if (!photo_id || typeof choice !== 'boolean') {
      throw new Error('Missing required fields: photo_id, choice')
    }

    console.log(`Processing photo swipe: user ${user.id}, photo ${photo_id}, choice ${choice}`)

    // Insert the swipe - trigger will handle matching automatically
    const { error: swipeError } = await supabase
      .from('photo_swipes')
      .insert({
        swiper_user_id: user.id,
        photo_id: photo_id,
        choice: choice
      })

    if (swipeError) {
      console.error('Error inserting swipe:', swipeError)
      throw swipeError
    }

    let matchResult = null

    // Check if a new match was created (only for likes)
    if (choice) {
      console.log(`Checking for new match for user ${user.id}`)

      // Get the photo owner
      const { data: photo, error: photoError } = await supabase
        .from('food_photos')
        .select('user_id')
        .eq('id', photo_id)
        .single()

      if (photoError || !photo) {
        console.error('Error fetching photo:', photoError)
      } else {
        // Check if match was just created by the trigger
        const { data: newMatch, error: matchError } = await supabase
          .from('photo_matches')
          .select('id, mutual_likes_count')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${photo.user_id}),and(user1_id.eq.${photo.user_id},user2_id.eq.${user.id})`)
          .eq('status', 'matched')
          .maybeSingle()

        if (matchError) {
          console.error('Error checking for match:', matchError)
        } else if (newMatch) {
          console.log(`Found match: ${newMatch.id}`)

          // Get the other user's profile
          const { data: otherUserProfile, error: profileError } = await supabase
            .from('profiles')
            .select('name, city, profile_picture_url')
            .eq('user_id', photo.user_id)
            .maybeSingle()

          if (profileError) {
            console.error('Error fetching other user profile:', profileError)
          }

          matchResult = {
            matched: true,
            match_id: newMatch.id,
            other_user: otherUserProfile || { name: 'Food Lover', city: 'Unknown' },
            mutual_likes_count: newMatch.mutual_likes_count
          }

          console.log(`Match found:`, matchResult)
        }
      }
    }

    const response = {
      success: true,
      matched: matchResult?.matched || false,
      match_data: matchResult
    }

    console.log('Final response:', response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in process-photo-swipe:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})