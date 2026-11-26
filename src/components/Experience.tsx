import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Book, Trophy, Laptop, Images } from "lucide-react";
import { ExperienceModal } from "./ExperienceModal";
import { useExperiences } from "@/hooks/useContent";
import type { Experience as Exp } from "@/data/types";

const icons: Record<string, typeof Briefcase> = { briefcase: Briefcase, graduation: GraduationCap, book: Book, trophy: Trophy, laptop: Laptop };

export const Experience = () => {
  const { data: items = [] } = useExperiences();
  const [selected, setSelected] = useState<Exp | null>(null);
  if (!items.length) return null;

  return (
    <section id="experience" className="bg-secondary/40 py-20 sm:py-28">
      <div className="container max-w-4xl">
        <p className="eyebrow mb-3">Journey</p>
        <h2 className="section-title mb-12">Experience</h2>

        <ol className="relative space-y-8 border-l border-border pl-8">
          {[...items].reverse().map((e, i) => {
            const Icon = icons[e.icon] ?? Briefcase;
            return (
              <motion.li key={e.id ?? e.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, delay: i * 0.03 }} className="relative">
                <span className="absolute -left-[2.9rem] flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card">
                  {e.logo_url ? <img src={e.logo_url} alt="" className="h-6 w-6 rounded-full object-contain" /> : <Icon className="h-4 w-4 text-primary" />}
                </span>
                <p className="text-xs text-muted-foreground">{e.period.trim()}</p>
                <h3 className="mt-1 text-lg font-semibold">{e.title.trim()}</h3>
                <p className="text-sm font-medium text-primary">{e.organization}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.description}</p>
                {e.images?.length > 0 && (
                  <button onClick={() => setSelected(e)} className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
                    <Images className="h-4 w-4" /> View photos
                  </button>
                )}
              </motion.li>
            );
          })}
        </ol>
      </div>
      <ExperienceModal experience={selected} onClose={() => setSelected(null)} />
    </section>
  );
};
