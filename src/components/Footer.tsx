import { Github, Linkedin, Instagram, Mail } from "lucide-react";
import { useSettings } from "@/hooks/useContent";

export const Footer = () => {
  const { data: s } = useSettings();
  if (!s) return null;
  const links = [
    { icon: Github, href: s.github_url, label: "GitHub" },
    { icon: Linkedin, href: s.linkedin_url, label: "LinkedIn" },
    { icon: Instagram, href: s.instagram_url, label: "Instagram" },
    { icon: Mail, href: s.email ? `mailto:${s.email}` : null, label: "Email" },
  ].filter((l) => l.href);

  return (
    <footer className="border-t border-border py-10">
      <div className="container flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {s.full_name}</p>
        <div className="flex gap-2">
          {links.map(({ icon: Icon, href, label }) => (
            <a key={label} href={href!} target={href!.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" aria-label={label}
              className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};
