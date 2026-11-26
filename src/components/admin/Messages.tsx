/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Messages = () => {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">Inbox <span className="text-sm font-normal text-muted-foreground">({rows.length})</span></h3>
      <ul className="space-y-3">
        {rows.map((m) => (
          <li key={m.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{m.name} <span className="font-normal text-muted-foreground">· {m.email}</span></p>
                <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-1">
                <a href={`mailto:${m.email}?subject=Re: your message`} aria-label="Reply" className="p-1.5 text-muted-foreground hover:text-primary"><Mail className="h-4 w-4" /></a>
                <button onClick={() => remove(m.id)} aria-label="Delete" className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
          </li>
        ))}
        {!rows.length && <li className="py-8 text-center text-sm text-muted-foreground">No messages yet.</li>}
      </ul>
    </div>
  );
};
