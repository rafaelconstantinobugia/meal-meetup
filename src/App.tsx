import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <Routes>
            {/* Core MVP Routes */}
            <Route path="/" element={<WelcomeFlow />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/match/:matchId" element={<MatchDetail />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/feedback/:matchId" element={<Feedback />} />
            <Route path="/chat/:matchId" element={<Chat />} />
            
            {/* Auth & Setup */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
