import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Heart, Utensils, Clock } from "lucide-react";

interface Dish {
  id: string;
  name: string;
  image_url: string;
  description: string;
  meal_type: string;
  mood_tags: string[];
}

interface SwipeCardProps {
  dish: Dish;
  onSwipe: (liked: boolean) => void;
  progress: string;
}

export const SwipeCard = ({ dish, onSwipe, progress }: SwipeCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const getMealIcon = (mealType: string) => {
    return mealType.toLowerCase() === 'lunch' ? <Utensils className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  const getMealEmoji = (mealType: string) => {
    return mealType.toLowerCase() === 'lunch' ? '🍽️' : '🌙';
  };

  return (
    <div className="max-w-sm mx-auto">
      {/* Progress indicator */}
      <div className="mb-4 text-center">
        <span className="text-white/80 text-sm font-medium">{progress}</span>
      </div>

      {/* Main card */}
      <div className="glass-card rounded-3xl overflow-hidden animate-fade-in-up">
        {/* Image container */}
        <div className="relative h-80 bg-muted">
          <img
            src={dish.image_url}
            alt={dish.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.log('Image failed to load:', dish.image_url);
              e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop';
            }}
          />
          
          {/* Meal type badge */}
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="glass text-white border-white/20 bg-white/20">
              <span className="mr-1">{getMealEmoji(dish.meal_type)}</span>
              {dish.meal_type}
            </Badge>
          </div>

          {/* Loading overlay */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="animate-pulse">
                <Utensils className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Dish name */}
          <h2 className="text-2xl font-bold text-foreground">
            {dish.name}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">
            {dish.description}
          </p>

          {/* Tags */}
          {dish.mood_tags && dish.mood_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dish.mood_tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-primary border-primary/20 bg-primary/5"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onSwipe(false)}
              className="flex-1 rounded-2xl border-2 border-muted bg-white/50 hover:bg-white hover:scale-105 transition-all duration-200"
            >
              <X className="h-5 w-5 mr-2" />
              Skip
            </Button>
            
            <Button
              size="lg"
              onClick={() => onSwipe(true)}
              className="flex-1 rounded-2xl gradient-primary text-white hover:scale-105 transition-all duration-200 shadow-warm"
            >
              <Heart className="h-5 w-5 mr-2" />
              Eat!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};