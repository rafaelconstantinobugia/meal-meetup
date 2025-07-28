-- Create enum for meal types
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Create enum for match status
CREATE TYPE public.match_status AS ENUM ('pending', 'matched', 'meetup_confirmed', 'completed', 'cancelled');

-- Create enum for availability
CREATE TYPE public.availability AS ENUM ('lunch', 'dinner', 'both');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT CHECK (LENGTH(bio) <= 120),
  city TEXT NOT NULL,
  food_preferences TEXT[],
  allergies TEXT[],
  availability availability NOT NULL DEFAULT 'both',
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dishes table for daily rotating feed
CREATE TABLE public.dishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  meal_type meal_type NOT NULL,
  mood_tags TEXT[],
  available_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_dish_preferences table for swipe tracking
CREATE TABLE public.user_dish_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  liked BOOLEAN NOT NULL,
  swiped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, dish_id)
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  status match_status NOT NULL DEFAULT 'pending',
  meeting_location TEXT,
  meeting_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id, dish_id)
);

-- Create messages table for in-app chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dish_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for dishes (public read access)
CREATE POLICY "Anyone can view dishes" ON public.dishes FOR SELECT USING (true);

-- RLS Policies for user_dish_preferences
CREATE POLICY "Users can view their own preferences" ON public.user_dish_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.user_dish_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_dish_preferences FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for matches
CREATE POLICY "Users can view their own matches" ON public.matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can update their own matches" ON public.matches FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "System can insert matches" ON public.matches FOR INSERT WITH CHECK (true);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their matches" ON public.messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );
CREATE POLICY "Users can send messages in their matches" ON public.messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample dishes
INSERT INTO public.dishes (name, image_url, description, meal_type, mood_tags) VALUES
('Sushi Platter', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400', 'Fresh sashimi and rolls', 'lunch', ARRAY['Quick lunch', 'Healthy']),
('Margherita Pizza', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', 'Classic tomato and mozzarella', 'dinner', ARRAY['Comfort food', 'Dinner vibe']),
('Vietnamese Pho', 'https://images.unsplash.com/photo-1475090169037-soloveio?w=400', 'Rich broth with noodles', 'lunch', ARRAY['Comfort food', 'Warming']),
('Avocado Toast', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400', 'Smashed avocado on sourdough', 'breakfast', ARRAY['Healthy', 'Quick breakfast']),
('Pasta Carbonara', 'https://images.unsplash.com/photo-1608756687911-56adc897c1b9?w=400', 'Creamy Roman classic', 'dinner', ARRAY['Comfort food', 'Dinner vibe']),
('Fish Tacos', 'https://images.unsplash.com/photo-1565299585323-38174c831b45?w=400', 'Grilled fish with fresh salsa', 'lunch', ARRAY['Quick lunch', 'Fresh']),
('Ramen Bowl', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', 'Rich tonkotsu broth', 'dinner', ARRAY['Comfort food', 'Warming']),
('Acai Bowl', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400', 'Superfood breakfast bowl', 'breakfast', ARRAY['Healthy', 'Energizing']);