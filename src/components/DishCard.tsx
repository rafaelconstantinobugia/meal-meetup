import { Badge } from "@/components/ui/badge";

interface DishCardProps {
  dish: {
    id: string;
    name: string;
    image_url: string;
    description: string;
    meal_type: string;
    mood_tags: string[];
  };
  onSwipe: (liked: boolean) => void;
}

export const DishCard = ({ dish, onSwipe }: DishCardProps) => {
  return (
    <div className="dish-card w-full max-w-sm mx-auto h-[500px] flex flex-col">
      {/* Dish Image */}
      <div className="relative h-2/3 overflow-hidden rounded-t-3xl">
        <img
          src={dish.image_url}
          alt={dish.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="text-xs font-medium capitalize">
            {dish.meal_type}
          </Badge>
        </div>
      </div>

      {/* Dish Info */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">{dish.name}</h3>
          <p className="text-sm text-muted-foreground mb-3">{dish.description}</p>
          
          {/* Mood Tags */}
          <div className="flex flex-wrap gap-2">
            {dish.mood_tags.map((tag, index) => (
              <span key={index} className="mood-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onSwipe(false)}
            className="flex-1 py-3 px-6 rounded-2xl border-2 border-muted text-muted-foreground font-semibold transition-all duration-200 hover:border-destructive hover:text-destructive active:scale-95"
          >
            Skip
          </button>
          <button
            onClick={() => onSwipe(true)}
            className="food-button-primary flex-1 py-3 px-6"
          >
            Yes, I'd eat this!
          </button>
        </div>
      </div>
    </div>
  );
};