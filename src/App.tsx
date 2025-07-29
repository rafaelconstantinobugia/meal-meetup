import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';

import { Landing } from "./pages/Landing";
import { SwipeScreen } from "./pages/SwipeScreen";
import { WelcomeFlow } from "./components/WelcomeFlow";
import { ProfileView } from "./components/ProfileView";
import { Auth } from "./pages/Auth";
import { ProfileSetup } from "./pages/ProfileSetup";
import { Matches } from "./pages/Matches";
import { MatchDetail } from "./pages/MatchDetail";
import { Feedback } from "./pages/Feedback";
import { Chat } from "./pages/Chat";
import { BottomNav } from "./components/BottomNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-background to-muted">
            <Routes>
              {/* Landing page for non-authenticated users */}
              <Route 
                path="/" 
                element={user ? <Navigate to="/swipe" replace /> : <Landing />} 
              />
              
              {/* Auth routes (only for non-authenticated) */}
              <Route 
                path="/auth" 
                element={user ? <Navigate to="/swipe" replace /> : <Auth />} 
              />
              <Route 
                path="/login" 
                element={user ? <Navigate to="/swipe" replace /> : <Auth />} 
              />
              <Route 
                path="/register" 
                element={user ? <Navigate to="/swipe" replace /> : <Auth />} 
              />
              
              {/* Protected routes (only for authenticated users) */}
              <Route 
                path="/profile-setup" 
                element={user ? <ProfileSetup /> : <Navigate to="/auth" replace />} 
              />
              <Route 
                path="/swipe" 
                element={user ? <SwipeScreen /> : <Navigate to="/auth" replace />} 
              />
              <Route 
                path="/matches" 
                element={user ? <Matches /> : <Navigate to="/auth" replace />} 
              />
              <Route 
                path="/match/:matchId" 
                element={user ? <MatchDetail /> : <Navigate to="/auth" replace />} 
              />
              <Route 
                path="/chat/:matchId" 
                element={user ? <Chat /> : <Navigate to="/auth" replace />} 
              />
              <Route 
                path="/feedback/:matchId" 
                element={user ? <Feedback /> : <Navigate to="/auth" replace />} 
              />
              <Route 
                path="/profile" 
                element={user ? <ProfileView /> : <Navigate to="/auth" replace />} 
              />
              
              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            {/* Bottom nav only shows for authenticated users */}
            {user && <BottomNav />}
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
