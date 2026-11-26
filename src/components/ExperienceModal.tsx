import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Experience } from "@/data/types";

export const ExperienceModal = ({ experience, onClose }: { experience: Experience | null; onClose: () => void }) => {
  const [i, setI] = useState(0);
  const imgs = experience?.images ?? [];
  const go = (d: number) => setI((p) => (p + d + imgs.length) % imgs.length);

  return (
    <Dialog open={!!experience} onOpenChange={(o) => { if (!o) { onClose(); setI(0); } }}>
      <DialogContent className="max-w-2xl">
        {experience && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-3xl font-normal">{experience.title}</DialogTitle>
              <DialogDescription>{experience.organization} · {experience.period}</DialogDescription>
            </DialogHeader>
            <p className="text-sm leading-relaxed text-muted-foreground">{experience.description}</p>
            {imgs.length > 0 && (
              <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
                <img src={imgs[i]} alt={`${experience.title} photo ${i + 1}`} className="aspect-video w-full object-cover" />
                {imgs.length > 1 && (
                  <>
                    <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => go(1)} aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2"><ChevronRight className="h-4 w-4" /></button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
