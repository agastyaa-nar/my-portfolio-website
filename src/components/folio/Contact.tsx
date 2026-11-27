import { motion, useReducedMotion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Github, Instagram, Linkedin, Loader2, Mail, Send } from "lucide-react";
import { Hand, Heading, PenMark, WriteIn } from "./Pen";
import { Inner, Sheet, type Tone } from "./Sheet";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, sendContact, type ContactInput } from "@/lib/contact";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import type { Settings } from "@/data/types";

/** Words fade in one after another, like a letter being written. */
function Letter({ text }: { text: string }) {
  const reduce = useReducedMotion();
  let n = 0;
  return (
    <div className="space-y-5 font-hand text-[clamp(22px,2.1vw,30px)] leading-[1.25]">
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i}>
          {para.split(/\s+/).map((w) => (
            <motion.span key={n} className="inline-block pr-[.28em]" initial={reduce ? false : { opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }} transition={{ delay: Math.min(n++ * 0.035, 2.4), duration: 0.3 }}>{w}</motion.span>
          ))}
        </p>
      ))}
    </div>
  );
}

export function Contact({ s, tone, prev }: { s: Settings; tone: Tone; prev?: Tone }) {
  const form = useForm<ContactInput>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", message: "", website: "" } });
  const sending = form.formState.isSubmitting;

  const onSubmit = async (v: ContactInput) => {
    try {
      await sendContact(v);
      toast.success("Message sent. I'll reply by email.");
      form.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the message. Try again in a minute.");
    }
  };
  const copy = async () => { if (!s.email) return; await navigator.clipboard.writeText(s.email); toast.success("Email copied"); };
  const links = [
    { Icon: Github, href: s.github_url, label: "GitHub" }, { Icon: Linkedin, href: s.linkedin_url, label: "LinkedIn" }, { Icon: Instagram, href: s.instagram_url, label: "Instagram" },
  ].filter((l) => l.href);

  return (
    <Sheet id="contact" label="Contact" tone={tone} prev={prev}>
      <Inner className="grid gap-[clamp(32px,6vw,110px)] lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Heading seed={19} className="text-[clamp(3.6rem,8.6vw,9rem)]">Thank you</Heading>
          {s.photo_url && (
            <div className="mt-10 flex items-center gap-5">
              <PenMark kind="oval" seed={8} padX={8} padY={8} className="rounded-full"><img src={s.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" /></PenMark>
              <Hand className="text-[clamp(26px,2.8vw,38px)]">get in touch</Hand>
            </div>
          )}
          {s.email && (
            <button onClick={copy} className="mt-6 inline-flex items-center gap-2 text-[clamp(16px,1.5vw,22px)] underline-offset-4 hover:underline" aria-label={`Copy email address ${s.email}`}>
              <Mail className="h-5 w-5" /> {s.email}
            </button>
          )}
          {links.length > 0 && (
            <ul className="mt-4 flex gap-5">
              {links.map(({ Icon, href, label }) => (
                <li key={label}><a href={href!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:text-pen hover:underline"><Icon className="h-4 w-4" />{label}</a></li>
              ))}
            </ul>
          )}
          {s.letter && <div className="mt-12 max-w-[34ch]"><Letter text={s.letter} /></div>}
          <p className="mt-8 text-[clamp(34px,4vw,56px)] -rotate-3"><Hand><WriteIn delay={0.4}>{s.full_name}</WriteIn></Hand></p>
        </div>

        <div className="self-center rounded-2xl border border-border bg-card p-[clamp(20px,2.6vw,36px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
              <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" {...form.register("website")} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input autoComplete="name" maxLength={100} placeholder="Your name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl><Textarea rows={5} maxLength={2000} className="resize-none" placeholder="Tell me about your project" {...field} /></FormControl>
                  <div className="flex justify-between"><FormMessage /><span className="ml-auto text-xs text-muted-foreground">{field.value.length}/2000</span></div>
                </FormItem>
              )} />
              <Button type="submit" size="lg" disabled={sending || !isSupabaseConfigured} className="w-full rounded-full">
                {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending</> : <><Send className="mr-2 h-4 w-4" />Send message</>}
              </Button>
              {!isSupabaseConfigured && <p className="text-xs text-destructive">Contact is off: the Supabase environment variables are missing.</p>}
            </form>
          </Form>
        </div>
      </Inner>
      <p className="mt-16 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {s.full_name}</p>
    </Sheet>
  );
}
