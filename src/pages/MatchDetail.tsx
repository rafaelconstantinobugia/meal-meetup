import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle, MapPin, Clock } from "lucide-react";
import { RestaurantSuggestions } from "@/components/RestaurantSuggestions";

interface MatchData {
  id: string;
  status: string;
  created_at: string;
  dish: {
    id: string;
    name: string;
    image_url: string;
    description: string;
    meal_type: string;
    mood_tags: string[];
  };
  other_user: {
    id: string;
    name: string;
    bio: string;
    city: string;
    profile_picture_url: string;
    food_preferences: string[];
    availability: string;
  };
}

export const MatchDetail = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get match with dish and other user data
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          id,
          status,
          created_at,
          user1_id,
          user2_id,
          dish_id,
          dishes (
            id,
            name,
            image_url,
            description,
            meal_type,
            mood_tags
          )
        `)
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;
      if (!matchData) throw new Error('Match not found');

      // Determine other user ID
      const otherUserId = matchData.user1_id === user.id ? matchData.user2_id : matchData.user1_id;

      // Get other user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', otherUserId)
        .single();

      if (profileError) throw profileError;

      setMatch({
        id: matchData.id,
        status: matchData.status,
        created_at: matchData.created_at,
        dish: matchData.dishes,
        other_user: {
          id: otherUserId,
          name: profileData.name,
          bio: profileData.bio || '',
          city: profileData.city,
          profile_picture_url: profileData.profile_picture_url || '',
          food_preferences: profileData.food_preferences || [],
          availability: profileData.availability
        }
      });
    } catch (error) {
      console.error('Error fetching match details:', error);
      toast({
        title: "Error",
        description: "Failed to load match details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startChat = () => {
    navigate(`/chat/${matchId}`);
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
            <p className="text-muted-foreground mb-4">This match may have been removed.</p>
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
          <h1 className="text-xl font-semibold">It's a Match! 🎉</h1>
        </div>
      </div>

      <div className="p-6 space-y-6 pb-24">
        {/* Dish Card */}
        <Card className="overflow-hidden">
          <div className="relative">
            <img
              src={match.dish.image_url}
              alt={match.dish.name}
              className="w-full h-48 object-cover"
            />
            <Badge className="absolute top-4 left-4 bg-primary text-white">
              {match.dish.meal_type}
            </Badge>
          </div>
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-2">{match.dish.name}</h2>
            <p className="text-muted-foreground text-sm mb-3">{match.dish.description}</p>
            <div className="flex flex-wrap gap-2">
              {match.dish.mood_tags?.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Matched User Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={match.other_user.profile_picture_url} />
                <AvatarFallback>
                  {match.other_user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{match.other_user.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {match.other_user.city}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {match.other_user.bio && (
              <p className="text-sm">{match.other_user.bio}</p>
            )}
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Available for {match.other_user.availability}</span>
            </div>

            {match.other_user.food_preferences?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Food Preferences:</p>
                <div className="flex flex-wrap gap-2">
                  {match.other_user.food_preferences.map((pref, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {pref}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restaurant Suggestions */}
        <RestaurantSuggestions city={match.other_user.city} dishName={match.dish.name} />

        {/* Action Button */}
        <Button
          onClick={startChat}
          className="w-full py-6 text-lg font-semibold"
          size="lg"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Start Chat
        </Button>
      </div>
    </div>
  );
};