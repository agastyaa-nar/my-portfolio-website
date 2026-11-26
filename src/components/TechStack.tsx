import { useTechStack } from "@/hooks/useContent";

export const TechStack = () => {
  const { data: items = [] } = useTechStack();
  if (!items.length) return null;

  // Repeat the list until one copy is wide enough, then double it for a seamless loop.
  const base = Array.from({ length: Math.max(1, Math.ceil(16 / items.length)) }, () => items).flat();
  const loop = [...base, ...base];

  return (
    <section className="border-y border-border bg-secondary/40 py-16 sm:py-20" aria-label="Tech stack">
      <div className="container mb-10 max-w-5xl">
        <p className="eyebrow mb-3">Toolbox</p>
        <h2 className="section-title">Tech stack</h2>
      </div>
      <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max animate-scroll-left gap-12 pr-12 group-hover:[animation-play-state:paused]">
          {loop.map((t, i) => (
            <img key={`${t.name}-${i}`} src={t.logo_url} alt={t.name} title={t.name} loading="lazy"
              className="h-10 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 sm:h-12" />
          ))}
        </div>
      </div>
    </section>
  );
};
