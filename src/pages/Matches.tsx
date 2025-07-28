import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, MapPin, Clock, ArrowLeft } from "lucide-react";

interface Match {
  id: string;
  status: string;
  created_at: string;
  dish: {
    name: string;
    image_url: string;
  };
  other_user: {
    name: string;
    city: string;
    bio: string;
  };
}

export const Matches = () => {
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [pastMeals, setPastMeals] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch matches with related data
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          status,
          created_at,
          user1_id,
          user2_id,
          dishes!inner(name, image_url)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process matches to get the correct other user profile
      const processedMatches = await Promise.all((data || []).map(async (match: any) => {
        const isUser1 = match.user1_id === user.id;
        const otherUserId = isUser1 ? match.user2_id : match.user1_id;
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, city, bio')
          .eq('user_id', otherUserId)
          .single();

        const otherUserProfile = profileData || { name: 'Unknown User', city: '', bio: '' };

        return {
          id: match.id,
          status: match.status,
          created_at: match.created_at,
          dish: match.dishes,
          other_user: otherUserProfile
        };
      }));

      // Split into active and completed matches
      const active = processedMatches.filter((match: Match) => 
        ['pending', 'matched', 'meetup_confirmed'].includes(match.status)
      );
      const past = processedMatches.filter((match: Match) => 
        ['completed', 'cancelled'].includes(match.status)
      );

      setActiveMatches(active);
      setPastMeals(past);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load matches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startChat = (matchId: string) => {
    navigate(`/chat/${matchId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Matching..." },
      matched: { variant: "default" as const, label: "New Match!" },
      meetup_confirmed: { variant: "default" as const, label: "Meetup Confirmed" },
      completed: { variant: "outline" as const, label: "Completed" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const MatchCard = ({ match }: { match: Match }) => (
    <Card className="shadow-card hover:shadow-soft transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Dish Image */}
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={match.dish.image_url}
              alt={match.dish.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Match Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{match.other_user.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {match.other_user.city}
                </p>
              </div>
              {getStatusBadge(match.status)}
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              Wants to share: <span className="font-medium text-foreground">{match.dish.name}</span>
            </p>

            {match.other_user.bio && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {match.other_user.bio}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(match.created_at).toLocaleDateString()}
              </div>

              {match.status === 'matched' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/match/${match.id}`)}
                    variant="outline"
                    className="h-8 px-3 text-xs"
                  >
                    View Match
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => startChat(match.id)}
                    className="food-button-primary h-8 px-3 text-xs"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Start Chat
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pt-safe-top p-6 pb-4 gradient-bg">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Your Matches</h1>
        </div>
      </div>

      <div className="p-6 -mt-4">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active">Active Matches</TabsTrigger>
            <TabsTrigger value="past">Past Meals</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : activeMatches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No active matches yet</p>
                <Button onClick={() => navigate("/")} className="food-button-primary">
                  Start Swiping
                </Button>
              </div>
            ) : (
              activeMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : pastMeals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No past meals yet</p>
              </div>
            ) : (
              pastMeals.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};