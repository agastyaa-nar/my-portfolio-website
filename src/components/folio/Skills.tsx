import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Hand, Heading, PenMark } from "./Pen";
import { Inner, Sheet, type Tone } from "./Sheet";
import type { TechItem } from "@/data/types";

export function Skills({ items, tone, prev }: { items: TechItem[]; tone: Tone; prev?: Tone }) {
  const [on, setOn] = useState<number | null>(null);
  const note = on === null ? "hover a tool" : items[on].note || items[on].name;
  return (
    <Sheet id="toolbox" label="Toolbox" tone={tone} prev={prev}>
      <Inner>
        <Heading seed={13}>Toolbox</Heading>
        <div className="mt-[clamp(26px,3vw,44px)] pl-3">
          <PenMark kind="oval" seed={6} padX={26} padY={20} className="max-w-full">
            <div className="flex max-w-[780px] flex-wrap gap-[clamp(10px,1.2vw,16px)]" onMouseLeave={() => setOn(null)}>
              {items.map((t, i) => (
                <motion.button key={t.id ?? t.name} aria-label={t.name} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} onBlur={() => setOn(null)}
                  whileHover={{ y: -8, rotate: -6, scale: 1.08 }} whileFocus={{ y: -8, rotate: -6, scale: 1.08 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}
                  className="grid aspect-square w-[clamp(48px,4.6vw,64px)] place-items-center rounded-[24%] bg-white p-2.5 shadow-[0_10px_22px_-12px_rgba(0,0,0,.5)]">
                  <img src={t.logo_url} alt="" loading="lazy" className="h-full w-full object-contain" />
                </motion.button>
              ))}
            </div>
          </PenMark>
        </div>
        <div className="mt-3 min-h-[2.2em] pl-5 text-[clamp(22px,2.2vw,30px)]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.span key={note} className="inline-block" initial={{ opacity: 0, y: 8, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <Hand>{note}</Hand>
            </motion.span>
          </AnimatePresence>
        </div>
        <ul className="mt-[clamp(40px,5vw,80px)] columns-2 gap-x-[clamp(20px,3vw,48px)] sm:columns-3 lg:columns-4">
          {items.map((t) => (
            <li key={t.id ?? t.name} className="relative break-inside-avoid border-b border-border py-2 pl-5 text-[clamp(13px,1.1vw,16px)] transition-all before:absolute before:left-0.5 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-foreground before:transition-all hover:pl-6 hover:text-pen hover:before:scale-150 hover:before:bg-pen">
              {t.name}
            </li>
          ))}
        </ul>
      </Inner>
    </Sheet>
  );
}
