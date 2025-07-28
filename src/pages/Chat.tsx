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

const icebreakers = [
  "Been there before?",
  "Are you a spicy person?",
  "What's your favorite thing about this dish?",
  "Any dietary preferences I should know about?",
  "What time works best for you?",
  "Do you know any good spots for this?"
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

  const confirmMeetup = async () => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'meetup_confirmed' })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Meetup Confirmed!",
        description: "Have a great meal together!",
      });

      if (matchInfo) {
        setMatchInfo({ ...matchInfo, status: 'meetup_confirmed' });
      }
    } catch (error) {
      console.error('Error confirming meetup:', error);
      toast({
        title: "Error",
        description: "Failed to confirm meetup. Please try again.",
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-bg p-4 pt-safe-top">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/matches")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">{matchInfo.other_user.name}</h1>
            <p className="text-sm text-white/80 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {matchInfo.other_user.city}
            </p>
          </div>
          {matchInfo.status === 'meetup_confirmed' && (
            <Badge variant="default" className="bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Confirmed
            </Badge>
          )}
        </div>

        {/* Dish Info */}
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-3">
            <div className="flex gap-3 items-center">
              <img
                src={matchInfo.dish.image_url}
                alt={matchInfo.dish.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <p className="text-white font-medium">Sharing: {matchInfo.dish.name}</p>
                <p className="text-white/80 text-sm">Find a place to meet!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Start the conversation!</p>
            <div className="space-y-2">
              {icebreakers.map((icebreaker, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => sendIcebreaker(icebreaker)}
                  className="block mx-auto"
                >
                  {icebreaker}
                </Button>
              ))}
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
        <div className="p-4 border-t">
          <Button
            onClick={confirmMeetup}
            className="food-button-secondary w-full py-3"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm Meetup
          </Button>
        </div>
      )}

      {/* Typing Indicator */}
      {otherUserTyping && (
        <div className="px-4 py-2">
          <div className="flex justify-start">
            <div className="bg-muted text-foreground px-4 py-2 rounded-2xl text-sm">
              <span className="animate-pulse">{matchInfo.other_user.name} is typing...</span>
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
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2 items-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowRestaurantForm(!showRestaurantForm)}
            className="mb-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
              className="w-full"
            />
          </div>
          <Button
            onClick={() => sendMessage(newMessage)}
            disabled={!newMessage.trim()}
            size="icon"
            className="food-button-primary mb-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};