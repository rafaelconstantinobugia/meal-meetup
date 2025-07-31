import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SwipeCard } from "@/components/SwipeCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, Utensils, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Dish {
  id: string;
  name: string;
  image_url: string;
  description: string;
  meal_type: string;
  mood_tags: string[];
}

interface SwipeMatch {
  match_id: string;
  other_user: {
    name: string;
    city: string;
    profile_picture_url?: string;
  };
}

export const SwipeScreen = () => {
  const navigate = useNavigate();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentDishIndex, setCurrentDishIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [waitingForMatch, setWaitingForMatch] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [recentMatches, setRecentMatches] = useState<SwipeMatch[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentMatchDish, setCurrentMatchDish] = useState<Dish | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get dishes that haven't been swiped on by this user today
      const { data: swipedDishes, error: swipeError } = await supabase
        .from('user_dish_preferences')
        .select('dish_id')
        .eq('user_id', user.id);

      if (swipeError) throw swipeError;

      const swipedDishIds = swipedDishes?.map(s => s.dish_id) || [];

      // Fetch dishes excluding already swiped ones
      let query = supabase
        .from('dishes')
        .select('*')
        .eq('available_date', new Date().toISOString().split('T')[0]);

      if (swipedDishIds.length > 0) {
        query = query.not('id', 'in', `(${swipedDishIds.map(id => `"${id}"`).join(',')})`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setDishes(data || []);
    } catch (error) {
      console.error('Error fetching dishes:', error);
      toast({
        title: "Error",
        description: "Failed to load dishes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    const currentDish = dishes[currentDishIndex];
    if (!currentDish) return;

    setSwiping(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Call the edge function for proper matching logic
      const response = await supabase.functions.invoke('process-swipe', {
        body: {
          dish_id: currentDish.id,
          action: liked ? 'like' : 'pass'
        }
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;

      if (result.matched && result.matches?.length > 0) {
        setRecentMatches(result.matches);
        setCurrentMatchDish(currentDish);
        setShowMatchModal(true);
        toast({
          title: "🎉 It's a Match!",
          description: `You both want to share ${currentDish.name}!`,
        });
      } else if (liked) {
        toast({
          title: "Great choice!",
          description: `You liked ${currentDish.name}. Looking for matches...`,
        });
      }

      // Move to next dish
      if (currentDishIndex < dishes.length - 1) {
        setCurrentDishIndex(currentDishIndex + 1);
      } else {
        setWaitingForMatch(true);
      }

    } catch (error) {
      console.error('Error processing swipe:', error);
      toast({
        title: "Error",
        description: "Failed to process swipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSwiping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (waitingForMatch) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-card p-8 max-w-sm animate-bounce-in">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Looking for matches! 💫
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            We're finding someone who also wants to share a meal. You'll be notified when we find a match!
          </p>
          <button
            onClick={() => {
              setCurrentDishIndex(0);
              setWaitingForMatch(false);
              fetchDishes(); // Refresh dishes when going back
            }}
            className="food-button-primary w-full py-3"
          >
            See More Dishes
          </button>
        </div>
      </div>
    );
  }

  const MatchModal = () => {
    if (!showMatchModal || recentMatches.length === 0 || !currentMatchDish) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-sm glass-card">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">It's a Match! 🎉</h2>
            <p className="text-muted-foreground mb-4">
              You both want to share <strong>{currentMatchDish.name}</strong>
            </p>

            {recentMatches.map((match) => (
              <div key={match.match_id} className="flex items-center gap-3 p-3 glass-card rounded-lg mb-3">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">{match.other_user.name}</p>
                  <p className="text-sm text-muted-foreground">{match.other_user.city}</p>
                </div>
                <Badge variant="secondary">
                  New Match!
                </Badge>
              </div>
            ))}

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowMatchModal(false)}
                className="flex-1"
              >
                Keep Swiping
              </Button>
              <Button
                onClick={() => {
                  setShowMatchModal(false);
                  navigate('/matches');
                }}
                className="food-button-primary flex-1"
              >
                Start Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const currentDish = dishes[currentDishIndex];

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <div className="pt-safe p-6 pb-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-2 appetite-text">
          🍽️ What are you eating?
        </h1>
        <p className="text-white/80 text-sm">
          Choose dishes you'd like to share today
        </p>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6 flex-1 flex items-center justify-center">
        {currentDish ? (
          <SwipeCard
            dish={currentDish}
            onSwipe={handleSwipe}
            progress={`${currentDishIndex + 1} of ${dishes.length}`}
            disabled={swiping}
          />
        ) : (
          <div className="glass-card p-8 text-center max-w-sm">
            <Utensils className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              No more dishes today!
            </h3>
            <p className="text-muted-foreground">
              Come back tomorrow to discover new flavors
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-6 pb-safe">
        <div className="w-full bg-white/20 rounded-full h-3">
          <div
            className="gradient-primary h-3 rounded-full transition-all duration-500 shadow-warm"
            style={{ width: `${((currentDishIndex + 1) / dishes.length) * 100}%` }}
          />
        </div>
      </div>

      <MatchModal />
    </div>
  );
};