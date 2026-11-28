/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, CornerDownRight, ListPlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FieldInput, inputCls, type Field } from "./FieldInput";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";

type Row = Record<string, any>;
type Props = {
  table: string; title: string; fields: Field[]; labelKey: string; subKey?: string; defaults: Row;
  /** Column holding the parent's id. Turns the list into a one-level tree. */
  parentKey?: string;
};

export const CrudSection = ({ table, title, fields, labelKey, subKey, defaults, parentKey }: Props) => {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);
  const draftKey = `edit:${table}`;
  const [edit, setEdit] = useState<Row | null>(() => loadDraft<Row>(draftKey));
  const [restored] = useState(() => !!loadDraft(draftKey)); // show the "restored" notice only for drafts found at load time
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select("*").order("sort_order").order("created_at");
    if (error) toast.error(error.message);
    setRows(data ?? []); setLoading(false);
  }, [table]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (edit) saveDraft(draftKey, edit); else clearDraft(draftKey); }, [edit, draftKey]);

  const refreshSite = () => qc.invalidateQueries({ queryKey: [table] });

  // ---- tree helpers (a flat list when parentKey is not used) ----
  const parentOf = (r: Row) => (parentKey ? r[parentKey] ?? null : null);
  const ids = new Set(rows.map((r) => r.id));
  const roots = rows.filter((r) => !parentOf(r) || !ids.has(parentOf(r)));
  const kids = (r: Row) => (parentKey ? rows.filter((x) => x[parentKey] === r.id) : []);
  const siblings = (r: Row) => (parentKey && roots.includes(r) ? roots : parentKey ? kids({ id: parentOf(r) }) : rows);
  const display: { row: Row; depth: number }[] = parentKey
    ? roots.flatMap((r) => [{ row: r, depth: 0 }, ...kids(r).map((k) => ({ row: k, depth: 1 }))])
    : rows.map((row) => ({ row, depth: 0 }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!edit) return;
    for (const f of fields) if (f.required && !String(edit[f.key] ?? "").trim()) return toast.error(`${f.label} is required`);
    setSaving(true);
    const payload: Row = {};
    for (const f of fields) payload[f.key] = f.type === "tags" ? (edit[f.key] ?? []).map((s: string) => s.trim()).filter(Boolean) : edit[f.key];
    payload.published = edit.published ?? true;
    if (parentKey) payload[parentKey] = edit[parentKey] || null;

    // keep the sort order; when the item is new or moved to another parent, put it last in its group
    const before = rows.find((r) => r.id === edit.id);
    const groupSize = rows.filter((r) => (parentKey ? r[parentKey] ?? null : null) === (payload[parentKey ?? ""] ?? null) && r.id !== edit.id).length;
    payload.sort_order = !before || (parentKey && (before[parentKey] ?? null) !== (payload[parentKey] ?? null)) ? groupSize + 1 : edit.sort_order ?? 0;

    const { error } = edit.id
      ? await supabase.from(table).update(payload).eq("id", edit.id)
      : await supabase.from(table).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEdit(null); await load(); refreshSite();
  };

  const remove = async (r: Row) => {
    const n = kids(r).length;
    const warn = n ? `\n\nIts ${n} nested item${n > 1 ? "s" : ""} will move to the top level (they are not deleted).` : "";
    if (!confirm(`Delete "${String(r[labelKey]).trim()}"? This cannot be undone.${warn}`)) return;
    const { error } = await supabase.from(table).delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); await load(); refreshSite();
  };

  // Reorder inside the same group only: top-level items among themselves, nested items among their siblings.
  const move = async (r: Row, d: -1 | 1) => {
    const group = [...siblings(r)];
    const i = group.findIndex((x) => x.id === r.id), j = i + d;
    if (j < 0 || j >= group.length) return;
    [group[i], group[j]] = [group[j], group[i]];
    const results = await Promise.all(group.map((x, idx) => supabase.from(table).update({ sort_order: idx + 1 }).eq("id", x.id)));
    const failed = results.find((x) => x.error);
    if (failed?.error) toast.error(failed.error.message);
    await load(); refreshSite();
  };

  if (edit) {
    const hasKids = !!edit.id && kids(edit).length > 0;
    return (
      <form onSubmit={save} className="space-y-4">
        <h3 className="text-lg font-semibold">{edit.id ? "Edit" : "Add"} · {title}</h3>
        {restored && (
          <p className="flex items-center justify-between gap-3 rounded-lg border border-pen/40 bg-accent px-3 py-2 text-sm">
            <span>Restored your unsaved draft.</span>
            <button type="button" onClick={() => setEdit(null)} className="underline underline-offset-4">Discard</button>
          </p>
        )}
        {parentKey && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Part of <span className="ml-2 text-xs font-normal text-muted-foreground">{hasKids ? "this item contains others, so it stays at the top level" : "choose a parent to nest this item under it"}</span></span>
            <select className={inputCls} disabled={hasKids} value={edit[parentKey] ?? ""} onChange={(e) => setEdit({ ...edit, [parentKey]: e.target.value || null })}>
              <option value="">None (top level)</option>
              {roots.filter((r) => r.id !== edit.id).map((r) => <option key={r.id} value={r.id}>{String(r[labelKey]).trim()}</option>)}
            </select>
          </label>
        )}
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
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title} <span className="text-sm font-normal text-muted-foreground">({rows.length})</span></h3>
        <button onClick={() => setEdit({ ...defaults })} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {display.map(({ row: r, depth }) => {
            const group = siblings(r), idx = group.findIndex((x) => x.id === r.id);
            return (
              <li key={r.id} className={`flex items-center gap-3 py-3 pr-4 ${depth ? "bg-muted/40 pl-10" : "pl-4"}`}>
                {depth > 0 && <CornerDownRight className="-ml-6 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {String(r[labelKey]).trim()}
                    {r.published === false && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">hidden</span>}
                    {parentKey && depth === 0 && kids(r).length > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">{kids(r).length} nested</span>}
                  </p>
                  {subKey && <p className="truncate text-xs text-muted-foreground">{r[subKey]}</p>}
                </div>
                {parentKey && depth === 0 && (
                  <button onClick={() => setEdit({ ...defaults, [parentKey]: r.id })} aria-label={`Add item inside ${String(r[labelKey]).trim()}`} title="Add nested item" className="p-1.5 text-muted-foreground hover:text-primary"><ListPlus className="h-4 w-4" /></button>
                )}
                <button disabled={idx <= 0} onClick={() => move(r, -1)} aria-label="Move up" className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button disabled={idx === group.length - 1} onClick={() => move(r, 1)} aria-label="Move down" className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                <button onClick={() => setEdit(r)} aria-label="Edit" className="p-1.5 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(r)} aria-label="Delete" className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </li>
            );
          })}
          {!rows.length && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing here yet.</li>}
        </ul>
      )}
    </div>
  );
};
