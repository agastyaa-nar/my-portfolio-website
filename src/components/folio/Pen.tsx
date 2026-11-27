import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { arrow, box, oval, parseMarks, underline, underlineMorph, type Pt } from "@/lib/pen";

/** Size of an element, kept up to date. Used to fit a pen mark to the text it surrounds. */
export function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, set] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => set({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el); set({ w: el.offsetWidth, h: el.offsetHeight });
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

const draw = (reduce: boolean | null, delay = 0, duration = 0.9) => ({
  initial: reduce ? false : { pathLength: 0, opacity: 0 },
  whileInView: { pathLength: 1, opacity: 1 },
  viewport: { once: true, margin: "-8% 0px" },
  transition: { duration, delay, ease: [0.6, 0, 0.2, 1] as const, opacity: { duration: 0.01, delay } },
});

const inkStyle = { fill: "none", stroke: "hsl(var(--pen))", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Wraps children and draws a pen mark (oval, underline or box) around them as they scroll into view. */
export function PenMark({ kind, seed = 1, delay = 0, padX = 10, padY = 6, block, className, children }: {
  block?: boolean;
  kind: "oval" | "under" | "box"; seed?: number; delay?: number; padX?: number; padY?: number; className?: string; children: ReactNode;
}) {
  const [ref, { w, h }] = useBox<HTMLSpanElement>();
  const reduce = useReducedMotion();
  const px = kind === "under" ? 0 : padX, py = kind === "under" ? 4 : padY;
  const W = w + px * 2, H = h + py * 2;
  const d = kind === "oval" ? oval(W, H, seed) : kind === "box" ? box(W, H, seed) : underline(W, H, seed);
  return (
    <span ref={ref} className={`relative ${block ? "block" : "inline-block"} ${className ?? ""}`}>
      {children}
      {w > 0 && (
        <svg aria-hidden className="pointer-events-none absolute overflow-visible" style={{ left: -px, top: -py, width: W, height: H }}>
          <motion.path d={d} style={inkStyle} {...draw(reduce, delay)} />
        </svg>
      )}
    </span>
  );
}

/** Renders "plain *underlined* and [circled]" with the matching pen marks. */
export function Marked({ text, seed = 1 }: { text: string; seed?: number }) {
  return (
    <>
      {parseMarks(text).map((m, i) =>
        m.mark ? <PenMark key={i} kind={m.mark} seed={seed + i * 3} delay={0.15 * i} padX={m.mark === "oval" ? 12 : 0}>{m.text}</PenMark> : <span key={i}>{m.text}</span>,
      )}
    </>
  );
}

/** A curved hand-drawn arrow. Coordinates are in the parent SVG's own units. */
export function Arrow({ a, b, bend = 0.2, delay = 0, head = 9 }: { a: Pt; b: Pt; bend?: number; delay?: number; head?: number }) {
  const reduce = useReducedMotion();
  const { shaft, head: h } = arrow(a, b, bend, head);
  return (
    <g>
      <motion.path d={shaft} style={inkStyle} {...draw(reduce, delay, 0.7)} />
      <motion.path d={h} style={inkStyle} {...draw(reduce, delay + 0.6, 0.25)} />
    </g>
  );
}

/** Handwriting that "writes itself" left to right. */
export function WriteIn({ children, delay = 0, duration = 1.1, className }: { children: ReactNode; delay?: number; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={`inline-block ${className ?? ""}`}
      initial={reduce ? false : { clipPath: "inset(-10% 100% -20% -2%)" }}
      whileInView={{ clipPath: "inset(-10% -2% -20% -2%)" }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration, delay, ease: "easeInOut" }}
    >
      {children}
    </motion.span>
  );
}

/** Big serif heading whose underline morphs from a zig-zag into a swoosh as it scrolls in. */
export function Heading({ children, seed = 1, as: Tag = "h2", className = "" }: { children: ReactNode; seed?: number; as?: "h1" | "h2"; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "start 0.55"] });
  const { from, to } = underlineMorph(300, seed);
  const d = useTransform(scrollYProgress, [0, 1], [from, to]);
  return (
    <div ref={ref} className="inline-block">
      <Tag className={`font-display text-[clamp(3.4rem,8.6vw,9rem)] leading-[0.92] tracking-[-0.012em] ${className}`}>{children}</Tag>
      <svg aria-hidden viewBox="0 0 300 26" className="mt-1 block h-auto w-[min(70%,320px)] overflow-visible">
        <motion.path d={reduce ? to : d} style={{ ...inkStyle, strokeWidth: 2.2 }} />
      </svg>
    </div>
  );
}

/** A handwritten word or phrase in the pen colour. */
export const Hand = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span className={`font-hand font-medium leading-[1.02] text-pen ${className}`}>{children}</span>
);
