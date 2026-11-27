-- Extra editable fields for the "Marginalia" redesign. All nullable, so existing rows keep working.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS cover_title TEXT,          -- giant cover word (defaults to first name)
  ADD COLUMN IF NOT EXISTS greeting    TEXT,          -- heading of the "Hello" sheet
  ADD COLUMN IF NOT EXISTS location   TEXT,
  ADD COLUMN IF NOT EXISTS traits     TEXT[] NOT NULL DEFAULT '{}',  -- handwritten words around the portrait (max 6)
  ADD COLUMN IF NOT EXISTS letter     TEXT;           -- the closing note on the contact sheet

ALTER TABLE public.experiences  ADD COLUMN IF NOT EXISTS highlight BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.tech_stack   ADD COLUMN IF NOT EXISTS note TEXT;   -- handwritten note shown on hover
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS kind      TEXT,
  ADD COLUMN IF NOT EXISTS year      TEXT,
  ADD COLUMN IF NOT EXISTS challenge TEXT;

-- Defaults for the existing row (only where still empty). Edit anything from /admin.
UPDATE public.site_settings SET
  greeting = COALESCE(greeting, 'Hello!'),
  traits   = CASE WHEN traits = '{}' THEN ARRAY['Back-end','Mathematics','APIs','PostgreSQL','Node.js'] ELSE traits END,
  letter   = COALESCE(letter, E'Thanks for scrolling all the way down.\n\nIf you have a project, an opportunity, or just a question, write to me below. I read every message.'),
  bio      = CASE WHEN bio LIKE 'I build reliable, secure and scalable server-side systems.%' AND bio NOT LIKE '%*%'
             THEN 'I build *reliable, secure and scalable* server-side systems. My background is in [Mathematics] at Institut Teknologi Sepuluh Nopember, and I enjoy turning rigorous problems into clean, efficient software.'
             ELSE bio END
WHERE id = 1;

UPDATE public.projects SET kind = CASE slug
  WHEN 'rembug' THEN 'Discussion platform'
  WHEN 'notes-app-back-end' THEN 'REST API'
  WHEN 'open-music-api' THEN 'REST API'
  WHEN 'movie-web-db' THEN 'Web app' END
WHERE kind IS NULL AND slug IN ('rembug','notes-app-back-end','open-music-api','movie-web-db');
