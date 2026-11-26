/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FieldInput, type Field } from "./FieldInput";

type Row = Record<string, any>;
type Props = { table: string; title: string; fields: Field[]; labelKey: string; subKey?: string; defaults: Row };

export const CrudSection = ({ table, title, fields, labelKey, subKey, defaults }: Props) => {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [edit, setEdit] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select("*").order("sort_order").order("created_at");
    if (error) toast.error(error.message);
    setRows(data ?? []); setLoading(false);
  }, [table]);
  useEffect(() => { load(); }, [load]);

  const refreshSite = () => qc.invalidateQueries({ queryKey: [table] });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!edit) return;
    for (const f of fields) if (f.required && !String(edit[f.key] ?? "").trim()) return toast.error(`${f.label} is required`);
    setSaving(true);
    const payload: Row = {};
    for (const f of fields) payload[f.key] = f.type === "tags" ? (edit[f.key] ?? []).map((s: string) => s.trim()).filter(Boolean) : edit[f.key];
    payload.published = edit.published ?? true;
    payload.sort_order = edit.sort_order ?? 0;
    const { error } = edit.id
      ? await supabase.from(table).update(payload).eq("id", edit.id)
      : await supabase.from(table).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEdit(null); await load(); refreshSite();
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete "${r[labelKey]}"? This cannot be undone.`)) return;
    const { error } = await supabase.from(table).delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); await load(); refreshSite();
  };

  const move = async (i: number, d: -1 | 1) => {
    const a = rows[i], b = rows[i + d]; if (!a || !b) return;
    // rewrite the whole order so equal sort_order values can't break swapping
    const next = [...rows]; next[i] = b; next[i + d] = a;
    const results = await Promise.all(next.map((r, idx) => supabase.from(table).update({ sort_order: idx + 1 }).eq("id", r.id)));
    const failed = results.find((x) => x.error);
    if (failed?.error) toast.error(failed.error.message);
    await load(); refreshSite();
  };

  if (edit)
    return (
      <form onSubmit={save} className="space-y-4">
        <h3 className="text-lg font-semibold">{edit.id ? "Edit" : "Add"} · {title}</h3>
        {fields.map((f) => <FieldInput key={f.key} field={f} value={edit[f.key]} onChange={(v) => setEdit({ ...edit, [f.key]: v })} />)}
        <FieldInput field={{ key: "published", label: "Visible on site", type: "bool" }} value={edit.published ?? true} onChange={(v) => setEdit({ ...edit, published: v })} />
        <div className="flex gap-2 pt-2">
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
          <button type="button" onClick={() => setEdit(null)} className="rounded-lg border border-border px-5 py-2 text-sm">Cancel</button>
        </div>
      </form>
    );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title} <span className="text-sm font-normal text-muted-foreground">({rows.length})</span></h3>
        <button onClick={() => setEdit({ ...defaults, sort_order: rows.length + 1 })} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{String(r[labelKey]).trim()} {r.published === false && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">hidden</span>}</p>
                {subKey && <p className="truncate text-xs text-muted-foreground">{r[subKey]}</p>}
              </div>
              <button disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
              <button disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              <button onClick={() => setEdit(r)} aria-label="Edit" className="p-1.5 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(r)} aria-label="Delete" className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
          {!rows.length && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing here yet.</li>}
        </ul>
      )}
    </div>
  );
};
