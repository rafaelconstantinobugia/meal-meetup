import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DishCard } from "@/components/DishCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { ImpactStyle } from "@capacitor/haptics";
import { Loader2, Heart, RotateCcw, Users } from "lucide-react";
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
  };
  compatibility_score: number;
}

export const EnhancedSwipeScreen = () => {
  const navigate = useNavigate();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [recentMatches, setRecentMatches] = useState<SwipeMatch[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const { toast } = useToast();
  const { impact, notification } = useHaptics();

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: swipedDishes } = await supabase
        .from('user_dish_preferences')
        .select('dish_id')
        .eq('user_id', user.id);

      const swipedDishIds = swipedDishes?.map(s => s.dish_id) || [];

      let query = supabase
        .from('dishes')
        .select('*')
        .eq('available_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (swipedDishIds.length > 0) {
        query = query.not('id', 'in', `(${swipedDishIds.map(id => `'${id}'`).join(',')})`);
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
    const currentDish = dishes[currentIndex];
    if (!currentDish) return;

    // Haptic feedback
    if (liked) {
      await impact(ImpactStyle.Medium);
    } else {
      await impact(ImpactStyle.Light);
    }

    setSwiping(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('https://hbchqxckyepyosxwxhui.supabase.co/functions/v1/process-swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          dish_id: currentDish.id,
          action: liked ? 'like' : 'pass'
        })
      });

      const result = await response.json();

      if (result.matched && result.matches?.length > 0) {
        await notification();
        setRecentMatches(result.matches);
        setShowMatchModal(true);
        toast({
          title: "🎉 It's a Match!",
          description: `You matched with ${result.matches.length} people!`,
        });
      } else if (liked) {
        toast({
          title: "Great choice! 🍽️",
          description: "Looking for someone who also wants to share this meal...",
        });
      }

      // Move to next dish
      if (currentIndex < dishes.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        toast({
          title: "All caught up!",
          description: "Check back later for more dishes.",
        });
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

  const MatchModal = () => {
    if (!showMatchModal || recentMatches.length === 0) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-sm glass-card">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">It's a Match! 🎉</h2>
            <p className="text-muted-foreground mb-4">
              You both want to share the same meal
            </p>

            {recentMatches.map((match) => (
              <div key={match.match_id} className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{match.other_user.name}</p>
                  <p className="text-sm text-muted-foreground">{match.other_user.city}</p>
                </div>
                <Badge variant="secondary">
                  {match.compatibility_score}% match
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
                className="modern-button flex-1"
              >
                Start Chatting
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentDish = dishes[currentIndex];

  if (!currentDish) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-background to-muted">
        <div className="glass-card p-8 rounded-3xl max-w-sm">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
          <p className="text-muted-foreground mb-6">
            You've swiped through all today's dishes. Check back later for more!
          </p>
          <Button
            onClick={() => {
              setCurrentIndex(0);
              fetchDishes();
            }}
            className="modern-button flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="pt-safe p-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold appetite-text">Find Your Meal Buddy</h1>
          <Badge variant="secondary" className="text-xs font-medium">
            {currentIndex + 1} of {dishes.length}
          </Badge>
        </div>
      </div>

      {/* Dish Card */}
      <div className="px-6 pb-6">
        <DishCard
          dish={currentDish}
          onSwipe={handleSwipe}
        />
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="flex gap-3">
          <Button
            onClick={() => handleSwipe(false)}
            disabled={swiping}
            className="food-button-secondary flex-1 py-4"
          >
            Skip
          </Button>
          <Button
            onClick={() => handleSwipe(true)}
            disabled={swiping}
            className="food-button-primary flex-1 py-4"
          >
            {swiping ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Heart className="h-4 w-4 mr-2" />
            )}
            {swiping ? 'Matching...' : "Yes, I'd eat this!"}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pb-24">
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / Math.max(dishes.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      <MatchModal />
    </div>
  );
};