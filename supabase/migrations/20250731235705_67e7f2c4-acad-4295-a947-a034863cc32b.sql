-- Create food_photos table for user-submitted food images
CREATE TABLE public.food_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create photo_swipes table to track swipes on photos
CREATE TABLE public.photo_swipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  swiper_user_id UUID NOT NULL,
  photo_id UUID NOT NULL,
  choice BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(swiper_user_id, photo_id)
);

-- Create photo_matches table for mutual matches
CREATE TABLE public.photo_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  mutual_likes_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'matched',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.food_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for food_photos
CREATE POLICY "Users can view all active food photos except their own" 
ON public.food_photos 
FOR SELECT 
USING (is_active = true AND user_id != auth.uid());

CREATE POLICY "Users can view their own food photos" 
ON public.food_photos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food photos" 
ON public.food_photos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food photos" 
ON public.food_photos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food photos" 
ON public.food_photos 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for photo_swipes
CREATE POLICY "Users can view their own photo swipes" 
ON public.photo_swipes 
FOR SELECT 
USING (auth.uid() = swiper_user_id);

CREATE POLICY "Users can insert their own photo swipes" 
ON public.photo_swipes 
FOR INSERT 
WITH CHECK (auth.uid() = swiper_user_id);

-- RLS Policies for photo_matches
CREATE POLICY "Users can view their own photo matches" 
ON public.photo_matches 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can insert photo matches" 
ON public.photo_matches 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their photo matches" 
ON public.photo_matches 
FOR UPDATE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Add updated_at trigger for food_photos
CREATE TRIGGER update_food_photos_updated_at
BEFORE UPDATE ON public.food_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for photo_matches
CREATE TRIGGER update_photo_matches_updated_at
BEFORE UPDATE ON public.photo_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for food photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('food-photos', 'food-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for food photos
CREATE POLICY "Anyone can view food photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-photos');

CREATE POLICY "Users can upload their own food photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own food photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own food photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);