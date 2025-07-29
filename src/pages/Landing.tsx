import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, MessageCircle, Utensils } from "lucide-react";

export const Landing = () => {
  const navigate = useNavigate();

  const sampleDishes = [
    {
      name: "Ramen Autêntico",
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
      emoji: "🍜"
    },
    {
      name: "Pizza Artesanal", 
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      emoji: "🍕"
    },
    {
      name: "Sushi Premium",
      image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=300&fit=crop", 
      emoji: "🍣"
    }
  ];

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Logo */}
        <div className="mb-8 animate-bounce-in">
          <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center mb-4 shadow-warm">
            <Utensils className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 appetite-text">
            Foodie
          </h1>
        </div>

        {/* Tagline */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Find your meal buddy
        </h2>
        <p className="text-white/90 text-lg mb-8 max-w-sm leading-relaxed">
          One dish at a time. 🍽️
        </p>

        {/* Sample Dishes Preview */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {sampleDishes.map((dish, index) => (
            <Card key={index} className="glass-card flex-shrink-0 w-32 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-3 text-center">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-20 object-cover rounded-lg mb-2"
                />
                <p className="text-xs font-medium text-foreground">{dish.emoji} {dish.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm">
          <div className="text-center">
            <Heart className="h-8 w-8 text-white mx-auto mb-2" />
            <p className="text-white/80 text-xs">Swipe pratos</p>
          </div>
          <div className="text-center">
            <Users className="h-8 w-8 text-white mx-auto mb-2" />
            <p className="text-white/80 text-xs">Faz match</p>
          </div>
          <div className="text-center">
            <MessageCircle className="h-8 w-8 text-white mx-auto mb-2" />
            <p className="text-white/80 text-xs">Come junto</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 w-full max-w-sm">
          <Button
            onClick={() => navigate("/auth?mode=signup")}
            className="food-button-primary w-full py-4 text-lg font-semibold shadow-warm"
          >
            🍽️ Join Foodie
          </Button>
          
          <Button
            onClick={() => navigate("/auth?mode=login")}
            variant="outline"
            className="w-full py-3 text-white border-white/30 hover:bg-white/10 backdrop-blur-sm"
          >
            Already have an account? Login
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-safe text-center">
        <p className="text-white/60 text-xs">
          Descobre. Combina. Come. Repete. 🔄
        </p>
      </div>
    </div>
  );
};