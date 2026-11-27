import { useEffect, useRef, type RefObject } from "react";

/** A fading pen line that follows the pointer across the cover. Off for touch and reduced motion. */
export function InkTrail({ target }: { target: RefObject<HTMLElement> }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = target.current, cv = canvas.current;
    if (!host || !cv) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
    const ctx = cv.getContext("2d")!;
    const pts: { x: number; y: number; t: number }[] = [];
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const fit = () => { cv.width = host.clientWidth * dpr; cv.height = host.clientHeight * dpr; };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(host);
    const pen = `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--pen").trim()})`;
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pts.push({ x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr, t: performance.now() });
    };
    host.addEventListener("pointermove", move);
    let raf = 0;
    const loop = (now: number) => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      while (pts.length && now - pts[0].t > 800) pts.shift();
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = pen;
      for (let i = 1; i < pts.length; i++) {
        const age = (now - pts[i].t) / 800;
        ctx.globalAlpha = Math.max(0, 1 - age); ctx.lineWidth = (2.6 - age * 1.6) * dpr;
        ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); host.removeEventListener("pointermove", move); };
  }, [target]);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 z-[3] h-full w-full" />;
}
