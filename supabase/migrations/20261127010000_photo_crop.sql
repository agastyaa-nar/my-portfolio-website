-- Non-destructive photo framing: the original image stays in storage, and the admin
-- saves which part of it to show (percentages of the image: x, y, width, height).
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS photo_crop JSONB
  CHECK (photo_crop IS NULL OR (
    jsonb_typeof(photo_crop) = 'object'
    AND photo_crop ?& ARRAY['x','y','width','height']
  ));
