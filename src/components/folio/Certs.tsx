import { useState } from "react";
import { Award } from "lucide-react";
import { Hand, Heading } from "./Pen";
import { Inner, Sheet, type Tone } from "./Sheet";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { Certification } from "@/data/types";

const INITIAL = 8;

export function Certs({ items, tone, prev }: { items: Certification[]; tone: Tone; prev?: Tone }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, INITIAL);
  return (
    <Sheet id="certifications" label="Certifications" tone={tone} prev={prev}>
      <Inner className="grid items-start gap-[clamp(32px,6vw,110px)] lg:grid-cols-[1fr_1.6fr]">
        <div className="lg:sticky lg:top-28">
          <Heading seed={17}>Certifications</Heading>
          <Hand className="mt-6 block max-w-[10em] -rotate-2 text-[clamp(22px,2.4vw,32px)]">{items.length} and counting</Hand>
        </div>
        <div>
          <ul>
            {shown.map((c) => (
              <li key={c.id ?? c.name} className="border-t border-border last:border-b">
                <HoverCard openDelay={120} closeDelay={60}>
                  <HoverCardTrigger asChild>
                    <a href={c.pdf_url ?? c.image_url ?? undefined} target="_blank" rel="noopener noreferrer" className="group grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 py-4">
                      <Hand className="text-[24px]">{c.year}</Hand>
                      <span>
                        <span className="block text-[clamp(14px,1.2vw,18px)] font-medium leading-snug decoration-pen decoration-2 underline-offset-4 group-hover:underline">{c.name.trim()}</span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">{c.issuer}</span>
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white p-1 ring-1 ring-border">
                        {c.logo_url ? <img src={c.logo_url} alt="" loading="lazy" className="h-full w-full object-contain" /> : <Award className="h-4 w-4 text-neutral-700" />}
                      </span>
                    </a>
                  </HoverCardTrigger>
                  {c.image_url && (
                    <HoverCardContent side="left" className="w-72 p-2">
                      <img src={c.image_url} alt={`${c.name} certificate`} loading="lazy" className="w-full rounded-sm" />
                    </HoverCardContent>
                  )}
                </HoverCard>
              </li>
            ))}
          </ul>
          {items.length > INITIAL && (
            <Button variant="outline" className="mt-8 rounded-full" onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${items.length}`}</Button>
          )}
        </div>
      </Inner>
    </Sheet>
  );
}
