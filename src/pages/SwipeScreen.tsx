import { useState, useEffect } from "react";
import { SwipeCard } from "@/components/SwipeCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, Utensils } from "lucide-react";

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
        <div className="glass-card p-8 max-w-sm animate-bounce-in">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            À procura de match! 💫
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Estamos a procurar alguém que também quer partilhar uma refeição. Vais ser notificado quando encontrarmos um match!
          </p>
          <button
            onClick={() => {
              setCurrentDishIndex(0);
              setWaitingForMatch(false);
            }}
            className="food-button-primary w-full py-3"
          >
            Ver Mais Pratos
          </button>
        </div>
      </div>
    );
  }

  const currentDish = dishes[currentDishIndex];

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <div className="pt-safe p-6 pb-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-2 appetite-text">
          🍽️ O que vais comer?
        </h1>
        <p className="text-white/80 text-sm">
          Escolhe pratos que gostarias de partilhar hoje
        </p>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6 flex-1 flex items-center justify-center">
        {currentDish ? (
          <SwipeCard
            dish={currentDish}
            onSwipe={handleSwipe}
            progress={`${currentDishIndex + 1} de ${dishes.length}`}
          />
        ) : (
          <div className="glass-card p-8 text-center max-w-sm">
            <Utensils className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Sem mais pratos hoje!
            </h3>
            <p className="text-muted-foreground">
              Volta amanhã para descobrires novos sabores
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
    </div>
  );
};