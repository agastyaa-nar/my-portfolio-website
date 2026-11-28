-- Nested experience: an entry (e.g. "Bachelor's Degree") can contain other entries
-- (internship, lab assistant, ...). One level deep is enough and keeps the page readable.
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL;  -- deleting a parent promotes its children, never deletes them

ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_not_own_parent;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_not_own_parent CHECK (parent_id IS NULL OR parent_id <> id);

CREATE INDEX IF NOT EXISTS idx_experiences_parent ON public.experiences (parent_id);

CREATE OR REPLACE FUNCTION public.experiences_one_level() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.experiences WHERE id = NEW.parent_id AND parent_id IS NOT NULL) THEN
      RAISE EXCEPTION 'Experience can only be nested one level deep';
    END IF;
    IF EXISTS (SELECT 1 FROM public.experiences WHERE parent_id = NEW.id) THEN
      RAISE EXCEPTION 'An experience that contains other items cannot itself be nested';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS experiences_one_level ON public.experiences;
CREATE TRIGGER experiences_one_level
  BEFORE INSERT OR UPDATE OF parent_id ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION public.experiences_one_level();

-- Create the missing "Bachelor's Degree" parent (period left empty: fill it in from /admin),
-- then move the three activities that happened during the bachelor under it.
INSERT INTO public.experiences (title, organization, period, description, icon, logo_url, sort_order)
SELECT 'Bachelor''s Degree',
       COALESCE((SELECT organization FROM public.experiences WHERE btrim(title) = 'Master''s Degree' LIMIT 1), 'Institut Teknologi Sepuluh Nopember'),
       '', '', 'graduation',
       (SELECT logo_url FROM public.experiences WHERE btrim(title) = 'Master''s Degree' LIMIT 1),
       2
WHERE NOT EXISTS (SELECT 1 FROM public.experiences WHERE btrim(title) ILIKE 'Bachelor%');

UPDATE public.experiences
SET parent_id = (SELECT id FROM public.experiences WHERE btrim(title) ILIKE 'Bachelor%' AND parent_id IS NULL ORDER BY created_at LIMIT 1)
WHERE parent_id IS NULL
  AND btrim(title) IN ('Question Maker Team', 'Laboratory Teaching Assistant', 'Internship');
