import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

export type Tone = "paper" | "night";

/** One printed page. Night sheets that follow paper grow from a rounded card into full bleed. */
export function Sheet({ id, label, tone, prev, children, className = "" }: {
  id: string; label: string; tone: Tone; prev?: Tone; children: ReactNode; className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const grow = tone === "night" && prev === "paper";
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.3"] });
  const radius = useTransform(scrollYProgress, [0, 1], [64, 0]);
  const inset = useTransform(scrollYProgress, [0, 1], [24, 0]);

  return (
    <section ref={ref} id={id} data-sheet={label} className={grow ? "bg-[hsl(48_12%_91.6%)]" : ""}>
      <motion.div
        style={grow ? { borderRadius: radius, marginInline: inset } : undefined}
        className={`${tone === "night" ? "night" : ""} grain relative isolate flex min-h-screen flex-col justify-center overflow-x-clip bg-background px-[clamp(18px,5.2vw,92px)] py-[clamp(76px,8vw,130px)] text-foreground ${className}`}
      >
        {children}
      </motion.div>
    </section>
  );
}

export const Inner = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-[1500px] ${className}`}>{children}</div>
);
