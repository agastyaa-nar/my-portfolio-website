import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Book, Briefcase, GraduationCap, Images, Laptop, Trophy } from "lucide-react";
import { Arrow, Hand, Heading, PenMark } from "./Pen";
import { Inner, Sheet, type Tone } from "./Sheet";
import { ExperienceModal } from "@/components/ExperienceModal";
import type { Experience, Settings } from "@/data/types";

const icons: Record<string, typeof Briefcase> = { briefcase: Briefcase, graduation: GraduationCap, book: Book, trophy: Trophy, laptop: Laptop };
const abs = (u: string) => (/^https?:/.test(u) ? u : `${window.location.origin}${u.startsWith("/") ? "" : "/"}${u}`);

export function ExperienceSheet({ items, s, tone, prev }: { items: Experience[]; s: Settings; tone: Tone; prev?: Tone }) {
  const [open, setOpen] = useState<Experience | null>(null);
  return (
    <Sheet id="experience" label="Experience" tone={tone} prev={prev}>
      <Inner className="grid items-start gap-[clamp(32px,6vw,110px)] lg:grid-cols-[1fr_1.25fr]">
        <div className="lg:sticky lg:top-28">
          <Heading seed={5}>Experience</Heading>
          <p className="mt-6 max-w-[40ch] text-[clamp(14px,1.15vw,17px)] leading-[1.8] text-muted-foreground">A short history of where I studied, worked and built things, in order.</p>
          {s.cv_url && (
            <div className="relative mt-14 flex items-center gap-6">
              <a href={s.cv_url} target="_blank" rel="noopener noreferrer" aria-label="Open CV" className="relative -rotate-2 rounded-xl bg-white p-2.5 shadow-[0_18px_40px_-22px_rgba(0,0,0,.45)] transition-transform hover:rotate-0 hover:scale-105">
                <QRCodeSVG value={abs(s.cv_url)} size={132} level="M" bgColor="#ffffff" fgColor="#242426" />
              </a>
              <div className="relative max-w-[8em] text-[clamp(24px,2.6vw,36px)]">
                <svg aria-hidden viewBox="0 0 90 60" className="mb-1 -ml-1.5 block h-auto w-[72px] overflow-visible"><Arrow a={[80, 6]} b={[8, 46]} bend={0.4} head={8} /></svg>
                <Hand>scan for the CV</Hand>
              </div>
            </div>
          )}
        </div>

        <ol>
          {items.map((e) => {
            const Icon = icons[e.icon] ?? Briefcase;
            return (
              <li key={e.id ?? e.title} className="grid grid-cols-[auto_1fr] gap-4 border-t border-border py-6 first:border-t-0 first:pt-0">
                <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-border">
                  {e.logo_url ? <img src={e.logo_url} alt="" className="h-7 w-7 rounded-full object-contain" /> : <Icon className="h-4 w-4 text-neutral-700" />}
                </span>
                <div>
                  <Hand className="text-[22px]">{e.period.trim()}</Hand>
                  <h3 className="mt-0.5 text-[clamp(16px,1.35vw,20px)] font-medium leading-snug">
                    {e.highlight ? <PenMark kind="oval" padX={12} padY={6} seed={e.sort_order + 2}>{e.title.trim()}</PenMark> : e.title.trim()}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{e.organization}</p>
                  {e.description && <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{e.description}</p>}
                  {e.images?.length > 0 && (
                    <button onClick={() => setOpen(e)} className="mt-3 inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:text-pen hover:underline">
                      <Images className="h-4 w-4" /> View photos
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Inner>
      <ExperienceModal experience={open} onClose={() => setOpen(null)} />
    </Sheet>
  );
}
