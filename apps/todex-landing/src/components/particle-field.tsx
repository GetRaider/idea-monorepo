"use client";

import { useEffect, useRef } from "react";

/**
 * Animated silver dust. Particles drift along glowing curves, twinkle, move away from the
 * cursor and spring back; the field shifts slightly with the mouse.
 *
 * - `arc`: the hero — an ellipse limb from the top right to the left edge, plus a lower wave.
 * - `dunes`: the closing band — overlapping ridges of dust across the full width.
 *
 * Reduced motion renders one still frame with no pointer effects. The loop pauses when the
 * canvas is off screen.
 */

export type ParticleVariant = "arc" | "dunes";

type Stage = { width: number; height: number; stage: number };
type Point = [x: number, y: number];

type Curve = {
  start: number;
  end: number;
  fade: number;
  weight: number;
  alpha: number;
  speed: number;
  spread: number;
  glow: boolean;
  /** Share of particles scattered as a loose halo around the line (default 0.32). */
  haloShare?: number;
  /** Probability a halo particle sits on the normal's side, i.e. above a ridge (default 0.72). */
  haloSide?: number;
  point: (s: Stage, t: number) => Point;
};

type Particle = {
  curve: number;
  t: number;
  offset: number;
  speed: number;
  size: number;
  alpha: number;
  phase: number;
  twinkle: number;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
};

type Star = { fx: number; fy: number; size: number; alpha: number; phase: number; twinkle: number };

type Haze = { x: number; y: number; radius: number; alpha: number };

const POINTER_RADIUS = 150;

function arcCurves(width: number): Curve[] {
  const narrow = width < 640;
  return [
    {
      start: -0.2,
      end: Math.PI * 0.86,
      fade: 0.25,
      weight: 1,
      alpha: 1,
      speed: 1,
      spread: 1,
      glow: true,
      point: ({ width: w, stage }, t) => [
        w * (narrow ? 0.5 : 0.45) + w * (narrow ? 0.62 : 0.55) * Math.cos(t),
        stage * 0.04 + stage * 0.86 * Math.sin(t),
      ],
    },
    {
      start: -0.05,
      end: 0.62,
      fade: 0.12,
      weight: 0.4,
      alpha: 0.7,
      speed: 0.12,
      spread: 1.3,
      glow: false,
      point: ({ width: w, stage }, u) => [
        w * u,
        stage * (0.62 + 0.3 * Math.sin(Math.min(1, u / 0.62) * Math.PI * 0.5) + 0.03 * Math.sin(u * 9)),
      ],
    },
  ];
}

function duneCurves(): Curve[] {
  const ridge = (base: number, amplitude: number, frequency: number, phase: number) =>
    ({ width: w, stage }: Stage, u: number): Point => [
      w * u,
      stage * (base + amplitude * Math.sin(u * Math.PI * frequency + phase) + 0.025 * Math.sin(u * 11 + phase)),
    ];
  return [
    // Dust settles below each ridge, so the halo mostly falls on the lower side.
    { start: -0.05, end: 1.05, fade: 0.1, weight: 0.5, alpha: 1, speed: 0.35, spread: 2.4, glow: true, haloShare: 0.6, haloSide: 0.15, point: ridge(0.3, 0.17, 1.3, 0.4) },
    { start: -0.05, end: 1.05, fade: 0.1, weight: 0.6, alpha: 0.9, speed: 0.28, spread: 3.2, glow: true, haloShare: 0.65, haloSide: 0.15, point: ridge(0.5, 0.16, 1.05, 2.3) },
    { start: -0.05, end: 1.05, fade: 0.1, weight: 0.5, alpha: 0.75, speed: 0.22, spread: 3.8, glow: true, haloShare: 0.65, haloSide: 0.2, point: ridge(0.68, 0.12, 1.7, 1.0) },
  ];
}

function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Position plus unit normal, from a small step along the curve. */
function sample(curve: Curve, stage: Stage, t: number): [number, number, number, number] {
  const [x, y] = curve.point(stage, t);
  const [x2, y2] = curve.point(stage, t + 0.001);
  const tx = x2 - x;
  const ty = y2 - y;
  const length = Math.hypot(tx, ty) || 1;
  return [x, y, ty / length, -tx / length];
}

export function ParticleField({ variant = "arc", className = "" }: { variant?: ParticleVariant; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !container || !context) return;
    const ctx = context;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const glow = document.createElement("canvas");
    const glowCtx = glow.getContext("2d");

    let stage: Stage = { width: 0, height: 0, stage: 0 };
    let curves: Curve[] = [];
    let hazes: Haze[] = [];
    let dpr = 1;
    let particles: Particle[] = [];
    let stars: Star[] = [];
    let frame = 0;
    let running = false;
    let visible = true;
    let lastTime = 0;

    const pointer = { x: 0, y: 0, active: false, strength: 0 };
    const parallax = { x: 0, y: 0 };

    function makeParticle(curveIndex: number, baseSpread: number): Particle {
      const curve = curves[curveIndex]!;
      const spread = baseSpread * curve.spread;
      const halo = Math.random() < (curve.haloShare ?? 0.32);
      const outward = Math.random() < (curve.haloSide ?? 0.72) ? 1 : -1;
      const bright = Math.random() < 0.035;
      return {
        curve: curveIndex,
        t: curve.start + Math.random() * (curve.end - curve.start),
        offset: halo ? outward * Math.abs(gaussian()) * spread * 3.2 : gaussian() * spread * 0.55,
        speed: (0.006 + Math.random() * 0.018) * (Math.random() < 0.5 ? 1 : 0.6) * curve.speed,
        size: bright ? 1.6 + Math.random() * 1.4 : 0.5 + Math.random() * 1.1,
        alpha: (bright ? 0.85 : halo ? 0.18 + Math.random() * 0.35 : 0.35 + Math.random() * 0.55) * curve.alpha,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.6 + Math.random() * 2.6,
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
      };
    }

    function buildGlow() {
      if (!glowCtx) return;
      const { width, height } = stage;
      glow.width = Math.max(1, Math.round(width * dpr));
      glow.height = Math.max(1, Math.round(height * dpr));
      glowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      glowCtx.clearRect(0, 0, width, height);

      for (const haze of hazes) {
        const gradient = glowCtx.createRadialGradient(haze.x, haze.y, 0, haze.x, haze.y, haze.radius);
        gradient.addColorStop(0, `rgba(255,255,255,${haze.alpha})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        glowCtx.fillStyle = gradient;
        glowCtx.fillRect(0, 0, width, height);
      }

      const passes: Array<[number, number, number]> = [
        [70, 0.025, 40],
        [28, 0.045, 24],
        [8, 0.09, 10],
        [1.6, 0.35, 4],
      ];
      glowCtx.lineCap = "round";
      for (const curve of curves.filter((item) => item.glow)) {
        const steps = 220;
        for (const [lineWidth, alpha, blur] of passes) {
          glowCtx.save();
          glowCtx.strokeStyle = `rgba(235,235,240,${alpha * curve.alpha})`;
          glowCtx.lineWidth = lineWidth;
          glowCtx.shadowColor = "rgba(255,255,255,0.5)";
          glowCtx.shadowBlur = blur;
          glowCtx.beginPath();
          for (let index = 0; index <= steps; index += 1) {
            const t = curve.start + ((curve.end - curve.start) * index) / steps;
            const [x, y] = curve.point(stage, t);
            if (index === 0) glowCtx.moveTo(x, y);
            else glowCtx.lineTo(x, y);
          }
          glowCtx.stroke();
          glowCtx.restore();
        }
      }
    }

    function resize() {
      const rect = container!.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);

      const stageHeight = variant === "arc" ? Math.min(height, Math.max(560, width * 0.62)) : height;
      stage = { width, height, stage: stageHeight };
      curves = variant === "arc" ? arcCurves(width) : duneCurves();
      hazes =
        variant === "arc"
          ? [
              { x: width * 0.98, y: stageHeight * 0.12, radius: width * 0.38, alpha: 0.16 },
              { x: width * 0.1, y: stageHeight * 0.92, radius: width * 0.22, alpha: 0.1 },
            ]
          : [{ x: width * 0.55, y: stageHeight * 0.45, radius: width * 0.45, alpha: 0.07 }];

      const area = width * stageHeight;
      const total = Math.round(Math.min(2400, Math.max(600, area / (variant === "arc" ? 380 : 240))));
      const spread = Math.max(6, Math.min(16, width / 90));
      const weights = curves.reduce((sum, curve) => sum + curve.weight, 0);
      particles = curves.flatMap((curve, index) =>
        Array.from({ length: Math.round((total * curve.weight) / weights) }, () => makeParticle(index, spread)),
      );
      stars = Array.from({ length: Math.round(Math.min(140, Math.max(40, area / 9000))) }, () => ({
        fx: Math.random(),
        fy: Math.random() * 0.95,
        size: Math.random() < 0.15 ? 1.6 + Math.random() * 1.2 : 0.6 + Math.random() * 0.8,
        alpha: 0.25 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.4 + Math.random() * 1.8,
      }));

      buildGlow();
      if (reducedMotion.matches) draw(0, 0);
    }

    function drawSparkle(x: number, y: number, size: number, alpha: number) {
      ctx.globalAlpha = alpha;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      if (size > 1.5) {
        const arm = size * 3.2;
        ctx.globalAlpha = alpha * 0.45;
        ctx.fillRect(x - arm, y - 0.3, arm * 2, 0.6);
        ctx.fillRect(x - 0.3, y - arm, 0.6, arm * 2);
      }
    }

    function stepParticle(particle: Particle, x: number, y: number, dt: number, damping: number) {
      let ax = -particle.dx * 28;
      let ay = -particle.dy * 28;
      if (pointer.strength > 0.01) {
        const px = x + particle.dx - pointer.x;
        const py = y + particle.dy - pointer.y;
        const distanceSq = px * px + py * py;
        if (distanceSq < POINTER_RADIUS * POINTER_RADIUS && distanceSq > 0.01) {
          const distance = Math.sqrt(distanceSq);
          const falloff = 1 - distance / POINTER_RADIUS;
          const force = falloff * falloff * 2600 * pointer.strength;
          ax += (px / distance) * force;
          ay += (py / distance) * force;
        }
      }
      particle.vx = (particle.vx + ax * dt) * damping;
      particle.vy = (particle.vy + ay * dt) * damping;
      particle.dx += particle.vx * dt;
      particle.dy += particle.vy * dt;
    }

    function pointerBoost(x: number, y: number): number {
      if (pointer.strength < 0.01) return 0;
      const distance = Math.hypot(x - pointer.x, y - pointer.y);
      return distance < POINTER_RADIUS * 1.4 ? (1 - distance / (POINTER_RADIUS * 1.4)) * 0.6 * pointer.strength : 0;
    }

    function draw(time: number, dt: number) {
      const { width, height } = stage;
      const animate = dt > 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (animate) {
        const targetX = pointer.active ? (pointer.x / width - 0.5) * -14 : 0;
        const targetY = pointer.active ? (pointer.y / stage.stage - 0.5) * -10 : 0;
        parallax.x += (targetX - parallax.x) * Math.min(1, dt * 3);
        parallax.y += (targetY - parallax.y) * Math.min(1, dt * 3);
        pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * Math.min(1, dt * 4);
      }
      const damping = animate ? Math.pow(0.04, dt) : 1;

      ctx.save();
      ctx.translate(parallax.x, parallax.y);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.85 + 0.15 * Math.sin(time * 0.6);
      ctx.drawImage(glow, 0, 0, width, height);

      if (pointer.strength > 0.01) {
        const cx = pointer.x - parallax.x;
        const cy = pointer.y - parallax.y;
        const light = ctx.createRadialGradient(cx, cy, 0, cx, cy, 240);
        light.addColorStop(0, `rgba(255,255,255,${0.07 * pointer.strength})`);
        light.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = light;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.fillStyle = "#f4f4f5";

      for (const star of stars) {
        const shimmer = 0.35 + 0.65 * Math.max(0, Math.sin(time * star.twinkle + star.phase));
        drawSparkle(star.fx * width, star.fy * stage.stage, star.size, star.alpha * shimmer);
      }

      for (const particle of particles) {
        const curve = curves[particle.curve]!;
        if (animate) {
          particle.t += particle.speed * dt;
          if (particle.t > curve.end) particle.t = curve.start;
        }
        const [bx, by, nx, ny] = sample(curve, stage, particle.t);
        const x = bx + nx * particle.offset;
        const y = by + ny * particle.offset;
        if (animate) stepParticle(particle, x, y, dt, damping);
        const fade = Math.max(0, Math.min(1, (particle.t - curve.start) / curve.fade, (curve.end - particle.t) / curve.fade));
        const shimmer = 0.55 + 0.45 * Math.sin(time * particle.twinkle + particle.phase);
        const px = x + particle.dx;
        const py = y + particle.dy;
        drawSparkle(px, py, particle.size, Math.min(1, particle.alpha * shimmer * fade + pointerBoost(px, py) * fade));
      }

      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    function loop(now: number) {
      const time = now / 1000;
      const dt = lastTime ? Math.min(0.05, time - lastTime) : 1 / 60;
      lastTime = time;
      draw(time, dt);
      frame = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reducedMotion.matches || !visible) return;
      running = true;
      lastTime = 0;
      frame = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const rect = canvas!.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = pointer.y >= 0 && pointer.y <= rect.height && pointer.x >= 0 && pointer.x <= rect.width;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    function onMotionChange() {
      stop();
      if (reducedMotion.matches) {
        pointer.active = false;
        pointer.strength = 0;
        parallax.x = 0;
        parallax.y = 0;
        draw(0, 0);
      } else {
        start();
      }
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });
    intersectionObserver.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    reducedMotion.addEventListener("change", onMotionChange);
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, [variant]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
