/** Visible part of the photo, as percentages of the whole image. */
export type PhotoCrop = { x: number; y: number; width: number; height: number };

export type Settings = {
  full_name: string; role_label: string; bio: string;
  photo_url: string | null; cv_url: string | null; email: string | null;
  github_url: string | null; linkedin_url: string | null; instagram_url: string | null;
  cover_title: string | null; greeting: string | null; location: string | null;
  traits: string[]; letter: string | null;
  photo_crop: PhotoCrop | null;
};
export type Experience = {
  id?: string; title: string; organization: string; period: string; description: string;
  icon: string; logo_url: string | null; images: string[]; highlight: boolean; sort_order: number;
};
export type Certification = {
  id?: string; name: string; issuer: string; year: string;
  image_url: string | null; logo_url: string | null; pdf_url: string | null; sort_order: number;
};
export type TechItem = { id?: string; name: string; logo_url: string; note: string | null; sort_order: number };
export type Project = {
  id?: string; slug: string; title: string; description: string; tech: string[];
  demo_url: string | null; github_url: string | null; image_url: string | null;
  featured: boolean; kind: string | null; year: string | null; challenge: string | null; sort_order: number;
};
