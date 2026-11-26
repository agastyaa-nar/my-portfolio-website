import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { contactSchema, sendContact } from "@/lib/contact";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

const field = "w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring";

export const Connect = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v?.[0] ?? ""])));
      return;
    }
    setErrors({});
    setSending(true);
    try {
      await sendContact(parsed.data);
      toast.success("Message sent. I'll get back to you soon.");
      setForm({ name: "", email: "", message: "", website: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  const Err = ({ k }: { k: string }) => (errors[k] ? <p role="alert" className="mt-1 text-xs text-destructive">{errors[k]}</p> : null);

  return (
    <section id="connect" className="py-20 sm:py-28">
      <div className="container max-w-2xl">
        <p className="eyebrow mb-3">Contact</p>
        <h2 className="section-title mb-3">Let's work together</h2>
        <p className="mb-10 text-muted-foreground">Have a project or an opportunity in mind? Send a message and I'll reply by email.</p>

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {/* Honeypot: hidden from people, tempting to bots */}
          <input type="text" name="website" value={form.website} onChange={onChange} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">Name</label>
            <input id="name" name="name" value={form.name} onChange={onChange} maxLength={100} autoComplete="name" className={field} placeholder="Your name" />
            <Err k="name" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={onChange} maxLength={254} autoComplete="email" className={field} placeholder="you@example.com" />
            <Err k="email" />
          </div>
          <div>
            <label htmlFor="message" className="mb-1.5 block text-sm font-medium">Message</label>
            <textarea id="message" name="message" rows={5} value={form.message} onChange={onChange} maxLength={2000} className={`${field} resize-none`} placeholder="Tell me about your project…" />
            <div className="flex justify-between"><Err k="message" /><span className="ml-auto mt-1 text-xs text-muted-foreground">{form.message.length}/2000</span></div>
          </div>

          <button type="submit" disabled={sending || !isSupabaseConfigured}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Send message <Send className="h-4 w-4" /></>}
          </button>
        </form>
      </div>
    </section>
  );
};
