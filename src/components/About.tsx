import { motion } from "framer-motion";
import { Download, Maximize, ArrowDown } from "lucide-react";
import { useSettings } from "@/hooks/useContent";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const About = () => {
  const { data: s } = useSettings();
  if (!s) return null;
  const [first, ...rest] = s.full_name.split(" ");
  const last = rest.pop();
  return (
  <section id="about" className="flex min-h-[calc(100vh-4rem)] items-center py-16">
    <div className="container max-w-5xl">
      <div className="grid items-center gap-12 md:grid-cols-[1fr_auto]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="eyebrow mb-4">{s.role_label}</p>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            {first} {rest.join(" ")} <span className="text-primary">{last}</span>
          </h1>
          <p className="mt-6 max-w-xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{s.bio}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#connect" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Get in touch <ArrowDown className="h-4 w-4" />
            </a>
            {s.cv_url && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary">
                  View CV
                </button>
              </DialogTrigger>
              <DialogContent className="flex h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
                  <DialogTitle className="text-base">Curriculum Vitae</DialogTitle>
                  <div className="mr-8 flex gap-2">
                    <a href={s.cv_url} download className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                      <Download className="h-4 w-4" /><span className="hidden sm:inline">Download</span>
                    </a>
                    <a href={s.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
                      <Maximize className="h-4 w-4" /><span className="hidden sm:inline">Fullscreen</span>
                    </a>
                  </div>
                </DialogHeader>
                <iframe src={s.cv_url} title="CV preview" className="h-full w-full flex-1" />
              </DialogContent>
            </Dialog>
            )}
          </div>
        </motion.div>

        {s.photo_url && <motion.img
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
          src={s.photo_url ?? "/profile.png"} alt={`Portrait of ${s.full_name}`}
          className="mx-auto h-44 w-44 rounded-2xl border border-border object-cover md:h-64 md:w-64"
        />}
      </div>
    </div>
  </section>
);
};
