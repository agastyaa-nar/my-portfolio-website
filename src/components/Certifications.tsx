import { useState } from "react";
import { Award, ExternalLink } from "lucide-react";
import { useCertifications } from "@/hooks/useContent";

const INITIAL = 6;

export const Certifications = () => {
  const { data: certs = [] } = useCertifications();
  const [all, setAll] = useState(false);
  if (!certs.length) return null;
  const shown = all ? certs : certs.slice(0, INITIAL);

  return (
    <section id="certifications" className="py-20 sm:py-28">
      <div className="container max-w-5xl">
        <p className="eyebrow mb-3">Credentials</p>
        <h2 className="section-title mb-12">Certifications</h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <a key={c.id ?? c.name} href={c.pdf_url ?? c.image_url ?? "#"} target="_blank" rel="noopener noreferrer" className="card-surface group flex flex-col p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white p-1.5 ring-1 ring-border">
                  {c.logo_url ? <img src={c.logo_url} alt={c.issuer} className="h-full w-full object-contain" /> : <Award className="h-5 w-5 text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{c.name.trim()}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{c.issuer} · {c.year}</p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              {c.image_url && (
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                  <img src={c.image_url} alt={`${c.name} certificate`} loading="lazy" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </a>
          ))}
        </div>

        {certs.length > INITIAL && (
          <div className="mt-8 text-center">
            <button onClick={() => setAll(!all)} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary">
              {all ? "Show fewer" : `Show all ${certs.length}`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
