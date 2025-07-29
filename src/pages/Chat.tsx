import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, MapPin, Check, Clock, Camera, Plus, Star } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sent_at: string;
  type?: string;
}

interface MatchInfo {
  id: string;
  status: string;
  dish: {
    name: string;
    image_url: string;
  };
  other_user: {
    name: string;
    city: string;
  };
}

interface RestaurantSuggestion {
  id: string;
  restaurant_name: string;
  restaurant_address: string;
  cuisine_type?: string;
  rating?: number;
  suggested_by: string;
  status: string;
}

// Portuguese restaurant suggestions for Lisboa
const lisboaRestaurants = [
  { name: "Tasca Real", address: "Rua da Esperança 112, Lisboa", cuisine: "Portuguesa", rating: 4.6 },
  { name: "Pharmacia", address: "Rua Marechal Saldanha 1, Lisboa", cuisine: "Moderna", rating: 4.4 },
  { name: "Taberna do Real Fado", address: "Rua do Salitre 91, Lisboa", cuisine: "Tradicional", rating: 4.5 },
  { name: "Prado", address: "Travessa das Pedras Negras 2, Lisboa", cuisine: "Contemporânea", rating: 4.7 },
  { name: "By the Wine", address: "Rua das Flores 41, Lisboa", cuisine: "Petiscos", rating: 4.3 },
  { name: "Enoteca", address: "Rua das Flores 72, Lisboa", cuisine: "Italiana", rating: 4.5 },
  { name: "Loco", address: "Rua dos Navegadores 53B, Lisboa", cuisine: "Fine Dining", rating: 4.8 },
  { name: "Tabacaria Real", address: "Rua da Escola Politécnica 35, Lisboa", cuisine: "Fusion", rating: 4.4 }
];

// Function to suggest a random restaurant from Lisboa list
const suggestRandomRestaurant = () => {
  return lisboaRestaurants[Math.floor(Math.random() * lisboaRestaurants.length)];
};

const icebreakers = [
  "🌶️ És uma pessoa que gosta de comida picante?",
  "📍 Conheces bons restaurantes para isto?",
  "⏰ Que horário funciona melhor para ti?",
  "🥗 Tens alguma preferência ou restrição alimentar?",
  "😋 Já experimentaste este prato antes?",
  "🍽️ O que mais te chama a atenção neste prato?",
  "🚶‍♀️ Preferes algo perto do centro ou tens algum sítio favorito?",
  "☕ Depois da refeição, que tal um café para conversar?"
];

export const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [restaurantSuggestions, setRestaurantSuggestions] = useState<RestaurantSuggestion[]>([]);
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    address: "",
    cuisine: "",
    time: ""
  });
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (matchId) {
      fetchMatchInfo();
      fetchMessages();
      fetchRestaurantSuggestions();
      getCurrentUser();
      setupRealtime();
    }
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup real-time subscriptions
  const setupRealtime = () => {
    // Listen for new messages
    const messagesChannel = supabase
      .channel(`messages-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    // Listen for typing indicators
    const typingChannel = supabase
      .channel(`typing-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `match_id=eq.${matchId}`
        },
         (payload: any) => {
           if (payload.new && payload.new.user_id !== currentUserId) {
             setOtherUserTyping(payload.new.is_typing);
           }
         }
      )
      .subscribe();

    // Listen for restaurant suggestions
    const restaurantChannel = supabase
      .channel(`restaurants-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_suggestions',
          filter: `match_id=eq.${matchId}`
        },
        () => {
          fetchRestaurantSuggestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(restaurantChannel);
    };
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchMatchInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          status,
          user1_id,
          user2_id,
          dishes!inner(name, image_url)
        `)
        .eq('id', matchId)
        .single();

      if (error) throw error;

      // Fetch the other user's profile separately
      const isUser1 = data.user1_id === user.id;
      const otherUserId = isUser1 ? data.user2_id : data.user1_id;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, city')
        .eq('user_id', otherUserId)
        .single();

      const otherUserProfile = profileData || { name: 'Unknown User', city: '' };

      setMatchInfo({
        id: data.id,
        status: data.status,
        dish: data.dishes,
        other_user: otherUserProfile || { name: 'Unknown User', city: '' }
      });
    } catch (error) {
      console.error('Error fetching match info:', error);
      toast({
        title: "Error",
        description: "Failed to load match information.",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_suggestions')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurantSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching restaurant suggestions:', error);
    }
  };

  // Handle typing indicators
  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true);
      await supabase.rpc('update_typing_indicator', {
        p_match_id: matchId,
        p_is_typing: true
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      await supabase.rpc('update_typing_indicator', {
        p_match_id: matchId,
        p_is_typing: false
      });
    }, 3000);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentUserId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: currentUserId,
          content: content.trim()
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendIcebreaker = (icebreaker: string) => {
    sendMessage(icebreaker);
  };

  const suggestQuickRestaurant = async () => {
    const restaurant = suggestRandomRestaurant();
    try {
      await supabase.from('restaurant_suggestions').insert({
        match_id: matchId,
        suggested_by: currentUserId,
        restaurant_name: restaurant.name,
        restaurant_address: restaurant.address,
        cuisine_type: restaurant.cuisine,
        rating: restaurant.rating
      });
      
      // Also send a message about the suggestion
      await sendMessage(`Que tal o ${restaurant.name}? ${restaurant.cuisine} - ${restaurant.address} ⭐${restaurant.rating}`);
      
      toast({ 
        title: "Restaurante Sugerido! 🍽️", 
        description: `Sugeri o ${restaurant.name}` 
      });
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Não foi possível sugerir o restaurante.", 
        variant: "destructive" 
      });
    }
  };

  const confirmMeetup = async () => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'meetup_confirmed' })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Encontro Confirmado! 🎉",
        description: "Desfrutem da refeição juntos!",
      });

      if (matchInfo) {
        setMatchInfo({ ...matchInfo, status: 'meetup_confirmed' });
      }
    } catch (error) {
      console.error('Error confirming meetup:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o encontro. Tenta novamente.",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading || !matchInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <div className="p-4 pt-safe">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/matches")}
            className="text-white hover:bg-white/10 backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{matchInfo.other_user.name}</h1>
            <p className="text-sm text-white/80 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {matchInfo.other_user.city}
            </p>
          </div>
          {matchInfo.status === 'meetup_confirmed' && (
            <Badge variant="default" className="bg-green-500/90 backdrop-blur-sm border-green-400">
              <Check className="h-3 w-3 mr-1" />
              Confirmado
            </Badge>
          )}
        </div>

        {/* Dish Info */}
        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex gap-3 items-center">
              <img
                src={matchInfo.dish.image_url}
                alt={matchInfo.dish.name}
                className="w-14 h-14 rounded-xl object-cover shadow-md"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop';
                }}
              />
              <div>
                <p className="text-white font-semibold">Vão partilhar: {matchInfo.dish.name}</p>
                <p className="text-white/80 text-sm">Escolham um sítio para se encontrarem! 📍</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 bg-background/95 backdrop-blur-sm">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="glass-card p-6 max-w-sm mx-auto">
              <p className="text-foreground font-medium mb-4">Começa a conversa! 👋</p>
              <div className="grid grid-cols-1 gap-2">
                {icebreakers.slice(0, 4).map((icebreaker, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendIcebreaker(icebreaker)}
                    className="text-left justify-start h-auto py-2 px-3 text-sm hover:scale-105 transition-all duration-200"
                  >
                    {icebreaker}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.sender_id === currentUserId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender_id === currentUserId ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Confirm Meetup Button */}
      {matchInfo.status === 'matched' && messages.length > 0 && (
        <div className="p-4">
          <Button
            onClick={confirmMeetup}
            className="food-button-primary w-full py-3 shadow-warm"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmar Encontro
          </Button>
        </div>
      )}

      {/* Typing Indicator */}
      {otherUserTyping && (
        <div className="px-4 py-2">
          <div className="flex justify-start">
            <div className="bg-muted text-foreground px-4 py-2 rounded-2xl text-sm">
              <span className="animate-pulse">{matchInfo.other_user.name} está a escrever...</span>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Suggestions */}
      {restaurantSuggestions.length > 0 && (
        <div className="p-4 border-t">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Restaurant Suggestions
          </h3>
          <div className="space-y-2">
            {restaurantSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="shadow-card">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{suggestion.restaurant_name}</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.restaurant_address}</p>
                      {suggestion.cuisine_type && (
                        <p className="text-xs text-muted-foreground mt-1">{suggestion.cuisine_type}</p>
                      )}
                      {suggestion.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{suggestion.rating}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant={suggestion.status === 'accepted' ? 'default' : 'outline'}>
                      {suggestion.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Restaurant Form */}
      {showRestaurantForm && (
        <div className="p-4 border-t bg-muted/20">
          <h3 className="font-semibold mb-3">Suggest a Restaurant</h3>
          <div className="space-y-3">
            <Input
              placeholder="Restaurant name"
              value={restaurantForm.name}
              onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
            />
            <Input
              placeholder="Address"
              value={restaurantForm.address}
              onChange={(e) => setRestaurantForm({...restaurantForm, address: e.target.value})}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Cuisine type"
                value={restaurantForm.cuisine}
                onChange={(e) => setRestaurantForm({...restaurantForm, cuisine: e.target.value})}
                className="flex-1"
              />
              <Input
                type="datetime-local"
                value={restaurantForm.time}
                onChange={(e) => setRestaurantForm({...restaurantForm, time: e.target.value})}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRestaurantForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await supabase.from('restaurant_suggestions').insert({
                      match_id: matchId,
                      suggested_by: currentUserId,
                      restaurant_name: restaurantForm.name,
                      restaurant_address: restaurantForm.address,
                      cuisine_type: restaurantForm.cuisine,
                      suggested_time: restaurantForm.time ? new Date(restaurantForm.time).toISOString() : null
                    });
                    setRestaurantForm({ name: "", address: "", cuisine: "", time: "" });
                    setShowRestaurantForm(false);
                    toast({ title: "Restaurant suggested!", description: "Your suggestion has been shared." });
                  } catch (error) {
                    toast({ title: "Error", description: "Failed to suggest restaurant.", variant: "destructive" });
                  }
                }}
                disabled={!restaurantForm.name || !restaurantForm.address}
                className="food-button-primary flex-1"
              >
                Suggest
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 bg-background/95 backdrop-blur-sm">
        {/* Quick Actions */}
        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={suggestQuickRestaurant}
            className="text-xs px-3 py-2 h-8 hover:scale-105 transition-all duration-200"
          >
            🍽️ Sugerir Restaurante
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRestaurantForm(!showRestaurantForm)}
            className="text-xs px-3 py-2 h-8 hover:scale-105 transition-all duration-200"
          >
            📝 Personalizar
          </Button>
        </div>
        
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Escreve uma mensagem..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
              className="w-full rounded-2xl border-muted"
            />
          </div>
          <Button
            onClick={() => sendMessage(newMessage)}
            disabled={!newMessage.trim()}
            size="icon"
            className="food-button-primary rounded-full shadow-warm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};