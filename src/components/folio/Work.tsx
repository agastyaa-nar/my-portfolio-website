import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { ExternalLink, Github } from "lucide-react";
import { Hand, Heading, Marked, PenMark } from "./Pen";
import { Inner, Sheet, type Tone } from "./Sheet";
import { Button } from "@/components/ui/button";
import type { Project } from "@/data/types";

const go = (slug: string) => document.getElementById(`case-${slug}`)?.scrollIntoView({ behavior: "smooth" });

/** The overview: a shuffled pile of project cards deals itself into a row. */
export function ProjectsSheet({ items, tone, prev }: { items: Project[]; tone: Tone; prev?: Tone }) {
  const reduce = useReducedMotion();
  const mid = (items.length - 1) / 2;
  return (
    <Sheet id="projects" label="Projects" tone={tone} prev={prev}>
      <Inner>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <Heading seed={7}>Projects</Heading>
          <Hand className="mt-4 max-w-[12em] -rotate-3 text-right text-[clamp(20px,2.1vw,30px)]">tap a card to read the story</Hand>
        </div>
        <ul className="mt-[clamp(40px,6vw,90px)] grid grid-cols-2 gap-x-[clamp(14px,2.4vw,40px)] gap-y-14 md:grid-cols-4">
          {items.map((p, i) => (
            <motion.li key={p.slug} className="relative"
              initial={reduce ? false : { x: `${(mid - i) * 80}%`, y: i % 2 ? 14 : -10, rotate: ((i * 37) % 13) - 6 }}
              whileInView={{ x: 0, y: 0, rotate: i % 2 ? 1.5 : -1.5 }} viewport={{ once: true, margin: "-15%" }}
              transition={{ type: "spring", stiffness: 70, damping: 16, delay: i * 0.08 }}>
              {p.kind && <Hand className={`absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap text-[clamp(15px,1.6vw,23px)] ${i % 2 ? "rotate-3" : "-rotate-3"}`}>{p.kind}</Hand>}
              <button onClick={() => go(p.slug)} className="block w-full overflow-hidden rounded-lg border border-border bg-card shadow-[0_30px_50px_-30px_rgba(0,0,0,.35)] transition-transform duration-300 hover:-translate-y-2 hover:scale-[1.03]">
                {p.image_url
                  ? <img src={p.image_url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover object-top" />
                  : <span className="flex aspect-[4/3] items-center justify-center p-4 font-display text-2xl">{p.title}</span>}
              </button>
              <p className="mt-3 text-center"><Hand className="text-[clamp(17px,1.9vw,27px)]">{p.title}</Hand></p>
            </motion.li>
          ))}
        </ul>
      </Inner>
    </Sheet>
  );
}

/** Screenshot that tilts toward the pointer, with two ghost sheets fanned out behind it. */
function Tilt({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5), my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-10, 10]), { stiffness: 150, damping: 18 });
  return (
    <div ref={ref} className="relative [perspective:1000px]"
      onPointerMove={(e) => { const r = ref.current!.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width); my.set((e.clientY - r.top) / r.height); }}
      onPointerLeave={() => { mx.set(0.5); my.set(0.5); }}>
      <div aria-hidden className="absolute inset-0 -rotate-6 rounded-xl border border-border" />
      <div aria-hidden className="absolute inset-0 rotate-[4deg] rounded-xl border border-border" />
      <motion.div style={{ rotateX: rx, rotateY: ry }} className="relative overflow-hidden rounded-xl border border-border bg-card shadow-[0_40px_70px_-30px_rgba(0,0,0,.5)]">
        <img src={src} alt={alt} loading="lazy" className="aspect-[4/3] w-full object-cover object-top" />
      </motion.div>
    </div>
  );
}

export function CaseSheet({ p, index, tone, prev }: { p: Project; index: number; tone: Tone; prev?: Tone }) {
  const flip = index % 2 === 1;
  const meta = [p.kind, p.year].filter(Boolean).join(", ");
  return (
    <Sheet id={`case-${p.slug}`} label={p.title} tone={tone} prev={prev}>
      <Inner className={`grid items-center gap-[clamp(32px,6vw,110px)] ${p.image_url ? "md:grid-cols-2" : ""}`}>
        <div className={flip ? "md:order-2" : ""}>
          {meta && <Hand className="mb-2 block text-[26px]">{meta}</Hand>}
          <Heading seed={11 + index} className="text-[clamp(3rem,7vw,7.5rem)]">{p.title}</Heading>
          <p className="mt-8 max-w-[52ch] text-[clamp(14px,1.15vw,17px)] leading-[1.8]"><Marked text={p.description} seed={20 + index} /></p>
          {p.challenge && (
            <p className="mt-6 max-w-[52ch] text-[clamp(14px,1.15vw,17px)] leading-[1.8]">
              <PenMark kind="oval" padX={12} padY={4} seed={30 + index} className="mr-3"><Hand className="text-[24px]">my challenge</Hand></PenMark>
              {p.challenge}
            </p>
          )}
          {p.tech.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-1">
              {p.tech.map((t) => <li key={t}><Hand className="text-[clamp(20px,1.9vw,27px)]">{t}</Hand></li>)}
            </ul>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {p.demo_url && <Button asChild className="rounded-full"><a href={p.demo_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Live demo</a></Button>}
            {p.github_url && <Button asChild variant="outline" className="rounded-full"><a href={p.github_url} target="_blank" rel="noopener noreferrer"><Github className="mr-2 h-4 w-4" />Source</a></Button>}
          </div>
        </div>
        {p.image_url && <div className={`mx-auto w-full max-w-[640px] px-3 ${flip ? "md:order-1" : ""}`}><Tilt src={p.image_url} alt={`${p.title} screenshot`} /></div>}
      </Inner>
    </Sheet>
  );
}
