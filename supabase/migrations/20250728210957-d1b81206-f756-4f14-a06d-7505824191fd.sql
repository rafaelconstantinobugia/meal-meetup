-- Create bucket for chat media
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', false);

-- Create storage policies for chat media
CREATE POLICY "Users can view media in their conversations" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-media' AND 
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id::text = (storage.foldername(name))[1]
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can upload media in their conversations" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-media' AND 
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id::text = (storage.foldername(name))[1]
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);

-- Add typing indicators table
CREATE TABLE public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, user_id)
);

-- Add restaurant suggestions table
CREATE TABLE public.restaurant_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  suggested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  restaurant_address TEXT NOT NULL,
  cuisine_type TEXT,
  price_range TEXT,
  rating DECIMAL(2,1),
  google_place_id TEXT,
  suggested_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add meeting coordination table
CREATE TABLE public.meetup_coordination (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL UNIQUE REFERENCES public.matches(id) ON DELETE CASCADE,
  restaurant_suggestion_id UUID REFERENCES public.restaurant_suggestions(id),
  confirmed_location TEXT,
  confirmed_time TIMESTAMP WITH TIME ZONE,
  both_users_confirmed BOOLEAN DEFAULT false,
  user1_confirmed BOOLEAN DEFAULT false,
  user2_confirmed BOOLEAN DEFAULT false,
  emergency_contact_shared BOOLEAN DEFAULT false,
  safety_checklist_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_coordination ENABLE ROW LEVEL SECURITY;

-- RLS policies for typing_indicators
CREATE POLICY "Users can manage typing in their matches" 
ON public.typing_indicators FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = typing_indicators.match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);

-- RLS policies for restaurant_suggestions
CREATE POLICY "Users can view suggestions in their matches" 
ON public.restaurant_suggestions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = restaurant_suggestions.match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can create suggestions in their matches" 
ON public.restaurant_suggestions FOR INSERT
WITH CHECK (
  auth.uid() = suggested_by AND
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = restaurant_suggestions.match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can update suggestions in their matches" 
ON public.restaurant_suggestions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = restaurant_suggestions.match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);

-- RLS policies for meetup_coordination
CREATE POLICY "Users can manage meetup coordination in their matches" 
ON public.meetup_coordination FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = meetup_coordination.match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_typing_indicators_updated_at
  BEFORE UPDATE ON public.typing_indicators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meetup_coordination_updated_at
  BEFORE UPDATE ON public.meetup_coordination
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update typing indicator
CREATE OR REPLACE FUNCTION public.update_typing_indicator(
  p_match_id UUID,
  p_is_typing BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.typing_indicators (match_id, user_id, is_typing)
  VALUES (p_match_id, auth.uid(), p_is_typing)
  ON CONFLICT (match_id, user_id)
  DO UPDATE SET 
    is_typing = EXCLUDED.is_typing,
    updated_at = now();
END;
$$;

-- Function to confirm meetup
CREATE OR REPLACE FUNCTION public.confirm_meetup(
  p_match_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  match_record public.matches%ROWTYPE;
  is_user1 BOOLEAN;
BEGIN
  -- Get match details
  SELECT * INTO match_record FROM public.matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  
  -- Check if current user is part of this match
  IF current_user_id != match_record.user1_id AND current_user_id != match_record.user2_id THEN
    RAISE EXCEPTION 'User not authorized for this match';
  END IF;
  
  is_user1 := (current_user_id = match_record.user1_id);
  
  -- Insert or update meetup coordination
  INSERT INTO public.meetup_coordination (match_id, user1_confirmed, user2_confirmed)
  VALUES (
    p_match_id,
    CASE WHEN is_user1 THEN true ELSE false END,
    CASE WHEN is_user1 THEN false ELSE true END
  )
  ON CONFLICT (match_id)
  DO UPDATE SET
    user1_confirmed = CASE WHEN is_user1 THEN true ELSE meetup_coordination.user1_confirmed END,
    user2_confirmed = CASE WHEN is_user1 THEN meetup_coordination.user2_confirmed ELSE true END,
    both_users_confirmed = (
      CASE WHEN is_user1 THEN true ELSE meetup_coordination.user1_confirmed END AND
      CASE WHEN is_user1 THEN meetup_coordination.user2_confirmed ELSE true END
    ),
    updated_at = now();
    
  -- Update match status if both confirmed
  IF (SELECT both_users_confirmed FROM public.meetup_coordination WHERE match_id = p_match_id) THEN
    UPDATE public.matches 
    SET status = 'meetup_confirmed', updated_at = now()
    WHERE id = p_match_id;
  END IF;
END;
$$;

-- Enable realtime for live features
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_suggestions;