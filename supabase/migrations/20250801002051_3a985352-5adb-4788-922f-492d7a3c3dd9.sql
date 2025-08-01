-- Create optimized function to get next photo for swiping
CREATE OR REPLACE FUNCTION public.get_next_photo_for_swipe(current_user_id UUID)
RETURNS TABLE (
  id UUID,
  image_url TEXT,
  caption TEXT,
  tags TEXT[],
  city TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.image_url,
    fp.caption,
    fp.tags,
    p.city
  FROM public.food_photos fp
  INNER JOIN public.profiles p ON fp.user_id = p.user_id
  WHERE fp.user_id <> current_user_id
    AND fp.is_active = true
    AND NOT EXISTS (
      SELECT 1 
      FROM public.photo_swipes ps 
      WHERE ps.swiper_user_id = current_user_id 
        AND ps.photo_id = fp.id
    )
  ORDER BY random()
  LIMIT 1;
END;
$$;