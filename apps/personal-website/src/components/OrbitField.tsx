"use client";

import { useEffect, useRef } from "react";

/**
 * Hero backdrop: amber dust orbiting on tilted rings around the headline, over a twinkling
 * starfield (the look of the AP mark). Inner rings turn faster than outer ones; the far half of
 * each ring is dimmer, so the system reads in depth. The ring plane tilts toward the cursor, and
 * stars near the cursor link up into a small constellation.
 *
 * Reduced motion renders one still frame with no pointer effects. The loop pauses off screen.
 */

const AMBER = "255,190,120";
const WARM_WHITE = "255,236,214";
const RINGS = [
  { radius: 0.34, count: 0.18, speed: 1, spread: 0.008 },
  { radius: 0.5, count: 0.26, speed: 0.62, spread: 0.012 },
  { radius: 0.68, count: 0.3, speed: 0.4, spread: 0.016 },
  { radius: 0.9, count: 0.26, speed: 0.26, spread: 0.028 },
];
const LINK_RADIUS = 130;

export function OrbitField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !container || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let dust: Dust[] = [];
    let stars: Star[] = [];
    let frame = 0;
    let running = false;
    let visible = true;
    let last = 0;
    const pointer = { x: 0, y: 0, active: false, tiltX: 0, tiltY: 0 };

    function resize() {
      const rect = container!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const total = Math.round(
        Math.min(1400, Math.max(420, (width * height) / 900)),
      );
      dust = RINGS.flatMap((ring, ringIndex) =>
        Array.from({ length: Math.round(total * ring.count) }, () => ({
          ring: ringIndex,
          angle: Math.random() * Math.PI * 2,
          offset: gaussian() * ring.spread,
          lift: gaussian() * ring.spread * 0.6,
          size:
            Math.random() < 0.08
              ? 1.6 + Math.random() * 1.2
              : 0.5 + Math.random() * 0.9,
          alpha: 0.35 + Math.random() * 0.65,
          phase: Math.random() * Math.PI * 2,
        })),
      );
      stars = Array.from(
        { length: Math.round((width * height) / 9000) },
        () => ({
          x: Math.random(),
          y: Math.random(),
          size: Math.random() < 0.1 ? 1.4 : 0.6 + Math.random() * 0.5,
          alpha: 0.2 + Math.random() * 0.6,
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.4 + Math.random() * 1.4,
        }),
      );
      if (reducedMotion.matches) draw(0, 0);
    }

    function drawSparkle(x: number, y: number, size: number, alpha: number) {
      ctx!.strokeStyle = `rgba(${WARM_WHITE},${alpha})`;
      ctx!.lineWidth = 0.6;
      ctx!.beginPath();
      ctx!.moveTo(x - size * 3, y);
      ctx!.lineTo(x + size * 3, y);
      ctx!.moveTo(x, y - size * 3);
      ctx!.lineTo(x, y + size * 3);
      ctx!.stroke();
    }

    function draw(time: number, dt: number) {
      ctx!.clearRect(0, 0, width, height);
      const t = time / 1000;
      const scale = Math.max(width, 720) * 0.62;
      const cx = width / 2;
      const cy = height * 0.44;

      pointer.tiltX +=
        ((pointer.active ? (pointer.x - cx) / width : 0) - pointer.tiltX) *
        0.04;
      pointer.tiltY +=
        ((pointer.active ? (pointer.y - cy) / height : 0) - pointer.tiltY) *
        0.04;
      const tilt = -0.2 + pointer.tiltX * 0.12;
      const squash = 0.3 + pointer.tiltY * 0.08;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      // Sunset core behind the headline.
      const core = ctx!.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.55);
      core.addColorStop(0, `rgba(${AMBER},0.10)`);
      core.addColorStop(1, `rgba(${AMBER},0)`);
      ctx!.fillStyle = core;
      ctx!.fillRect(0, 0, width, height);

      // Faint orbit paths, so the rings read as a system even where dust is sparse.
      ctx!.lineWidth = 1;
      for (const ring of RINGS) {
        const r = ring.radius * scale;
        ctx!.strokeStyle = `rgba(${AMBER},0.07)`;
        ctx!.beginPath();
        ctx!.ellipse(cx, cy, r, r * squash, tilt, 0, Math.PI * 2);
        ctx!.stroke();
      }

      // Starfield; stars near the pointer link into a constellation.
      const near: [number, number][] = [];
      for (const star of stars) {
        const x = star.x * width;
        const y = star.y * height;
        const glow = 0.55 + 0.45 * Math.sin(t * star.twinkle + star.phase);
        const alpha = star.alpha * glow;
        ctx!.fillStyle = `rgba(${WARM_WHITE},${alpha})`;
        ctx!.fillRect(x, y, star.size, star.size);
        if (star.size > 1.2 && glow > 0.92)
          drawSparkle(x, y, star.size, alpha * 0.6);
        if (
          pointer.active &&
          Math.hypot(x - pointer.x, y - pointer.y) < LINK_RADIUS
        )
          near.push([x, y]);
      }
      if (near.length > 1) {
        ctx!.lineWidth = 0.6;
        for (let i = 0; i < near.length; i++) {
          const [ax, ay] = near[i]!;
          const [bx, by] = near[(i + 1) % near.length]!;
          const fade =
            1 - Math.hypot(ax - pointer.x, ay - pointer.y) / LINK_RADIUS;
          ctx!.strokeStyle = `rgba(${AMBER},${0.35 * fade})`;
          ctx!.beginPath();
          ctx!.moveTo(ax, ay);
          ctx!.lineTo(bx, by);
          ctx!.stroke();
        }
      }

      // Orbiting dust: inner rings faster, far half dimmer and smaller.
      for (const particle of dust) {
        const ring = RINGS[particle.ring]!;
        particle.angle += dt * 0.00012 * ring.speed;
        const r = (ring.radius + particle.offset) * scale;
        const ex = Math.cos(particle.angle) * r;
        const ey =
          Math.sin(particle.angle) * r * squash + particle.lift * scale;
        const x = cx + ex * cosT - ey * sinT;
        const y = cy + ex * sinT + ey * cosT;
        if (x < -4 || x > width + 4 || y < -4 || y > height + 4) continue;
        const depth = 0.5 + 0.5 * Math.sin(particle.angle); // 1 = near side
        const flicker = 0.75 + 0.25 * Math.sin(t * 2 + particle.phase);
        const alpha = Math.min(1, particle.alpha * flicker * (0.35 + 0.9 * depth));
        const size = particle.size * (0.7 + 0.5 * depth);
        ctx!.fillStyle =
          depth > 0.6
            ? `rgba(${WARM_WHITE},${alpha})`
            : `rgba(${AMBER},${alpha})`;
        ctx!.beginPath();
        ctx!.arc(x, y, size, 0, Math.PI * 2);
        ctx!.fill();
        if (particle.size > 1.6 && depth > 0.85)
          drawSparkle(x, y, size * 0.8, alpha * 0.5);
      }
    }

    function loop(now: number) {
      const dt = last ? Math.min(now - last, 50) : 16;
      last = now;
      draw(now, dt);
      frame = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reducedMotion.matches || !visible) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = pointer.y >= 0 && pointer.y <= rect.height;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    function onMotionChange() {
      if (reducedMotion.matches) {
        stop();
        draw(0, 0);
      } else {
        start();
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });
    intersectionObserver.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    reducedMotion.addEventListener("change", onMotionChange);
    resize();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  );
}

function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

type Dust = {
  ring: number;
  angle: number;
  offset: number;
  lift: number;
  size: number;
  alpha: number;
  phase: number;
};

type Star = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  phase: number;
  twinkle: number;
};
