// Safety net only: shown if the database cannot be reached. The real content
// lives in Supabase and is edited from /admin.
import raw from "./fallback.json";
import type { Settings, Experience, Certification, TechItem, Project } from "./types";

export const fallback = raw as unknown as {
  settings: Settings; experiences: Experience[]; certifications: Certification[];
  tech_stack: TechItem[]; projects: Project[];
};
