import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedSwipeScreen } from "@/components/EnhancedSwipeScreen";
import { User, Heart, Users } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setHasProfile(!!data);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (user && hasProfile) {
    return <EnhancedSwipeScreen />;
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="pt-safe-top p-6 flex flex-col justify-center min-h-screen">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Foodie</h1>
          <p className="text-xl text-white/80 mb-2">Connect over meals</p>
          <p className="text-white/60">Find someone to share a meal with - no romantic expectations</p>
        </div>

        <div className="space-y-4 max-w-sm mx-auto w-full">
          {!user ? (
            <>
              <Button onClick={() => navigate("/auth")} className="food-button-primary w-full py-4 text-lg">
                Get Started
              </Button>
              <div className="flex items-center gap-4 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Meet locals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span>Share meals</span>
                </div>
              </div>
            </>
          ) : (
            <Button onClick={() => navigate("/profile-setup")} className="food-button-primary w-full py-4 text-lg">
              Complete Your Profile
            </Button>
          )}
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/matches")} className="text-white/60">
            <Users className="h-4 w-4 mr-2" />
            Matches
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/profile-setup")} className="text-white/60">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
