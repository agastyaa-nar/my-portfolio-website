/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type Field = {
  key: string; label: string; hint?: string; required?: boolean;
  type: "text" | "textarea" | "number" | "bool" | "tags" | "select" | "file" | "files";
  options?: string[]; accept?: string; folder?: string;
};

export const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

const MAX_EDGE = 2400;

/** Phone photos are often 10 MB+. Downscale big raster images in the browser first (keeps PNG transparency). */
async function shrink(file: File): Promise<File | Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file); // applies EXIF rotation
    const k = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    if (k === 1 && file.size < 3_000_000) return file;
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b ?? file), type, 0.9));
  } catch { return file; }
}

export async function upload(file: File, folder: string): Promise<string> {
  const body = await shrink(file);
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${folder}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("portfolio").upload(path, body, { contentType: body.type || file.type });
  if (error) throw error;
  return supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
}

const UploadButton = ({ field, onUrls, multiple }: { field: Field; onUrls: (u: string[]) => void; multiple?: boolean }) => {
  const [busy, setBusy] = useState(false);
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/50">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
      <input type="file" hidden multiple={multiple} accept={field.accept ?? "image/*"}
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])]; if (!files.length) return;
          setBusy(true);
          try { onUrls(await Promise.all(files.map((f) => upload(f, field.folder ?? "misc")))); }
          catch (err: any) { toast.error(err.message ?? "Upload failed"); }
          finally { setBusy(false); e.target.value = ""; }
        }} />
    </label>
  );
};

export const FieldInput = ({ field, value, onChange }: { field: Field; value: any; onChange: (v: any) => void }) => {
  const { type } = field;
  const label = (
    <span className="mb-1 block text-sm font-medium">
      {field.label}{field.required && <span className="text-destructive"> *</span>}
      {field.hint && <span className="ml-2 text-xs font-normal text-muted-foreground">{field.hint}</span>}
    </span>
  );

  if (type === "bool")
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {field.label}
        {field.hint && <span className="text-xs text-muted-foreground">{field.hint}</span>}
      </label>
    );

  return (
    <label className="block">
      {label}
      {type === "textarea" && <textarea rows={5} className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {type === "text" && <input className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
      {type === "number" && <input type="number" className={inputCls} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />}
      {type === "tags" && <input className={inputCls} placeholder="comma, separated" value={(value ?? []).join(", ")} onChange={(e) => onChange(e.target.value.split(","). map((s) => s.trimStart()))} />}
      {type === "select" && (
        <select className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          {field.options!.map((o) => <option key={o}>{o}</option>)}
        </select>
      )}
      {type === "file" && (
        <div className="flex items-center gap-2">
          <input className={inputCls} placeholder="URL or upload a file →" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
          <UploadButton field={field} onUrls={(u) => onChange(u[0])} />
        </div>
      )}
      {type === "files" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {(value ?? []).map((u: string, i: number) => (
              <span key={u} className="relative">
                <img src={u} alt="" className="h-16 w-24 rounded-md border border-border object-cover" />
                <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_: string, j: number) => j !== i))}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <UploadButton multiple field={field} onUrls={(u) => onChange([...(value ?? []), ...u])} />
        </div>
      )}
    </label>
  );
};
