-- 1. Lock down contact_messages ------------------------------------------------
-- The original policies let ANY visitor read every message with the public anon
-- key. Remove them: with RLS on and no policies, only the service role (used by
-- the submit-contact Edge Function) can touch this table.
DROP POLICY IF EXISTS "Users can view all messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

-- Data integrity at the database level, not only in the UI.
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
  ADD CONSTRAINT contact_name_len    CHECK (char_length(btrim(name))    BETWEEN 1 AND 100),
  ADD CONSTRAINT contact_email_len   CHECK (char_length(email)          BETWEEN 5 AND 254),
  ADD CONSTRAINT contact_email_fmt   CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT contact_message_len CHECK (char_length(btrim(message)) BETWEEN 5 AND 2000);

CREATE INDEX IF NOT EXISTS idx_contact_messages_ip_recent
  ON public.contact_messages (ip_hash, created_at DESC);

-- 2. Projects: public, read-only content --------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  tech        TEXT[] NOT NULL DEFAULT '{}',
  demo_url    TEXT,
  github_url  TEXT,
  image_url   TEXT,
  featured    BOOLEAN NOT NULL DEFAULT false,
  sort_order  INT NOT NULL DEFAULT 0,
  published   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Visitors may read published projects. No insert/update/delete policy exists,
-- so edits happen from the Supabase dashboard (service role) only.
CREATE POLICY "Public can read published projects"
  ON public.projects FOR SELECT
  TO anon, authenticated
  USING (published);

CREATE INDEX IF NOT EXISTS idx_projects_order ON public.projects (sort_order, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Seed (idempotent) ---------------------------------------------------------
INSERT INTO public.projects (slug, title, description, tech, demo_url, github_url, image_url, featured, sort_order) VALUES
('rembug', 'Rembug',
 'A discussion platform that keeps technical conversations organized and easy to revisit: accounts, thread feeds, nested replies, comment likes, and owner-only content management.',
 ARRAY['Node.js','Hapi.js','PostgreSQL','JWT','React','Vite','Tailwind CSS','Jest'],
 'https://rembug-api.vercel.app', 'https://github.com/agastyaa-nar/rembug', '/projects/Rembug.png', true, 1),
('notes-app-back-end', 'Notes App Back-End',
 'RESTful back-end for a note-taking app with authentication, secure data handling and a focus on clean, scalable code.',
 ARRAY['Node.js','Hapi.js','PostgreSQL','Redis','RabbitMQ'],
 NULL, 'https://github.com/agastyaa-nar/notes-app-back-end', '/projects/Notes.png', false, 2),
('open-music-api', 'Open Music API',
 'Back-end for managing music collections, playlists and collaborations, with Redis caching and an export service over RabbitMQ.',
 ARRAY['Node.js','Hapi.js','PostgreSQL','Redis','RabbitMQ'],
 NULL, 'https://github.com/agastyaa-nar/openmusic-api', '/projects/Music.png', false, 3),
('movie-web-db', 'Movie Web Database',
 'A lightweight movie search engine: search by keyword, browse cards, and open details (genre, director, cast, plot) in a modal.',
 ARRAY['jQuery','Bootstrap','HTML','JavaScript'],
 'https://movie-web-db.vercel.app/', 'https://github.com/agastyaa-nar/movie-web-db', '/projects/Movie.png', false, 4)
ON CONFLICT (slug) DO NOTHING;
