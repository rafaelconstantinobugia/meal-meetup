import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the user from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { match_id, rating, feedback_text, would_meet_again } = await req.json();

    // Validate required fields
    if (!match_id || !rating || rating < 1 || rating > 5) {
      throw new Error('Invalid feedback data');
    }

    // Insert feedback into the database
    const { error: insertError } = await supabaseClient
      .from('feedback')
      .insert({
        match_id,
        user_id: user.id,
        rating,
        feedback_text: feedback_text || null,
        would_meet_again: would_meet_again || false
      });

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      throw insertError;
    }

    // Update match status to completed
    const { error: updateError } = await supabaseClient
      .from('matches')
      .update({ status: 'completed' })
      .eq('id', match_id);

    if (updateError) {
      console.error('Error updating match status:', updateError);
      // Don't throw here as feedback was already saved
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in submit-feedback:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}