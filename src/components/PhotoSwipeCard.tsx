import { useState } from "react";
import { Heart, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface FoodPhoto {
  id: string;
  image_url: string;
  caption?: string;
  tags?: string[];
  user_city?: string;
}

interface PhotoSwipeCardProps {
  photo: FoodPhoto;
  onSwipe: (liked: boolean) => void;
  progress?: string;
  disabled?: boolean;
}

export const PhotoSwipeCard = ({ photo, onSwipe, progress, disabled = false }: PhotoSwipeCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSwipe = (liked: boolean) => {
    if (disabled) return;
    onSwipe(liked);
  };

  return (
    <Card className="w-full max-w-sm mx-auto glass-card overflow-hidden shadow-warm">
      <CardContent className="p-0">
        {/* Photo */}
        <div className="relative h-96 bg-muted flex items-center justify-center">
          {!imageError ? (
            <img
              src={photo.image_url}
              alt={photo.caption || "Food photo"}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <span className="text-sm">Image unavailable</span>
            </div>
          )}

          {/* Progress indicator */}
          {progress && (
            <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
              {progress}
            </div>
          )}

          {/* Location badge */}
          {photo.user_city && (
            <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {photo.user_city}
            </div>
          )}
        </div>

        {/* Photo Details */}
        <div className="p-4 space-y-3">
          {/* Caption */}
          {photo.caption && (
            <p className="text-foreground font-medium">{photo.caption}</p>
          )}

          {/* Tags */}
          {photo.tags && photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {photo.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleSwipe(false)}
              disabled={disabled}
            >
              <X className="h-5 w-5 mr-2" />
              Pass
            </Button>
            
            <Button
              size="lg"
              className="flex-1 food-button-primary"
              onClick={() => handleSwipe(true)}
              disabled={disabled}
            >
              <Heart className="h-5 w-5 mr-2" />
              {disabled ? 'Matching...' : "I'd Eat This!"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};