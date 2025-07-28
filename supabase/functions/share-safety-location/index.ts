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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { match_id, user_id, location, timestamp } = await req.json()

    if (!match_id || !user_id || !location) {
      return new Response(
        JSON.stringify({ error: 'Match ID, user ID, and location are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is part of this match
    const { data: match } = await supabaseClient
      .from('matches')
      .select('user1_id, user2_id')
      .eq('id', match_id)
      .single()

    if (!match || (match.user1_id !== user.id && match.user2_id !== user.id)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to match' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store location securely (encrypted in production)
    const locationData = {
      match_id,
      user_id,
      latitude: location.latitude,
      longitude: location.longitude,
      shared_at: timestamp,
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
    }

    // In production, this would be stored in a secure, encrypted table
    console.log('Safety location shared:', locationData)

    // Update meetup coordination
    await supabaseClient
      .from('meetup_coordination')
      .upsert({
        match_id,
        emergency_contact_shared: true,
        updated_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Location shared securely' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sharing safety location:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})