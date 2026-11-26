import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { fallback } from "@/data/fallback";
import type { Settings, Experience, Certification, TechItem, Project } from "@/data/types";

// On a network/DB error we show the built-in fallback; an empty table stays empty
// (so deleting an item in /admin really removes it from the site).
async function rows<T>(table: string, fb: T[]): Promise<T[]> {
  if (!isSupabaseConfigured) return fb;
  const { data, error } = await supabase
    .from(table).select("*").eq("published", true)
    .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  return error ? fb : ((data ?? []) as T[]);
}

const opts = { staleTime: 60_000, refetchOnWindowFocus: false } as const;

export const useExperiences = () =>
  useQuery({ queryKey: ["experiences"], queryFn: () => rows<Experience>("experiences", fallback.experiences), placeholderData: fallback.experiences, ...opts });
export const useCertifications = () =>
  useQuery({ queryKey: ["certifications"], queryFn: () => rows<Certification>("certifications", fallback.certifications), placeholderData: fallback.certifications, ...opts });
export const useTechStack = () =>
  useQuery({ queryKey: ["tech_stack"], queryFn: () => rows<TechItem>("tech_stack", fallback.tech_stack), placeholderData: fallback.tech_stack, ...opts });
export const useProjects = () =>
  useQuery({ queryKey: ["projects"], queryFn: () => rows<Project>("projects", fallback.projects), placeholderData: fallback.projects, ...opts });

export const useSettings = () =>
  useQuery({
    queryKey: ["site_settings"],
    placeholderData: fallback.settings,
    ...opts,
    queryFn: async (): Promise<Settings> => {
      if (!isSupabaseConfigured) return fallback.settings;
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      return error || !data ? fallback.settings : (data as Settings);
    },
  });
