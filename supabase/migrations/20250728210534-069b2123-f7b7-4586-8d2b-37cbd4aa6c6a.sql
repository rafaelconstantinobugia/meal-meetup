-- Create matching preferences table for enhanced algorithm
CREATE TABLE public.matching_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  max_distance_km INTEGER DEFAULT 25,
  preferred_meal_times TIME[] DEFAULT ARRAY['12:00:00', '19:00:00']::TIME[],
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 65,
  same_gender_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track user swipe history for better matching
CREATE TABLE public.swipe_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'super_like')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id, dish_id)
);

-- Create match queue for priority matching
CREATE TABLE public.match_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  priority_score INTEGER DEFAULT 50,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, dish_id)
);

-- Enable RLS on new tables
ALTER TABLE public.matching_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for matching_preferences
CREATE POLICY "Users can view their own matching preferences" 
ON public.matching_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own matching preferences" 
ON public.matching_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own matching preferences" 
ON public.matching_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for swipe_history
CREATE POLICY "Users can view their own swipe history" 
ON public.swipe_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own swipes" 
ON public.swipe_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for match_queue
CREATE POLICY "Users can view their own match queue" 
ON public.match_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage match queue" 
ON public.match_queue FOR ALL USING (true);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_matching_preferences_updated_at
  BEFORE UPDATE ON public.matching_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate match compatibility score
CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(
  user1_id UUID,
  user2_id UUID,
  dish_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score INTEGER := 50;
  user1_profile public.profiles%ROWTYPE;
  user2_profile public.profiles%ROWTYPE;
  user1_prefs public.matching_preferences%ROWTYPE;
  user2_prefs public.matching_preferences%ROWTYPE;
  common_preferences INTEGER;
BEGIN
  -- Get user profiles
  SELECT * INTO user1_profile FROM public.profiles WHERE user_id = user1_id;
  SELECT * INTO user2_profile FROM public.profiles WHERE user_id = user2_id;
  
  -- Get matching preferences
  SELECT * INTO user1_prefs FROM public.matching_preferences WHERE user_id = user1_id;
  SELECT * INTO user2_prefs FROM public.matching_preferences WHERE user_id = user2_id;
  
  -- Same city bonus
  IF user1_profile.city = user2_profile.city THEN
    score := score + 20;
  END IF;
  
  -- Availability compatibility
  IF user1_profile.availability = user2_profile.availability OR 
     user1_profile.availability = 'both' OR 
     user2_profile.availability = 'both' THEN
    score := score + 15;
  END IF;
  
  -- Common food preferences
  SELECT array_length(
    ARRAY(SELECT unnest(user1_profile.food_preferences) 
          INTERSECT 
          SELECT unnest(user2_profile.food_preferences))
  , 1) INTO common_preferences;
  
  IF common_preferences > 0 THEN
    score := score + (common_preferences * 5);
  END IF;
  
  -- Allergies compatibility (penalty if one has allergies other doesn't consider)
  IF array_length(user1_profile.allergies, 1) > 0 OR array_length(user2_profile.allergies, 1) > 0 THEN
    -- This is a simplified check - in production you'd want more sophisticated allergy matching
    score := score - 5;
  END IF;
  
  RETURN GREATEST(0, LEAST(100, score));
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_match_queue_expires_at ON public.match_queue(expires_at);
CREATE INDEX idx_match_queue_priority ON public.match_queue(priority_score DESC);
CREATE INDEX idx_swipe_history_user_dish ON public.swipe_history(user_id, dish_id);
CREATE INDEX idx_profiles_city ON public.profiles(city);
CREATE INDEX idx_user_dish_preferences_liked ON public.user_dish_preferences(dish_id, liked) WHERE liked = true;