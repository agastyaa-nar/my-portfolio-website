-- =============================================================================
-- Admin + CMS: every piece of site content lives in the database and can be
-- edited only by the account(s) listed in public.admin_users.
-- =============================================================================

-- 1. Who is an admin ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- A logged-in user may see only their own row (lets the UI check "am I admin?").
-- Nobody can insert/update/delete through the API: add admins via SQL editor only.
CREATE POLICY "Read own admin row" ON public.admin_users
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
$$;

-- 2. Content tables -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id           INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),   -- exactly one row
  full_name    TEXT NOT NULL,
  role_label   TEXT NOT NULL,
  bio          TEXT NOT NULL,
  photo_url    TEXT,
  cv_url       TEXT,
  email        TEXT,
  github_url   TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, organization TEXT NOT NULL, period TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'briefcase',
  logo_url TEXT, images TEXT[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, issuer TEXT NOT NULL, year TEXT NOT NULL,
  image_url TEXT, logo_url TEXT, pdf_url TEXT,
  sort_order INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tech_stack (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, logo_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- keep updated_at fresh
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['site_settings','experiences','certifications','tech_stack'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_set_updated_at ON public.%1$s', t);
    EXECUTE format('CREATE TRIGGER %1$s_set_updated_at BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- 3. Row Level Security: public reads published rows, only admins write --------
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['experiences','certifications','tech_stack','projects'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public can read published projects" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Read published or admin" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admin full access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Read published or admin" ON public.%I FOR SELECT TO anon, authenticated USING (published OR public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Admin full access" ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
  END LOOP;
END $$;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin full access" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin can read and delete the contact inbox (still invisible to the public).
CREATE POLICY "Admin reads messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin deletes messages" ON public.contact_messages FOR DELETE TO authenticated USING (public.is_admin());

-- 4. File storage for uploaded images / PDFs ------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('portfolio', 'portfolio', true, 10485760,
        ARRAY['image/png','image/jpeg','image/webp','image/svg+xml','application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public reads portfolio files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'portfolio');
CREATE POLICY "Admin uploads portfolio files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'portfolio' AND public.is_admin());
CREATE POLICY "Admin updates portfolio files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'portfolio' AND public.is_admin());
CREATE POLICY "Admin deletes portfolio files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'portfolio' AND public.is_admin());

-- 5. Seed with the content that used to be hardcoded ---------------------------
INSERT INTO public.site_settings (id, full_name, role_label, bio, photo_url, cv_url, email, github_url, linkedin_url, instagram_url)
VALUES (1, 'Dhanar Agastya Rakalangi', 'Back-end developer',
 'I build reliable, secure and scalable server-side systems. My background is in Mathematics at Institut Teknologi Sepuluh Nopember, and I enjoy turning rigorous problems into clean, efficient software.',
 '/profile.png', '/cv.pdf', 'agastyadhanar@gmail.com',
 'https://github.com/agastyaa-nar', 'https://www.linkedin.com/in/dhanaragastya/', 'https://www.instagram.com/nar.agastyaa_')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.experiences (title, organization, period, description, icon, logo_url, images, sort_order) SELECT * FROM (VALUES
  ('High School', 'SMA GIKI 2 Surabaya', 'May 2019  - May 2022', 'Graduated with honors, where I developed my first web projects, explored technologies such as Web Development, Macro Scripting (Lua), and Data Science, and ultimately discovered my passion for coding.', 'book', '/logos/sma.png', ARRAY['/experience/sma-1.jpg','/experience/sma-2.jpg','/experience/sma-3.jpg']::text[], 1),
  ('Question Maker Team', 'ITS Mathematics Olympiad', 'March 2024 - October 2024', 'Served as Head of Elementary Subdivision Question Maker for the 17th OMITS, compiling the problem book with LaTeX, coordinating staff, reviewing problem quality, managing the problem bank, and organizing the online stage through MyITS Classroom.', 'trophy', '/logos/omits.png', ARRAY['/experience/omits-1.jpg','/experience/omits-2.jpg','/experience/omits-3.jpg']::text[], 2),
  ('Laboratory Teaching Assistant', 'Programming and Visual Computation Laboratory', 'September 2024 - November 2024', 'Instructed students in the fundamentals of Java programming, prepared laboratory worksheets and assignments with LaTeX, evaluated reports, coordinated presentations, and facilitated lab sessions using MyITS Classroom.', 'laptop', '/logos/lab.png', ARRAY['/experience/ta-1.jpg','/experience/ta-2.jpg','/experience/ta-3.jpg']::text[], 3),
  ('Internship', 'General Election Commission of East Java Province', 'July 2025 - August 2025', 'Conducted sentiment analysis of SIREKAP app reviews on Google Play using text preprocessing and Naive Bayes, created visualizations and concise reports to support KPU''s digital service improvements, and prepared strategic recommendations on service quality.', 'briefcase', '/logos/kpu.png', ARRAY['/experience/kpu-1.jpg','/experience/kpu-2.jpg','/experience/kpu-3.jpg','/experience/kpu-4.jpg']::text[], 4),
  ('Master''s Degree', 'Institute of Technology Sepuluh Nopember', 'August 2026 - Present', 'Mathematic major. Strengthened IT skills through scholarships and certifications.', 'graduation', '/logos/its.png', ARRAY['/experience/s1-1.jpg','/experience/s1-2.jpg','/experience/s1-3.jpg','/experience/s1-4.jpg','/experience/s1-5.jpg','/experience/s1-6.jpg']::text[], 5)
) AS v(title, organization, period, description, icon, logo_url, images, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.experiences);

INSERT INTO public.certifications (name, issuer, year, image_url, logo_url, pdf_url, sort_order) SELECT * FROM (VALUES
  ('AWS Back-End Academy Expert Program', 'AWS Training and Certification', '2025', '/certs/25.png', '/logos/AWS.png', '/pdfs/25.pdf', 1),
  ('AWS Back-End Academy Intermediate Program', 'AWS Training and Certification', '2025', '/certs/24.png', '/logos/AWS.png', '/pdfs/24.pdf', 2),
  ('Menjadi Back-End Developer Expert dengan Javascript', 'Dicoding Academy', '2025', '/certs/23.png', '/logos/Dicoding.png', '/pdfs/23.pdf', 3),
  ('Architecting on AWS (Membangun Arsitektur Cloud di AWS)', 'Dicoding Academy', '2025', '/certs/6.png', '/logos/Dicoding.png', '/pdfs/6.pdf', 4),
  ('Belajar Back-End Pemula dengan JavaScript', 'Dicoding Academy', '2025', '/certs/7.png', '/logos/Dicoding.png', '/pdfs/7.pdf', 5),
  ('Belajar Dasar AI', 'Dicoding Academy', '2025', '/certs/8.png', '/logos/Dicoding.png', '/pdfs/8.pdf', 6),
  ('Belajar Dasar Cloud dan Gen AI di AWS', 'Dicoding Academy', '2025', '/certs/9.png', '/logos/Dicoding.png', '/pdfs/9.pdf', 7),
  ('Belajar Dasar Data Science', 'Dicoding Academy', '2025', '/certs/10.png', '/logos/Dicoding.png', '/pdfs/10.pdf', 8),
  ('Belajar Dasar Pemrograman JavaScript', 'Dicoding Academy', '2025', '/certs/11.png', '/logos/Dicoding.png', '/pdfs/11.pdf', 9),
  ('Belajar Dasar Pemrograman Web', 'Dicoding Academy', '2025', '/certs/12.png', '/logos/Dicoding.png', '/pdfs/12.pdf', 10),
  ('Belajar Dasar Structured Query Language (SQL)', 'Dicoding Academy', '2025', '/certs/13.png', '/logos/Dicoding.png', '/pdfs/13.pdf', 11),
  ('Belajar Fundamental Back-End dengan JavaScript', 'Dicoding Academy', '2025', '/certs/14.png', '/logos/Dicoding.png', '/pdfs/14.pdf', 12),
  ('Belajar Membuat Front-End Web untuk Pemula', 'Dicoding Academy', '2025', '/certs/15.png', '/logos/Dicoding.png', '/pdfs/15.pdf', 13),
  ('Memulai Pemrograman dengan Python', 'Dicoding Academy', '2025', '/certs/16.png', '/logos/Dicoding.png', '/pdfs/16.pdf', 14),
  ('Memulai Pemrograman Dengan Swift', 'Dicoding Academy', '2025', '/certs/17.png', '/logos/Dicoding.png', '/pdfs/17.pdf', 15),
  ('Code Generation and Optimization Using IBM Granite', 'IBM', '2025', '/certs/18.png', '/logos/IBM.png', '/pdfs/18.pdf', 16),
  ('IBM Granite Models for Software Development', 'IBM', '2025', '/certs/19.png', '/logos/IBM.png', '/pdfs/19.pdf', 17),
  ('Use Generative AI for Software Development', 'IBM', '2025', '/certs/20.png', '/logos/IBM.png', '/pdfs/20.pdf', 18),
  ('Back-End Developer Intermediate Program', 'AWS Training & Certifications', '2025', '/certs/21.png', '/logos/AWS.png', '/pdfs/21.pdf', 19),
  ('Intro to Software Engineering', 'RevoU', '2025', '/certs/22.png', '/logos/RevoU.png', '/pdfs/22.pdf', 20),
  ('Blockchain Basics', 'Great Learning', '2024', '/certs/1.png', '/logos/GL.png', '/pdfs/1.pdf', 21),
  ('Front End Development - CSS', 'Great Learning', '2024', '/certs/2.png', '/logos/GL.png', '/pdfs/2.pdf', 22),
  ('Data Science Foundations', 'Great Learning', '2024', '/certs/3.png', '/logos/GL.png', '/pdfs/3.pdf', 23),
  ('Front End Development - HTML', 'Great Learning', '2024', '/certs/4.png', '/logos/GL.png', '/pdfs/4.pdf', 24),
  ('Python Fundamentals for Beginners', 'Great Learning', '2024', '/certs/5.png', '/logos/GL.png', '/pdfs/5.pdf', 25)
) AS v(name, issuer, year, image_url, logo_url, pdf_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.certifications);

INSERT INTO public.tech_stack (name, logo_url, sort_order) SELECT * FROM (VALUES
  ('JavaScript', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', 1),
  ('Node.js', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', 2),
  ('React', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', 3),
  ('Vite', 'https://vitejs.dev/logo.svg', 4),
  ('Tailwind CSS', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg', 5),
  ('Hapi.js', 'https://www.svgrepo.com/show/353857/hapi.svg', 6),
  ('PostgreSQL', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg', 7),
  ('JWT', 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/jsonwebtokens.svg', 8),
  ('Jest', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jest/jest-plain.svg', 9),
  ('Git', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg', 10),
  ('Render', 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/render.svg', 11),
  ('Neon', 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/neon.svg', 12),
  ('Vercel', 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vercel.svg', 13),
  ('Supabase', '/logos/supabase.png', 14),
  ('Python', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', 15),
  ('MongoDB', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg', 16),
  ('Bootstrap', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg', 17),
  ('jQuery', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jquery/jquery-original.svg', 18)
) AS v(name, logo_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.tech_stack);
