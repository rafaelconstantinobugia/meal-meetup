import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedSwipeScreen } from "@/components/EnhancedSwipeScreen";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Utensils, ArrowRight } from "lucide-react";

export const WelcomeFlow = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // Check if user has completed profile setup
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!profileData || !profileData.name || !profileData.city) {
        navigate('/profile-setup');
        return;
      }

      setProfile(profileData);
      
      // Show welcome screen for first-time users
      const hasSeenWelcome = localStorage.getItem('meal-meetup-welcome-seen');
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completeWelcome = () => {
    localStorage.setItem('meal-meetup-welcome-seen', 'true');
    setShowWelcome(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showWelcome && user && profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/10 flex items-center justify-center p-6">
        <Card className="w-full max-w-md dish-card animate-bounce-in">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <Utensils className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold appetite-text mb-4">
              Welcome to Meal Meetup!
            </h1>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Hey {profile.name}! Ready to turn lonely meals into shared moments? 
              Let's find your perfect dining companion.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Swipe on dishes you'd love to share</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Match with people who picked the same dish</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <Utensils className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Chat, meet up, and enjoy a meal together</span>
              </div>
            </div>

            <Button 
              onClick={completeWelcome}
              className="food-button-primary w-full py-4 text-lg"
              size="lg"
            >
              Let's Start Swiping
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If authenticated and profile complete, show main swipe screen
  if (user && profile) {
    return <EnhancedSwipeScreen />;
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};