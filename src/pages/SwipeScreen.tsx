import { useState, useEffect } from "react";
import { DishCard } from "@/components/DishCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart } from "lucide-react";

interface Dish {
  id: string;
  name: string;
  image_url: string;
  description: string;
  meal_type: string;
  mood_tags: string[];
}

export const SwipeScreen = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentDishIndex, setCurrentDishIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [waitingForMatch, setWaitingForMatch] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('available_date', new Date().toISOString().split('T')[0]);
      
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

    try {
      // Save user preference
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_dish_preferences')
          .upsert({
            user_id: user.id,
            dish_id: currentDish.id,
            liked
          });
      }

      // Move to next dish
      if (currentDishIndex < dishes.length - 1) {
        setCurrentDishIndex(currentDishIndex + 1);
      } else {
        setWaitingForMatch(true);
      }

      if (liked) {
        toast({
          title: "Great choice!",
          description: `You liked ${currentDish.name}. Looking for matches...`,
        });
      }
    } catch (error) {
      console.error('Error saving preference:', error);
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
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-sm">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Waiting for a match!</h2>
          <p className="text-white/80 mb-6">
            We're looking for someone who also wants to share a meal. You'll be notified when we find a match!
          </p>
          <button
            onClick={() => {
              setCurrentDishIndex(0);
              setWaitingForMatch(false);
            }}
            className="food-button-secondary w-full py-3"
          >
            Swipe More Dishes
          </button>
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
          <div className="text-white/80 text-sm font-medium">
            {currentDishIndex + 1} of {dishes.length}
          </div>
        </div>
      </div>

      {/* Dish Card */}
      <div className="px-6 pb-6">
        {currentDish ? (
          <DishCard
            dish={currentDish}
            onSwipe={handleSwipe}
          />
        ) : (
          <div className="text-center text-white py-12">
            <p>No more dishes for today!</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-6 pb-6">
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentDishIndex + 1) / dishes.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};