import { useEffect, useState } from "react";
import { motion, useScroll } from "motion/react";
import { PenMark } from "./Pen";
import { Sheet as Drawer, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export type TocItem = { id: string; label: string };

/** Thin top bar that inverts over light and dark sheets, with a progress line and a contents page. */
export function Chrome({ year, name, docLabel = "Curriculum Vitae", items }: { year: string; name: string; docLabel?: string; items: TocItem[] }) {
  const { scrollYProgress } = useScroll();
  const [current, setCurrent] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-sheet]")];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setCurrent((e.target as HTMLElement).dataset.sheet ?? "")),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  const jump = (id: string) => {
    setOpen(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 250);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 text-white mix-blend-difference">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-[clamp(18px,5.2vw,92px)] pb-3.5 pt-4 text-xs tracking-[0.06em]">
        <span>{year}</span>
        <Drawer open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="pointer-events-auto px-3 py-1 hover:opacity-80">{docLabel}</button>
          </SheetTrigger>
          <SheetContent side="top" className="h-[100svh] border-0 bg-background px-[clamp(18px,5.2vw,92px)] pt-20 text-foreground">
            <SheetTitle className="font-hand text-3xl font-medium text-pen">Contents</SheetTitle>
            <SheetDescription className="sr-only">Jump to a section of the portfolio</SheetDescription>
            <ol className="mt-6 grid gap-1 md:grid-cols-2">
              {items.map((it, i) => (
                <li key={it.id}>
                  <button onClick={() => jump(it.id)} className="group flex items-baseline gap-4 py-1 text-left font-display text-[clamp(2rem,4.2vw,4.25rem)] leading-[1.04]">
                    <small className="min-w-[2.2ch] font-hand text-[0.38em] text-pen">{String(i + 1).padStart(2, "0")}</small>
                    <span className="relative">{it.label}<span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-pen transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100" /></span>
                  </button>
                </li>
              ))}
            </ol>
          </SheetContent>
        </Drawer>
        <span className="flex items-baseline justify-self-end gap-3">
          <span className="hidden sm:inline">{name}</span>
          <span className="min-w-[5ch] text-right font-hand text-[19px] tracking-normal">{current}</span>
        </span>
      </div>
      <motion.div style={{ scaleX: scrollYProgress }} className="absolute inset-x-0 bottom-0 h-px origin-left bg-white opacity-60" />
    </header>
  );
}
