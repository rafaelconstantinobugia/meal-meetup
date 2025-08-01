import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PhotoSwipeCard } from "@/components/PhotoSwipeCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, Camera, Users } from "lucide-react";
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

interface PhotoMatch {
  match_id: string;
  other_user: {
    name: string;
    city: string;
    profile_picture_url?: string;
  };
  mutual_likes_count: number;
}

export const PhotoSwipeScreen = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<FoodPhoto[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [waitingForMore, setWaitingForMore] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [recentMatch, setRecentMatch] = useState<PhotoMatch | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get photos that haven't been swiped on by this user
      const { data: swipedPhotos, error: swipeError } = await supabase
        .from('photo_swipes')
        .select('photo_id')
        .eq('swiper_user_id', user.id);

      if (swipeError) throw swipeError;

      const swipedPhotoIds = swipedPhotos?.map(s => s.photo_id) || [];

      // Fetch photos excluding already swiped ones and user's own photos
      let query = supabase
        .from('food_photos')
        .select(`
          id,
          image_url,
          caption,
          tags,
          user_id,
          profiles!inner(city)
        `)
        .eq('is_active', true)
        .neq('user_id', user.id);

      if (swipedPhotoIds.length > 0) {
        query = query.not('id', 'in', `(${swipedPhotoIds.map(id => `"${id}"`).join(',')})`);
      }

      const { data, error } = await query.limit(20);
      
      if (error) throw error;

      // Transform data to include city
      const transformedPhotos = data?.map(photo => ({
        id: photo.id,
        image_url: photo.image_url,
        caption: photo.caption,
        tags: photo.tags,
        user_city: (photo as any).profiles?.city
      })) || [];

      setPhotos(transformedPhotos);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: "Error",
        description: "Failed to load photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    const currentPhoto = photos[currentPhotoIndex];
    if (!currentPhoto) return;

    setSwiping(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Call the edge function for proper matching logic
      const response = await supabase.functions.invoke('process-photo-swipe', {
        body: {
          photo_id: currentPhoto.id,
          choice: liked
        }
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;

      if (result.matched && result.match_data) {
        setRecentMatch(result.match_data);
        setShowMatchModal(true);
        toast({
          title: "🎉 It's a Food Match!",
          description: `You both love each other's food! ${result.match_data.mutual_likes_count} mutual likes!`,
        });
      } else if (liked) {
        toast({
          title: "Nice choice!",
          description: "Looking for mutual food lovers...",
        });
      }

      // Move to next photo
      if (currentPhotoIndex < photos.length - 1) {
        setCurrentPhotoIndex(currentPhotoIndex + 1);
      } else {
        setWaitingForMore(true);
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

  if (waitingForMore) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-card p-8 max-w-sm animate-bounce-in">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            No more photos for now! 📸
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            You've seen all available food photos. Check back later for more delicious content!
          </p>
          <button
            onClick={() => {
              setCurrentPhotoIndex(0);
              setWaitingForMore(false);
              fetchPhotos(); // Refresh photos when going back
            }}
            className="food-button-primary w-full py-3"
          >
            Refresh Photos
          </button>
        </div>
      </div>
    );
  }

  const MatchModal = () => {
    if (!showMatchModal || !recentMatch) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-sm glass-card">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">It's a Food Match! 🎉</h2>
            <p className="text-muted-foreground mb-4">
              You both love each other's food photos! <strong>{recentMatch.mutual_likes_count} mutual likes</strong>
            </p>

            <div className="flex items-center gap-3 p-3 glass-card rounded-lg mb-4">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">{recentMatch.other_user.name}</p>
                <p className="text-sm text-muted-foreground">{recentMatch.other_user.city}</p>
              </div>
              <Badge variant="secondary">
                New Match!
              </Badge>
            </div>

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

  const currentPhoto = photos[currentPhotoIndex];

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <div className="pt-safe p-6 pb-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-2 appetite-text">
          📸 Food Photo Swipe
        </h1>
        <p className="text-white/80 text-sm">
          Swipe on food photos from fellow food lovers
        </p>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6 flex-1 flex items-center justify-center">
        {currentPhoto ? (
          <PhotoSwipeCard
            photo={currentPhoto}
            onSwipe={handleSwipe}
            progress={`${currentPhotoIndex + 1} of ${photos.length}`}
            disabled={swiping}
          />
        ) : (
          <div className="glass-card p-8 text-center max-w-sm">
            <Camera className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              No photos available
            </h3>
            <p className="text-muted-foreground">
              Be the first to upload some food photos!
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {photos.length > 0 && (
        <div className="px-6 pb-safe">
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="gradient-primary h-3 rounded-full transition-all duration-500 shadow-warm"
              style={{ width: `${((currentPhotoIndex + 1) / photos.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <MatchModal />
    </div>
  );
};