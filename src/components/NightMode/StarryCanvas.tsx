import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  radius: number;
  twinkleSpeed: number;
  twinklePhase: number;
};

type Comet = {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  active: boolean;
};

type StarryCanvasProps = {
  isVisible: boolean;
};

const STAR_COUNT = 150;
const COMET_SPAWN_CHANCE = 0.002;

/**
 * Starry night canvas overlay.
 *
 * Performance design:
 * - No per-frame gradient allocations: star glow replaced with plain arc,
 *   comet trail uses a fixed strokeStyle + globalAlpha instead of
 *   createLinearGradient / createRadialGradient every frame.
 * - ctx.globalAlpha used for twinkling opacity; fillStyle set once per frame
 *   for all 150 stars — no template-string allocations inside the hot path.
 * - ResizeObserver + getBoundingClientRect replaces window resize listener
 *   + offsetWidth (which forced a layout reflow).
 * - Canvas init (stars, resize) runs once on mount. isVisible only
 *   starts/stops the rAF loop via refs — no star re-generation on toggle.
 */
export const StarryCanvas = ({ isVisible }: StarryCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const cometRef = useRef<Comet>({
    x: 0,
    y: 0,
    speed: 3,
    length: 100,
    opacity: 0,
    active: false,
  });
  const rafIdRef = useRef(0);
  const isVisibleRef = useRef(isVisible);

  // Refs to start/stop functions so the isVisible effect can call them
  // without triggering a full canvas re-initialization.
  const startLoopRef = useRef<() => void>(() => {});
  const stopLoopRef = useRef<() => void>(() => {});

  // ── Sync isVisible → start/stop loop without re-mounting canvas ──────────
  useEffect(() => {
    isVisibleRef.current = isVisible;
    if (isVisible) {
      startLoopRef.current();
    } else {
      stopLoopRef.current();
    }
  }, [isVisible]);

  // ── One-time canvas setup ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Star generation ───────────────────────────────────────────────────
    const initStars = () => {
      const w = canvas.width;
      const h = canvas.height;
      starsRef.current = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        starsRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 1.5 + 0.5,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    // ── Resize — getBoundingClientRect avoids forced reflow ───────────────
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
      initStars();
    };

    // ── Comet spawn ───────────────────────────────────────────────────────
    const spawnComet = () => {
      if (cometRef.current.active) return;
      const comet = cometRef.current;
      comet.active = true;
      comet.opacity = 1;
      comet.x = Math.random() * canvas.width;
      comet.y = 0;
      comet.speed = Math.random() * 2 + 2;
      comet.length = Math.random() * 50 + 80;
    };

    // ── Draw star — plain arc, opacity via globalAlpha (no gradient) ──────
    const drawStar = (star: Star) => {
      star.twinklePhase += star.twinkleSpeed;
      ctx.globalAlpha = ((Math.sin(star.twinklePhase) + 1) / 2) * 0.8;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill(); // fillStyle="#ffffff" set once per frame before the loop
    };

    // ── Draw comet — tapered polygon tail + multi-circle head glow ────────
    // Achieves the same visual as gradient-based approach with zero
    // per-frame gradient allocations.
    const drawComet = () => {
      const comet = cometRef.current;
      if (!comet.active) return;

      comet.x += comet.speed * 0.7;
      comet.y += comet.speed;
      comet.opacity -= 0.005;

      if (comet.opacity <= 0 || comet.y > canvas.height) {
        comet.active = false;
        return;
      }

      // Tail tip coords
      const tipX = comet.x - comet.length * 0.7;
      const tipY = comet.y - comet.length;

      // Normal vector perpendicular to the tail direction
      const dx = tipX - comet.x;
      const dy = tipY - comet.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len;
      const ny = dx / len;
      const headHalfW = 2.5; // half-width at the head end of tail

      // Outer glow tail (wider, transparent)
      ctx.globalAlpha = comet.opacity * 0.2;
      ctx.fillStyle = "#96b4ff";
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(comet.x + nx * headHalfW * 2.5, comet.y + ny * headHalfW * 2.5);
      ctx.lineTo(comet.x - nx * headHalfW * 2.5, comet.y - ny * headHalfW * 2.5);
      ctx.closePath();
      ctx.fill();

      // Core tail (narrow, bright)
      ctx.globalAlpha = comet.opacity * 0.85;
      ctx.fillStyle = "#dce8ff";
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(comet.x + nx * headHalfW, comet.y + ny * headHalfW);
      ctx.lineTo(comet.x - nx * headHalfW, comet.y - ny * headHalfW);
      ctx.closePath();
      ctx.fill();

      // Head — three concentric circles simulate radial glow without gradient
      ctx.fillStyle = "#ffffff";
      const glowRings = [
        { r: 7, a: 0.12 },
        { r: 4, a: 0.35 },
        { r: 2, a: 1.0 },
      ] as const;
      for (const ring of glowRings) {
        ctx.globalAlpha = comet.opacity * ring.a;
        ctx.beginPath();
        ctx.arc(comet.x, comet.y, ring.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // ── rAF loop ──────────────────────────────────────────────────────────
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Reset state once per frame; drawStar/drawComet adjust globalAlpha per element
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffffff"; // shared by all stars — set once, not per-star

      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        drawStar(stars[i]);
      }

      // Reset globalAlpha so comet head doesn't inherit star's last value
      ctx.globalAlpha = 1;
      drawComet();

      if (Math.random() < COMET_SPAWN_CHANCE) spawnComet();

      rafIdRef.current = requestAnimationFrame(animate);
    };

    const startLoop = () => {
      if (rafIdRef.current === 0) {
        rafIdRef.current = requestAnimationFrame(animate);
      }
    };

    const stopLoop = () => {
      if (rafIdRef.current !== 0) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };

    // Expose to the isVisible effect above
    startLoopRef.current = startLoop;
    stopLoopRef.current = stopLoop;

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Start immediately if already visible on mount
    if (isVisibleRef.current) startLoop();

    return () => {
      stopLoop();
      resizeObserver.disconnect();
    };
  }, []); // ← runs once; isVisible handled separately via refs

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    />
  );
};

StarryCanvas.displayName = "StarryCanvas";
