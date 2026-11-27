import { useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Arrow, Hand, PenMark, WriteIn } from "./Pen";
import { InkTrail } from "./InkTrail";
import { Sheet, type Tone } from "./Sheet";
import { heart, sparkle } from "@/lib/pen";
import type { Settings } from "@/data/types";

/** A star that circles one letter. It turns into a heart while the signature is hovered. */
function Star({ loved }: { loved: boolean }) {
  const x = useMotionValue("0em"), y = useMotionValue("0em"), opacity = useMotionValue(1);
  const reduce = useReducedMotion();
  useAnimationFrame((t) => {
    if (reduce) return;
    const a = (t / 1000) * 0.75;
    x.set(`${Math.cos(a) * 0.62}em`); y.set(`${Math.sin(a) * 0.2}em`); opacity.set(Math.sin(a) > 0 ? 1 : 0.35);
  });
  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-[52%] h-0 w-0 -rotate-[14deg]">
      <motion.span style={{ x, y, opacity }} className="absolute left-0 top-0 block h-0 w-0">
        <svg viewBox="-12 -12 24 24" className="absolute -left-3.5 -top-3.5 h-7 w-7 overflow-visible" style={{ fontSize: 0 }}>
          <motion.path animate={{ d: loved ? heart : sparkle, scale: loved ? 1.25 : 1 }} transition={{ duration: 0.4 }} fill="hsl(var(--pen))" />
        </svg>
      </motion.span>
    </span>
  );
}

function Letter({ ch, i, n, progress, star, loved }: { ch: string; i: number; n: number; progress: MotionValue<number>; star: boolean; loved: boolean }) {
  const reduce = useReducedMotion();
  const mid = (n - 1) / 2;
  const x = useTransform(progress, [0, 1], [0, (i - mid) * 60]);
  const y = useTransform(progress, [0, 1], [0, (i % 2 ? 1 : -1) * 40]);
  const rotate = useTransform(progress, [0, 1], [0, (i - mid) * 4]);
  return (
    <motion.span style={reduce ? undefined : { x, y, rotate }} className="relative inline-block">
      <span className="-mb-[.16em] -mt-[.08em] inline-block overflow-hidden pb-[.16em] pt-[.08em]">
        <motion.span className="inline-block" initial={reduce ? false : { y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: [0.2, 0.8, 0.2, 1] }}>
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      </span>
      {star && <Star loved={loved} />}
    </motion.span>
  );
}

export function Cover({ s, year, tone, prev }: { s: Settings; year: string; tone: Tone; prev?: Tone }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loved, setLoved] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const title = (s.cover_title || s.full_name.split(" ")[0]).trim();
  const letters = [...title];
  const o = letters.map((c) => c.toLowerCase()).lastIndexOf("o");
  const starAt = o >= 0 ? o : letters.length - 1;

  return (
    <Sheet id="top" label="Cover" tone={tone} prev={prev} className="!justify-center overflow-hidden !pt-16">
      <div ref={ref} className="absolute inset-0" />
      <InkTrail target={ref} />
      <div className="relative z-[1] mx-auto flex flex-col items-center">
        <h1 aria-label={title} className="relative flex whitespace-nowrap font-display text-[clamp(78px,21.5vw,370px)] leading-[0.92] tracking-[-0.012em]">
          {letters.map((c, i) => <Letter key={i} ch={c} i={i} n={letters.length} progress={scrollYProgress} star={i === starAt} loved={loved} />)}
          <span onPointerEnter={() => setLoved(true)} onPointerLeave={() => setLoved(false)} className="absolute -top-[.55em] right-[-1%] z-[2] -rotate-[7deg] cursor-default whitespace-nowrap font-hand text-[clamp(17px,4.4vw,72px)] font-medium leading-none text-pen">
            <WriteIn delay={1.1} duration={1.2}>{s.full_name}</WriteIn>
            <svg aria-hidden viewBox="0 0 150 110" className="absolute right-[calc(100%-.55em)] top-[.5em] h-auto w-[2.3em] overflow-visible">
              <Arrow a={[132, 8]} b={[14, 96]} bend={-0.42} delay={2.3} head={11} />
            </svg>
          </span>
        </h1>
        <div className="mt-[clamp(8px,1.2vw,18px)] self-end pr-[6%] text-[clamp(14px,1.5vw,21px)]">
          <PenMark kind="oval" delay={2.6} padX={16} padY={9}>{s.role_label}</PenMark>
        </div>
      </div>
      <div className="absolute inset-x-[clamp(18px,5.2vw,92px)] bottom-[clamp(20px,3vw,40px)] z-[1] flex items-end justify-between gap-4 text-xs tracking-[0.06em] text-muted-foreground">
        <span>{[s.location, year].filter(Boolean).join(", ")}</span>
        <span className="flex items-center gap-1.5 font-hand text-[22px] tracking-normal text-pen">
          keep scrolling
          <svg viewBox="0 0 22 40" className="h-10 w-[22px] animate-bob" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3C9 14 13 22 11 35M4 28l7 8 7-8" /></svg>
        </span>
      </div>
    </Sheet>
  );
}
