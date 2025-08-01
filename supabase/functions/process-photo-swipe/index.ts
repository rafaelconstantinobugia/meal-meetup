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

    // Get the photo details to know who owns it
    const { data: photo, error: photoError } = await supabase
      .from('food_photos')
      .select('user_id')
      .eq('id', photo_id)
      .single()

    if (photoError || !photo) {
      throw new Error('Photo not found')
    }

    // Prevent swiping on own photos
    if (photo.user_id === user.id) {
      throw new Error('Cannot swipe on your own photos')
    }

    // Insert the swipe (upsert to handle duplicates)
    const { error: swipeError } = await supabase
      .from('photo_swipes')
      .upsert({
        swiper_user_id: user.id,
        photo_id: photo_id,
        choice: choice
      })

    if (swipeError) {
      throw swipeError
    }

    let matchResult = null

    // Only check for matches if it was a like
    if (choice) {
      console.log(`Checking for potential match between ${user.id} and ${photo.user_id}`)

      // Count mutual likes between the two users
      const { data: myLikesCount, error: myLikesError } = await supabase
        .from('photo_swipes')
        .select('id')
        .eq('swiper_user_id', user.id)
        .eq('choice', true)
        .in('photo_id', 
          supabase
            .from('food_photos')
            .select('id')
            .eq('user_id', photo.user_id)
        )

      const { data: theirLikesCount, error: theirLikesError } = await supabase
        .from('photo_swipes')
        .select('id')
        .eq('swiper_user_id', photo.user_id)
        .eq('choice', true)
        .in('photo_id',
          supabase
            .from('food_photos')
            .select('id')
            .eq('user_id', user.id)
        )

      if (myLikesError || theirLikesError) {
        console.error('Error counting likes:', myLikesError || theirLikesError)
        throw new Error('Error checking for matches')
      }

      const myLikes = myLikesCount?.length || 0
      const theirLikes = theirLikesCount?.length || 0
      const totalMutualLikes = Math.min(myLikes, theirLikes)

      console.log(`Mutual likes: my likes = ${myLikes}, their likes = ${theirLikes}, mutual = ${totalMutualLikes}`)

      // Create match if there are 2+ mutual likes
      if (totalMutualLikes >= 2) {
        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from('photo_matches')
          .select('id')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${photo.user_id}),and(user1_id.eq.${photo.user_id},user2_id.eq.${user.id})`)
          .single()

        if (!existingMatch) {
          console.log(`Creating new photo match between ${user.id} and ${photo.user_id}`)

          // Create the match (ensure user1_id < user2_id for consistency)
          const [user1Id, user2Id] = user.id < photo.user_id ? [user.id, photo.user_id] : [photo.user_id, user.id]

          const { data: newMatch, error: matchError } = await supabase
            .from('photo_matches')
            .insert({
              user1_id: user1Id,
              user2_id: user2Id,
              mutual_likes_count: totalMutualLikes,
              status: 'matched'
            })
            .select()
            .single()

          if (matchError) {
            console.error('Error creating match:', matchError)
            throw matchError
          }

          // Get the other user's profile
          const { data: otherUserProfile, error: profileError } = await supabase
            .from('profiles')
            .select('name, city, profile_picture_url')
            .eq('user_id', photo.user_id)
            .single()

          if (profileError) {
            console.error('Error fetching other user profile:', profileError)
          }

          matchResult = {
            matched: true,
            match_id: newMatch.id,
            other_user: otherUserProfile || { name: 'Food Lover', city: 'Unknown' },
            mutual_likes_count: totalMutualLikes
          }

          console.log(`Match created successfully:`, matchResult)
        } else {
          console.log('Match already exists between these users')
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