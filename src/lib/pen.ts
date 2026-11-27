// Procedural "pen" geometry. Every shape comes from a seed, so it looks
// hand-made but is identical on every render (no hydration or flicker issues).
export type Pt = [number, number];

export function rng(seed: number) {
  let s = (Math.floor(seed * 9973) ^ 0x9e3779b9) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => String(Math.round(n * 10) / 10);

/** Smooth curve through points (Catmull-Rom converted to cubic Béziers). */
export function curve(pts: Pt[]): string {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i - 1] ?? pts[i], b = pts[i], c = pts[i + 1], e = pts[i + 2] ?? c;
    d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`;
  }
  return d;
}

/** A loop around a w×h box: slightly more than one turn, never quite closed. */
export function oval(w: number, h: number, seed: number): string {
  const R = rng(seed), n = 30;
  const rx = Math.max(4, w / 2 - 3), ry = Math.max(4, h / 2 - 3);
  const start = -2.5 + R() * 0.6, sweep = Math.PI * 2 * (1.1 + R() * 0.08);
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = start + sweep * t, k = 1.04 - 0.09 * t + (R() - 0.5) * 0.03;
    pts.push([w / 2 + Math.cos(a) * rx * k, h / 2 + Math.sin(a) * ry * k + (t - 0.5) * 2]);
  }
  return curve(pts);
}

/** A quick underline with a short return stroke. */
export function underline(w: number, h: number, seed: number): string {
  const R = rng(seed), y = h - 4, n = 8, pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push([2 + ((w - 4) * i) / n, y + Math.sin(i * 1.3 + R() * 2) * 1.4 - i * 0.25]);
  const end = pts[n], back = 0.35 + R() * 0.25;
  return `${curve(pts)}Q${f(end[0] + 3)} ${f(end[1] + 1.5)} ${f(end[0] - 6)} ${f(y + 2.6)}L${f(w * (1 - back))} ${f(y + 3.2 + R())}`;
}

/** A loose rectangle drawn in four strokes whose corners overshoot. */
export function box(w: number, h: number, seed: number): string {
  const R = rng(seed), j = () => (R() - 0.5) * 4, o = 6;
  return `M${f(-o + j())} ${f(2 + j())}L${f(w + o + j())} ${f(j())}M${f(w - 2 + j())} ${f(-o + j())}L${f(w + j())} ${f(h + o + j())}M${f(w + o + j())} ${f(h - 2 + j())}L${f(-o + j())} ${f(h + j())}M${f(2 + j())} ${f(h + o + j())}L${f(j())} ${f(-o + j())}`;
}

/** Curved arrow from a to b, bent sideways by `bend` × its length. */
export function arrow(a: Pt, b: Pt, bend = 0.2, head = 9) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  const c: Pt = [(a[0] + b[0]) / 2 - (dy / len) * len * bend, (a[1] + b[1]) / 2 + (dx / len) * len * bend];
  const ang = Math.atan2(b[1] - c[1], b[0] - c[0]);
  const h1: Pt = [b[0] - Math.cos(ang - 0.5) * head, b[1] - Math.sin(ang - 0.5) * head];
  const h2: Pt = [b[0] - Math.cos(ang + 0.5) * head, b[1] - Math.sin(ang + 0.5) * head];
  return {
    shaft: `M${f(a[0])} ${f(a[1])}Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`,
    head: `M${f(h1[0])} ${f(h1[1])}L${f(b[0])} ${f(b[1])}L${f(h2[0])} ${f(h2[1])}`,
  };
}

/** Heading underline: a nervous zig-zag that relaxes into a swoosh. Same point count, so it can be interpolated. */
export function underlineMorph(w: number, seed: number) {
  const R = rng(seed), n = 14, zig: Pt[] = [], swoosh: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    zig.push([4 + (w - 8) * t, 13 + (i % 2 ? -7 : 7) * (0.6 + R() * 0.5)]);
    swoosh.push([4 + (w - 8) * t, 16 - Math.sin(t * Math.PI) * 6 - t * 4]);
  }
  return { from: curve(zig), to: curve(swoosh) };
}

export const sparkle = "M0 -10C1 -3 3 -1 10 0C3 1 1 3 0 10C-1 3 -3 1 -10 0C-3 -1 -1 -3 0 -10Z";
export const heart = "M0 -3.5C2 -9 10 -8 10 -2C10 3 4 6.5 0 10C-4 6.5 -10 3 -10 -2C-10 -8 -2 -9 0 -3.5Z";

export type Mark = { text: string; mark: "" | "under" | "oval" };

/** "plain *underlined* and [circled]" → runs. Unclosed markers stay literal. */
export function parseMarks(s: string): Mark[] {
  const out: Mark[] = [], re = /\*([^*]+)\*|\[([^\]]+)\]/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), mark: "" });
    out.push(m[1] != null ? { text: m[1], mark: "under" } : { text: m[2], mark: "oval" });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), mark: "" });
  return out;
}
