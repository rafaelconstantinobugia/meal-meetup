-- Create mutual_like_counters table for O(1) performance
CREATE TABLE public.mutual_like_counters (
  liker_id UUID NOT NULL,
  target_id UUID NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (liker_id, target_id)
);

-- Enable RLS
ALTER TABLE public.mutual_like_counters ENABLE ROW LEVEL SECURITY;

-- RLS policies for mutual_like_counters
CREATE POLICY "Users can view their own like counters" 
ON public.mutual_like_counters 
FOR SELECT 
USING (auth.uid() = liker_id OR auth.uid() = target_id);

CREATE POLICY "System can manage like counters" 
ON public.mutual_like_counters 
FOR ALL 
USING (true);

-- Add performance indexes
CREATE INDEX idx_food_photos_user_id ON public.food_photos(user_id);
CREATE INDEX idx_photo_swipes_swiper_photo ON public.photo_swipes(swiper_user_id, photo_id);
CREATE INDEX idx_photo_swipes_photo_choice ON public.photo_swipes(photo_id, choice);
CREATE INDEX idx_photo_swipes_swiper_choice ON public.photo_swipes(swiper_user_id, choice);

-- Add unique constraint to prevent duplicate swipes
ALTER TABLE public.photo_swipes 
ADD CONSTRAINT unique_swiper_photo UNIQUE (swiper_user_id, photo_id);

-- Add constraint to limit 5 photos per user
CREATE OR REPLACE FUNCTION public.check_photo_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.food_photos WHERE user_id = NEW.user_id AND is_active = true) >= 5 THEN
    RAISE EXCEPTION 'User cannot have more than 5 active photos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_photo_limit
  BEFORE INSERT ON public.food_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_photo_limit();

-- Create optimized matching trigger
CREATE OR REPLACE FUNCTION public.process_photo_like()
RETURNS TRIGGER AS $$
DECLARE
  photo_owner_id UUID;
  likes_a_on_b INTEGER := 0;
  likes_b_on_a INTEGER := 0;
BEGIN
  -- Only process likes (choice = true)
  IF NEW.choice = false THEN
    RETURN NEW;
  END IF;

  -- Get photo owner
  SELECT user_id INTO photo_owner_id 
  FROM public.food_photos 
  WHERE id = NEW.photo_id;

  -- Prevent self-likes
  IF photo_owner_id = NEW.swiper_user_id THEN
    RAISE EXCEPTION 'Cannot like your own photos';
  END IF;

  -- Update mutual like counter
  INSERT INTO public.mutual_like_counters (liker_id, target_id, count)
  VALUES (NEW.swiper_user_id, photo_owner_id, 1)
  ON CONFLICT (liker_id, target_id) 
  DO UPDATE SET 
    count = mutual_like_counters.count + 1,
    updated_at = now();

  -- Check for match condition (both users have 2+ mutual likes)
  SELECT COALESCE(count, 0) INTO likes_a_on_b
  FROM public.mutual_like_counters
  WHERE liker_id = NEW.swiper_user_id AND target_id = photo_owner_id;

  SELECT COALESCE(count, 0) INTO likes_b_on_a
  FROM public.mutual_like_counters
  WHERE liker_id = photo_owner_id AND target_id = NEW.swiper_user_id;

  -- Create match if both have 2+ likes
  IF likes_a_on_b >= 2 AND likes_b_on_a >= 2 THEN
    INSERT INTO public.photo_matches (
      user1_id, 
      user2_id, 
      mutual_likes_count, 
      status
    )
    VALUES (
      LEAST(NEW.swiper_user_id, photo_owner_id),
      GREATEST(NEW.swiper_user_id, photo_owner_id),
      likes_a_on_b + likes_b_on_a,
      'matched'
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic matching
CREATE TRIGGER trigger_process_photo_like
  AFTER INSERT ON public.photo_swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.process_photo_like();

-- Add trigger for updated_at on mutual_like_counters
CREATE TRIGGER update_mutual_like_counters_updated_at
  BEFORE UPDATE ON public.mutual_like_counters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();