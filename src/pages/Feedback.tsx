import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Star } from "lucide-react";

interface MatchData {
  id: string;
  dish: {
    name: string;
    image_url: string;
  };
  other_user: {
    name: string;
  };
}

export const Feedback = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [wouldMeetAgain, setWouldMeetAgain] = useState(false);

  useEffect(() => {
    if (matchId) {
      fetchMatchData();
    }
  }, [matchId]);

  const fetchMatchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: matchData, error } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          dishes (
            name,
            image_url
          )
        `)
        .eq('id', matchId)
        .single();

      if (error) throw error;
      if (!matchData) throw new Error('Match not found');

      // Get other user's profile
      const otherUserId = matchData.user1_id === user.id ? matchData.user2_id : matchData.user1_id;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', otherUserId)
        .single();

      if (profileError) throw profileError;

      setMatch({
        id: matchData.id,
        dish: matchData.dishes,
        other_user: {
          name: profileData.name
        }
      });
    } catch (error) {
      console.error('Error fetching match data:', error);
      toast({
        title: "Error",
        description: "Failed to load match details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please rate your meetup experience",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Submit feedback via edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('https://hbchqxckyepyosxwxhui.supabase.co/functions/v1/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          match_id: matchId,
          rating,
          feedback_text: feedback,
          would_meet_again: wouldMeetAgain
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit feedback');

      // Update match status to completed
      await supabase
        .from('matches')
        .update({ status: 'completed' })
        .eq('id', matchId);

      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve the experience",
      });

      navigate('/matches');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Match not found</h2>
            <p className="text-muted-foreground mb-4">Unable to load feedback form.</p>
            <Button onClick={() => navigate('/matches')} variant="outline">
              Back to Matches
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/matches')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">How was your meetup?</h1>
        </div>
      </div>

      <div className="p-6 space-y-6 pb-24">
        {/* Meetup Summary */}
        <Card>
          <CardContent className="p-4 text-center">
            <img
              src={match.dish.image_url}
              alt={match.dish.name}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-3"
            />
            <h2 className="font-semibold text-lg">{match.dish.name}</h2>
            <p className="text-muted-foreground">with {match.other_user.name}</p>
          </CardContent>
        </Card>

        {/* Rating */}
        <Card>
          <CardHeader>
            <CardTitle>Rate your experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 0 && "Tap a star to rate"}
              {rating === 1 && "Poor experience"}
              {rating === 2 && "Could be better"}
              {rating === 3 && "Good meetup"}
              {rating === 4 && "Great experience"}
              {rating === 5 && "Amazing meetup!"}
            </p>
          </CardContent>
        </Card>

        {/* Would meet again */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="meet-again"
                checked={wouldMeetAgain}
                onCheckedChange={(checked) => setWouldMeetAgain(checked === true)}
              />
              <label
                htmlFor="meet-again"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I'd be open to eating with {match.other_user.name} again
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Optional feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Tell us more (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="What made this meetup special? Any suggestions for improvement?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={submitFeedback}
          disabled={rating === 0 || submitting}
          className="w-full py-6 text-lg font-semibold"
          size="lg"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </div>
  );
};