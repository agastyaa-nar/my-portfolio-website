import { useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useContent";
import { useTheme } from "@/components/ThemeProvider";

const navLinks = [
  { name: "About", href: "#about" },
  { name: "Experience", href: "#experience" },
  { name: "Projects", href: "#projects" },
  { name: "Certifications", href: "#certifications" },
  { name: "Contact", href: "#connect" },
];

export const Navigation = () => {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const { data: settings } = useSettings();

  const ThemeButton = (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between" aria-label="Main">
        <a href="#about" className="font-display text-2xl">{settings?.full_name.split(" ")[0] ?? "Portfolio"}<span className="text-primary">.</span></a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <a key={l.name} href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.name}
            </a>
          ))}
          {ThemeButton}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {ThemeButton}
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container flex flex-col py-2">
            {navLinks.map((l) => (
              <a key={l.name} href={l.href} onClick={() => setOpen(false)} className="border-b border-border/50 py-3 text-base last:border-0">
                {l.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
