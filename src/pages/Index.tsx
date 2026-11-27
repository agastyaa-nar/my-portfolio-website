import { useEffect, type ReactNode } from "react";
import { useCertifications, useExperiences, useProjects, useSettings, useTechStack } from "@/hooks/useContent";
import { Chrome } from "@/components/folio/Chrome";
import { Cover } from "@/components/folio/Cover";
import { Hello } from "@/components/folio/Hello";
import { ExperienceSheet } from "@/components/folio/ExperienceSheet";
import { CaseSheet, ProjectsSheet } from "@/components/folio/Work";
import { Skills } from "@/components/folio/Skills";
import { Certs } from "@/components/folio/Certs";
import { Contact } from "@/components/folio/Contact";
import type { Tone } from "@/components/folio/Sheet";

type Entry = { id: string; label: string; toc?: boolean; render: (tone: Tone, prev?: Tone) => ReactNode };

const Index = () => {
  const { data: s } = useSettings();
  const { data: exps = [] } = useExperiences();
  const { data: projects = [] } = useProjects();
  const { data: tech = [] } = useTechStack();
  const { data: certs = [] } = useCertifications();
  const year = String(new Date().getFullYear());

  useEffect(() => { if (s) document.title = `${s.full_name} | ${s.role_label}`; }, [s]);
  if (!s) return null;

  // Sheets alternate paper / night automatically, whatever content exists.
  const entries: Entry[] = [
    { id: "top", label: "Cover", render: (t, p) => <Cover s={s} year={year} tone={t} prev={p} /> },
    { id: "hello", label: "Hello", toc: true, render: (t, p) => <Hello s={s} tone={t} prev={p} /> },
    ...(exps.length ? [{ id: "experience", label: "Experience", toc: true, render: (t: Tone, p?: Tone) => <ExperienceSheet items={exps} s={s} tone={t} prev={p} /> }] : []),
    ...(projects.length ? [{ id: "projects", label: "Projects", toc: true, render: (t: Tone, p?: Tone) => <ProjectsSheet items={projects} tone={t} prev={p} /> }] : []),
    ...projects.map((p, i): Entry => ({ id: `case-${p.slug}`, label: p.title, render: (t, pr) => <CaseSheet p={p} index={i} tone={t} prev={pr} /> })),
    ...(tech.length ? [{ id: "toolbox", label: "Toolbox", toc: true, render: (t: Tone, p?: Tone) => <Skills items={tech} tone={t} prev={p} /> }] : []),
    ...(certs.length ? [{ id: "certifications", label: "Certifications", toc: true, render: (t: Tone, p?: Tone) => <Certs items={certs} tone={t} prev={p} /> }] : []),
    { id: "contact", label: "Contact", toc: true, render: (t, p) => <Contact s={s} tone={t} prev={p} /> },
  ];
  const tones: Tone[] = entries.map((_, i) => (i % 2 === 0 ? "paper" : "night"));

  return (
    <div className="bg-background">
      <Chrome year={year} name={s.full_name} items={entries.filter((e) => e.toc).map(({ id, label }) => ({ id, label }))} />
      <main>{entries.map((e, i) => <div key={e.id}>{e.render(tones[i], tones[i - 1])}</div>)}</main>
    </div>
  );
};

export default Index;
