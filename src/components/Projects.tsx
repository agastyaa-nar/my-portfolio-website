import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import { useProjects } from "@/hooks/useContent";

export const Projects = () => {
  const { data: projects = [] } = useProjects();

  return (
    <section id="projects" className="py-20 sm:py-28">
      <div className="container max-w-5xl">
        <p className="eyebrow mb-3">Selected work</p>
        <h2 className="section-title mb-12">Projects</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p, i) => (
            <motion.article
              key={p.slug}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, delay: (i % 2) * 0.08 }}
              className={`card-surface flex flex-col overflow-hidden ${p.featured ? "md:col-span-2" : ""}`}
            >
              {p.image_url && (
                <img src={p.image_url} alt={`${p.title} screenshot`} loading="lazy"
                  className={`w-full border-b border-border object-cover object-top ${p.featured ? "h-64 sm:h-80" : "h-48"}`} />
              )}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {p.tech.map((t) => (
                    <li key={t} className="rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground">{t}</li>
                  ))}
                </ul>
                <div className="mt-5 flex gap-4 text-sm">
                  {p.demo_url && (
                    <a href={p.demo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                      <ExternalLink className="h-4 w-4" /> Live demo
                    </a>
                  )}
                  {p.github_url && (
                    <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                      <Github className="h-4 w-4" /> Source
                    </a>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
