import { motion, useReducedMotion } from "motion/react";
import { Arrow, Hand, Heading, Marked, PenMark } from "./Pen";
import { Inner, Sheet, type Tone } from "./Sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { Portrait } from "./Portrait";
import type { Settings } from "@/data/types";

// Where each trait word sits (viewBox 500×520) and the point its arrow aims at.
const SLOTS: { at: [number, number]; to: [number, number]; bend: number }[] = [
  { at: [58, 56], to: [150, 130], bend: 0.25 },
  { at: [442, 44], to: [352, 118], bend: -0.25 },
  { at: [38, 262], to: [132, 258], bend: 0.2 },
  { at: [462, 250], to: [370, 256], bend: -0.2 },
  { at: [80, 486], to: [160, 418], bend: -0.25 },
  { at: [428, 488], to: [342, 418], bend: 0.25 },
];

export function Hello({ s, tone, prev }: { s: Settings; tone: Tone; prev?: Tone }) {
  const reduce = useReducedMotion();
  const traits = (s.traits ?? []).slice(0, 6);

  return (
    <Sheet id="hello" label="Hello" tone={tone} prev={prev}>
      <Inner className="grid items-center gap-[clamp(32px,6vw,110px)] md:grid-cols-2">
        <div>
          <Heading seed={3} className="text-[clamp(4rem,10.5vw,11.25rem)]">{s.greeting || "Hello!"}</Heading>
          <p className="mt-[clamp(18px,2.4vw,34px)] max-w-[52ch] whitespace-pre-line text-[clamp(14px,1.15vw,17px)] leading-[1.8]">
            <Marked text={s.bio} seed={4} />
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full"><a href="#contact">Say hello</a></Button>
            {s.cv_url && (
              <Dialog>
                <DialogTrigger asChild><Button size="lg" variant="outline" className="rounded-full">View CV</Button></DialogTrigger>
                <DialogContent className="flex h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0">
                  <DialogHeader className="flex-row items-center justify-between border-b px-4 py-3">
                    <div><DialogTitle className="text-base">Curriculum Vitae</DialogTitle><DialogDescription className="sr-only">Preview of the CV</DialogDescription></div>
                    <Button asChild size="sm" className="mr-8"><a href={s.cv_url} download><Download className="mr-2 h-4 w-4" />Download</a></Button>
                  </DialogHeader>
                  <iframe src={s.cv_url} title="CV preview" className="h-full w-full flex-1" />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {s.photo_url && (
          <div className="px-8 md:px-0"><div className="relative mx-auto aspect-[500/520] w-full max-w-[560px]">
            <svg aria-hidden viewBox="0 0 500 520" className="absolute inset-0 h-full w-full overflow-visible">
              {traits.map((_, i) => <Arrow key={i} a={SLOTS[i].at.map((v, k) => v + (k ? 16 : (SLOTS[i].to[0] > SLOTS[i].at[0] ? 46 : -46))) as [number, number]} b={SLOTS[i].to} bend={SLOTS[i].bend} delay={0.4 + i * 0.15} head={8} />)}
            </svg>
            {traits.map((t, i) => (
              <motion.span key={t} initial={reduce ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap" style={{ left: `${SLOTS[i].at[0] / 5}%`, top: `${SLOTS[i].at[1] / 5.2}%` }}>
                <Hand className="text-[clamp(17px,1.9vw,27px)]">{t}</Hand>
              </motion.span>
            ))}
            <div className="group absolute left-[27%] top-[17%] h-[66%] w-[46%]">
              <PenMark kind="box" seed={2} padX={7} padY={7} block className="h-full w-full">
                <PenMark kind="box" seed={9} padX={14} padY={14} block className="h-full w-full">
                  <div className="h-full w-full overflow-hidden rounded-[4px] bg-muted grayscale contrast-105 transition duration-700 group-hover:grayscale-0 [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-[1.04]"><Portrait src={s.photo_url} crop={s.photo_crop} alt={`Portrait of ${s.full_name}`} /></div>
                </PenMark>
              </PenMark>
            </div>
          </div></div>
        )}
      </Inner>
    </Sheet>
  );
}
