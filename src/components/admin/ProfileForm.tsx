/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FieldInput, type Field } from "./FieldInput";
import { PhotoField } from "./PhotoField";

const fields: Field[] = [
  { key: "full_name", label: "Full name", type: "text", required: true },
  { key: "role_label", label: "Role label", type: "text", required: true, hint: "small text above your name" },
  { key: "bio", label: "Bio", type: "textarea", required: true, hint: "*underline* a phrase, [circle] a phrase" },
  { key: "cover_title", label: "Cover word", type: "text", hint: "giant title on the cover; empty = your first name" },
  { key: "greeting", label: "Hello heading", type: "text" },
  { key: "location", label: "Location", type: "text", hint: "shown on the cover" },
  { key: "traits", label: "Words around your portrait", type: "tags", hint: "up to 6, comma separated" },
  { key: "letter", label: "Closing note", type: "textarea", hint: "blank line = new paragraph" },
  { key: "cv_url", label: "CV (PDF)", type: "file", folder: "cv", accept: "application/pdf" },
  { key: "email", label: "Public email", type: "text" },
  { key: "github_url", label: "GitHub URL", type: "text" },
  { key: "linkedin_url", label: "LinkedIn URL", type: "text" },
  { key: "instagram_url", label: "Instagram URL", type: "text" },
];

export const ProfileForm = () => {
  const qc = useQueryClient();
  const [v, setV] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { supabase.from("site_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setV(data ?? { id: 1 })); }, []);
  if (!v) return <Loader2 className="mx-auto h-5 w-5 animate-spin" />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const body: Record<string, any> = { id: 1, photo_url: v.photo_url || null, photo_crop: v.photo_crop ?? null };
    for (const f of fields) body[f.key] = typeof v[f.key] === "string" && !v[f.key].trim() ? null : v[f.key];
    const { error } = await supabase.from("site_settings").upsert(body);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved"); qc.invalidateQueries({ queryKey: ["site_settings"] });
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <h3 className="text-lg font-semibold">Profile & links</h3>
      <PhotoField url={v.photo_url ?? null} crop={v.photo_crop ?? null} onChange={(url, crop) => setV({ ...v, photo_url: url, photo_crop: crop })} />
      {fields.map((f) => <FieldInput key={f.key} field={f} value={v[f.key]} onChange={(x) => setV({ ...v, [f.key]: x })} />)}
      <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
      </button>
    </form>
  );
};
