import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the user's session
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { dish_id, action } = await req.json()

    // Process the swipe action and find potential matches
    const result = await processSwipeAndMatch(supabaseClient, user.id, dish_id, action)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      },
    )
  }
})

async function processSwipeAndMatch(supabaseClient: any, userId: string, dishId: string, action: string) {
  // Step 1: Record the swipe
  await supabaseClient
    .from('user_dish_preferences')
    .upsert({
      user_id: userId,
      dish_id: dishId,
      liked: action === 'like'
    })

  // Step 2: Add to match queue if liked
  if (action === 'like') {
    await supabaseClient
      .from('match_queue')
      .upsert({
        user_id: userId,
        dish_id: dishId,
        priority_score: 50,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

    // Step 3: Look for potential matches
    const potentialMatches = await findPotentialMatches(supabaseClient, userId, dishId)
    
    if (potentialMatches.length > 0) {
      // Create matches with the best candidates
      const matches = await createMatches(supabaseClient, userId, dishId, potentialMatches)
      return { 
        matched: true, 
        matches: matches,
        message: `Found ${matches.length} new match${matches.length > 1 ? 'es' : ''}!`
      }
    }
  }

  return { 
    matched: false, 
    message: action === 'like' ? 'Looking for matches...' : 'Passed on this dish'
  }
}

async function findPotentialMatches(supabaseClient: any, userId: string, dishId: string) {
  // Get current user's profile first for compatibility scoring
  const { data: currentUserProfile } = await supabaseClient
    .from('profiles')
    .select('city, availability, food_preferences, allergies')
    .eq('user_id', userId)
    .single()

  if (!currentUserProfile) return []

  // Find users who also liked this dish and are in the match queue
  const { data: candidates } = await supabaseClient
    .from('match_queue')
    .select(`
      user_id,
      priority_score,
      profiles!inner(
        user_id,
        name,
        city,
        availability,
        food_preferences,
        allergies,
        profile_picture_url
      )
    `)
    .eq('dish_id', dishId)
    .neq('user_id', userId)
    .gte('expires_at', new Date().toISOString())

  if (!candidates?.length) return []

  // Enhanced matching with compatibility scoring
  const scoredCandidates = candidates.map(candidate => {
    const profile = candidate.profiles
    let compatibilityScore = 50 // Base score

    // Same city bonus (high priority for in-person meetings)
    if (profile.city === currentUserProfile.city) {
      compatibilityScore += 30
    }

    // Availability compatibility
    if (profile.availability === currentUserProfile.availability || 
        profile.availability === 'both' || 
        currentUserProfile.availability === 'both') {
      compatibilityScore += 20
    }

    // Food preferences alignment
    const commonPreferences = (profile.food_preferences || []).filter(pref => 
      (currentUserProfile.food_preferences || []).includes(pref)
    ).length
    compatibilityScore += commonPreferences * 5

    // Allergy compatibility (slight penalty if either has allergies)
    const hasAllergies = (profile.allergies?.length > 0) || (currentUserProfile.allergies?.length > 0)
    if (hasAllergies) {
      compatibilityScore -= 5
    }

    return {
      ...candidate,
      compatibilityScore: Math.min(100, Math.max(0, compatibilityScore))
    }
  })

  // Sort by compatibility score and return top matches
  return scoredCandidates
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 3) // Limit to top 3 matches for better experience
}

async function createMatches(supabaseClient: any, userId: string, dishId: string, candidates: any[]) {
  const matches = []

  for (const candidate of candidates) {
    try {
      // Check if match already exists
      const { data: existingMatch } = await supabaseClient
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${candidate.user_id}),and(user1_id.eq.${candidate.user_id},user2_id.eq.${userId})`)
        .eq('dish_id', dishId)
        .single()

      if (!existingMatch) {
        // Create new match
        const { data: newMatch, error } = await supabaseClient
          .from('matches')
          .insert({
            user1_id: userId,
            user2_id: candidate.user_id,
            dish_id: dishId,
            status: 'matched'
          })
          .select()
          .single()

        if (!error && newMatch) {
          matches.push({
            match_id: newMatch.id,
            other_user: candidate.profiles
          })

          // Remove both users from match queue for this dish
          await supabaseClient
            .from('match_queue')
            .delete()
            .eq('dish_id', dishId)
            .in('user_id', [userId, candidate.user_id])
        }
      }
    } catch (error) {
      console.error('Error creating match:', error)
    }
  }

  return matches
}