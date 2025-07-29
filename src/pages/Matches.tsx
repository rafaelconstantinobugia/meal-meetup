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
      pending: { variant: "secondary" as const, label: "A procurar..." },
      matched: { variant: "default" as const, label: "Novo Match! 🔥" },
      meetup_confirmed: { variant: "default" as const, label: "Confirmado ✓" },
      completed: { variant: "outline" as const, label: "Concluído" },
      cancelled: { variant: "destructive" as const, label: "Cancelado" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const MatchCard = ({ match }: { match: Match }) => (
    <Card className="glass-card hover:scale-[1.02] transition-all duration-300 shadow-warm">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Dish Image */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
            <img
              src={match.dish.image_url}
              alt={match.dish.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop';
              }}
            />
          </div>

          {/* Match Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-foreground text-lg">{match.other_user.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {match.other_user.city}
                </p>
              </div>
              {getStatusBadge(match.status)}
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              Quer partilhar: <span className="font-semibold text-primary">{match.dish.name}</span>
            </p>

            {match.other_user.bio && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2 italic">
                "{match.other_user.bio}"
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(match.created_at).toLocaleDateString('pt-PT')}
              </div>

              {match.status === 'matched' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/match/${match.id}`)}
                    variant="outline"
                    className="h-8 px-3 text-xs rounded-full"
                  >
                    Ver Match
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => startChat(match.id)}
                    className="food-button-primary h-8 px-3 text-xs rounded-full shadow-warm"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Conversar
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
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <div className="pt-safe p-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10 backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white appetite-text">
            🎯 Os Teus Matches
          </h1>
        </div>
        <p className="text-white/80 text-sm">
          Pessoas que também querem partilhar uma refeição contigo
        </p>
      </div>

      <div className="px-6 pb-safe">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="glass-card grid w-full grid-cols-2 mb-6 h-12">
            <TabsTrigger value="active" className="font-medium">Ativos</TabsTrigger>
            <TabsTrigger value="past" className="font-medium">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto animate-spin"></div>
                <p className="text-muted-foreground mt-4">A carregar matches...</p>
              </div>
            ) : activeMatches.length === 0 ? (
              <div className="glass-card p-8 text-center animate-fade-in-up">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Ainda sem matches
                </h3>
                <p className="text-muted-foreground mb-6">
                  Continua a fazer swipe para encontrares alguém para partilhar uma refeição!
                </p>
                <Button onClick={() => navigate("/")} className="food-button-primary">
                  Descobrir Pratos
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
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto animate-spin"></div>
                <p className="text-muted-foreground mt-4">A carregar histórico...</p>
              </div>
            ) : pastMeals.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Ainda sem refeições passadas
                </h3>
                <p className="text-muted-foreground">
                  As tuas refeições concluídas aparecerão aqui
                </p>
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