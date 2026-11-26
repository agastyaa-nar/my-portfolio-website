import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { inputCls, type Field } from "@/components/admin/FieldInput";
import { CrudSection } from "@/components/admin/CrudSection";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { Messages } from "@/components/admin/Messages";

const ICONS = ["briefcase", "graduation", "book", "trophy", "laptop"];

const sections = {
  profile: { label: "Profile", el: <ProfileForm /> },
  experience: {
    label: "Experience",
    el: <CrudSection table="experiences" title="Experience" labelKey="title" subKey="organization"
      defaults={{ icon: "briefcase", images: [] }}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "organization", label: "Organization", type: "text", required: true },
        { key: "period", label: "Period", type: "text", required: true, hint: "e.g. Jul 2025 - Aug 2025" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "icon", label: "Fallback icon", type: "select", options: ICONS },
        { key: "logo_url", label: "Logo", type: "file", folder: "logos" },
        { key: "images", label: "Photos", type: "files", folder: "experience" },
      ] as Field[]} />,
  },
  projects: {
    label: "Projects",
    el: <CrudSection table="projects" title="Projects" labelKey="title" subKey="slug"
      defaults={{ tech: [], featured: false }}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "slug", label: "Slug", type: "text", required: true, hint: "unique, lowercase-with-dashes" },
        { key: "description", label: "Description", type: "textarea", required: true },
        { key: "tech", label: "Technologies", type: "tags" },
        { key: "demo_url", label: "Live demo URL", type: "text" },
        { key: "github_url", label: "Source URL", type: "text" },
        { key: "image_url", label: "Screenshot", type: "file", folder: "projects" },
        { key: "featured", label: "Featured (full width)", type: "bool" },
      ] as Field[]} />,
  },
  certs: {
    label: "Certifications",
    el: <CrudSection table="certifications" title="Certifications" labelKey="name" subKey="issuer" defaults={{ year: String(new Date().getFullYear()) }}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "issuer", label: "Issuer", type: "text", required: true },
        { key: "year", label: "Year", type: "text", required: true },
        { key: "logo_url", label: "Issuer logo", type: "file", folder: "logos" },
        { key: "image_url", label: "Certificate image", type: "file", folder: "certs" },
        { key: "pdf_url", label: "Certificate PDF", type: "file", folder: "pdfs", accept: "application/pdf" },
      ] as Field[]} />,
  },
  tech: {
    label: "Tech stack",
    el: <CrudSection table="tech_stack" title="Tech stack" labelKey="name" defaults={{}}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "logo_url", label: "Logo", type: "file", folder: "tech", required: true, hint: "SVG or PNG" },
      ] as Field[]} />,
  },
  inbox: { label: "Inbox", el: <Messages /> },
} as const;
type Tab = keyof typeof sections;

const Login = () => {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error("Invalid email or password");
  };
  return (
    <form onSubmit={submit} className="mx-auto mt-24 w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6">
      <h1 className="font-display text-3xl">Admin</h1>
      <input className={inputCls} type="email" placeholder="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className={inputCls} type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
      </button>
    </form>
  );
};

const Admin = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    document.title = "Admin";
    const meta = document.createElement("meta"); meta.name = "robots"; meta.content = "noindex,nofollow"; document.head.appendChild(meta);
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { sub.subscription.unsubscribe(); meta.remove(); };
  }, []);

  useEffect(() => {
    setIsAdmin(null);
    if (!session) return;
    supabase.from("admin_users").select("user_id").maybeSingle().then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!isSupabaseConfigured) return <p className="p-10">Supabase is not configured (.env.local).</p>;
  if (session === undefined || (session && isAdmin === null)) return <Loader2 className="mx-auto mt-24 h-6 w-6 animate-spin" />;
  if (!session) return <Login />;
  if (!isAdmin)
    return (
      <div className="mx-auto mt-24 max-w-sm space-y-4 text-center">
        <p>This account is signed in but is not an admin.</p>
        <button onClick={() => supabase.auth.signOut()} className="rounded-lg border border-border px-4 py-2 text-sm">Sign out</button>
      </div>
    );

  return (
    <div className="container max-w-3xl py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl">Edit portfolio</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">View site</Link>
          <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </header>
      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Sections">
        {(Object.keys(sections) as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${tab === k ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
            {sections[k].label}
          </button>
        ))}
      </nav>
      <div key={tab}>{sections[tab].el}</div>
    </div>
  );
};

export default Admin;
