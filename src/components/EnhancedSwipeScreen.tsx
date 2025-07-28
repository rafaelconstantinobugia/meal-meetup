import { useState, useEffect, useRef } from "react";
import { DishCard } from "@/components/DishCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, RotateCcw, Zap, Users } from "lucide-react";
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
  compatibility_score: number;
}

export const EnhancedSwipeScreen = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentDishIndex, setCurrentDishIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [swipeHistory, setSwipeHistory] = useState<{dishId: string, action: string}[]>([]);
  const [recentMatches, setRecentMatches] = useState<SwipeMatch[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [waitingForMatch, setWaitingForMatch] = useState(false);
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDishes();
    setupRealtimeMatches();
  }, []);

  const fetchDishes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get dishes that user hasn't swiped on yet
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

      // Only add the not.in filter if there are actually swiped dishes
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

  const setupRealtimeMatches = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Listen for new matches
    const channel = supabase
      .channel('matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${user.id},user2_id=eq.${user.id}`
        },
        (payload) => {
          toast({
            title: "🎉 New Match!",
            description: "You've got a new meal buddy!",
          });
          // Fetch the new match details
          fetchMatchDetails(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchMatchDetails = async (matchId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          dishes!inner(name, image_url)
        `)
        .eq('id', matchId)
        .single();

      if (data) {
        const isUser1 = data.user1_id === user.id;
        const otherUserId = isUser1 ? data.user2_id : data.user1_id;
        
        const { data: otherUserProfile } = await supabase
          .from('profiles')
          .select('name, city, profile_picture_url')
          .eq('user_id', otherUserId)
          .single();

        if (otherUserProfile) {
          setRecentMatches(prev => [...prev, {
            match_id: matchId,
            other_user: otherUserProfile,
            compatibility_score: 85 // Default score, could be fetched
          }]);
          setShowMatchModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    }
  };

  const handleSwipe = async (liked: boolean, dishId?: string) => {
    const currentDish = dishes[currentDishIndex];
    if (!currentDish) return;

    const targetDishId = dishId || currentDish.id;
    setSwiping(true);

    try {
      // Call the smart matching Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('https://hbchqxckyepyosxwxhui.supabase.co/functions/v1/process-swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          dish_id: targetDishId,
          action: liked ? 'like' : 'pass'
        })
      });

      const result = await response.json();

      // Update swipe history
      setSwipeHistory(prev => [...prev, { dishId: targetDishId, action: liked ? 'like' : 'pass' }]);

      // Handle matches
      if (result.matched && result.matches?.length > 0) {
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

  const handleUndo = async () => {
    if (swipeHistory.length === 0 || currentDishIndex === 0) return;

    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    
    try {
      // Remove the last preference
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_dish_preferences')
          .delete()
          .eq('user_id', user.id)
          .eq('dish_id', lastSwipe.dishId);

        // Remove from match queue if it was a like
        if (lastSwipe.action === 'like') {
          await supabase
            .from('match_queue')
            .delete()
            .eq('user_id', user.id)
            .eq('dish_id', lastSwipe.dishId);
        }
      }

      // Go back to previous dish
      setCurrentDishIndex(currentDishIndex - 1);
      setSwipeHistory(prev => prev.slice(0, -1));
      
      toast({
        title: "Undone",
        description: "Your last swipe has been undone.",
      });

    } catch (error) {
      console.error('Error undoing swipe:', error);
      toast({
        title: "Error",
        description: "Failed to undo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const MatchModal = () => {
    if (!showMatchModal || recentMatches.length === 0) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-sm shadow-warm">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">It's a Match! 🎉</h2>
            <p className="text-muted-foreground mb-4">
              You both want to share the same meal
            </p>

            {recentMatches.map((match) => (
              <div key={match.match_id} className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-secondary flex items-center justify-center overflow-hidden">
                  {match.other_user.profile_picture_url ? (
                    <img 
                      src={match.other_user.profile_picture_url} 
                      alt={match.other_user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="h-6 w-6 text-white" />
                  )}
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
                  // Navigate to matches page
                  window.location.href = '/matches';
                }}
                className="food-button-primary flex-1"
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
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (waitingForMatch) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-sm">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
          <p className="text-white/80 mb-6">
            You've swiped through all today's dishes. Check back later for more!
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setCurrentDishIndex(0);
                setWaitingForMatch(false);
                fetchDishes();
              }}
              className="food-button-secondary flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => window.location.href = '/matches'}
              className="food-button-primary flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              View Matches
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentDish = dishes[currentDishIndex];

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <div className="pt-safe-top p-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Find Your Meal Buddy
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {currentDishIndex + 1} of {dishes.length}
            </Badge>
            {swipeHistory.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                className="text-white hover:bg-white/10"
                disabled={swiping}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dish Card */}
      <div className="px-6 pb-6" ref={cardRef}>
        {currentDish ? (
          <div className="swipe-animation">
            <DishCard
              dish={currentDish}
              onSwipe={(liked) => handleSwipe(liked)}
            />
          </div>
        ) : (
          <div className="text-center text-white py-12">
            <p>No more dishes for today!</p>
          </div>
        )}
      </div>

      {/* Enhanced Action Buttons */}
      <div className="px-6 pb-6">
        <div className="flex gap-3">
          <Button
            onClick={() => handleSwipe(false)}
            disabled={swiping || !currentDish}
            className="flex-1 py-4 rounded-2xl border-2 border-muted text-muted-foreground font-semibold transition-all duration-200 hover:border-destructive hover:text-destructive active:scale-95 bg-transparent"
          >
            Skip
          </Button>
          <Button
            onClick={() => handleSwipe(true)}
            disabled={swiping || !currentDish}
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
      <div className="px-6 pb-6">
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentDishIndex + 1) / Math.max(dishes.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Match Modal */}
      <MatchModal />
    </div>
  );
};