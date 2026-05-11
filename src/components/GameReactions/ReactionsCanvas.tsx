import { useEffect, useRef } from "react";
import { reaction } from "mobx";

import { reactionsStore, ActiveReaction } from "@/store/reactionsStore.ts";
import { getUnified } from "@/utils/getUnified.ts";

import { getEmojiImage } from "./appleEmojiCache.ts";
import styles from "./ReactionsCanvas.module.scss";

const FONT_FAMILY = '"Nunito", system-ui, Arial, sans-serif';
const NAME_GAP = 6;
const BOTTOM_OFFSET = 60;

const FADE_IN_END = 0.15;
const FADE_OUT_START = 0.55;
const SCALE_PEAK_END = 0.15;
const SCALE_SETTLE_END = 0.3;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

const computeOpacity = (progress: number): number => {
  if (progress < FADE_IN_END) return progress / FADE_IN_END;
  if (progress > FADE_OUT_START) return 1 - (progress - FADE_OUT_START) / (1 - FADE_OUT_START);
  return 1;
};

const computeScale = (progress: number): number => {
  if (progress < SCALE_PEAK_END) return lerp(0.5, 1.1, progress / SCALE_PEAK_END);
  if (progress < SCALE_SETTLE_END) {
    return lerp(1.1, 1, (progress - SCALE_PEAK_END) / (SCALE_SETTLE_END - SCALE_PEAK_END));
  }
  return 1;
};

/**
 * Single canvas overlay that draws all active floating reactions.
 *
 * Performance design:
 * - rAF loop is PAUSED when reactions array is empty and resumed via a
 *   lightweight MobX reaction the moment a new reaction is added.
 * - No .slice() allocations inside the hot path — iterates the observable
 *   array directly with a plain for-loop.
 * - ctx.font is cached across frames; only re-set when the computed size
 *   actually differs from the previous draw call.
 * - Static context properties (textAlign, strokeStyle, etc.) are hoisted
 *   out of the per-reaction loop — set once per frame.
 * - shadowBlur is omitted entirely; it is not GPU-accelerated and causes
 *   significant CPU cost per drawImage call.
 */
export const ReactionsCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cssSizeRef = useRef({ width: 0, height: 0 });
  const rafIdRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Resize handler ─────────────────────────────────────────────────────
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const cssWidth = Math.max(1, Math.floor(rect.width));
      const cssHeight = Math.max(1, Math.floor(rect.height));
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cssSizeRef.current = { width: cssWidth, height: cssHeight };
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // ── Font cache ─────────────────────────────────────────────────────────
    // Persists across frames: ctx is stateful, so if the last drawn reaction
    // used fontSize 12 and the next also uses 12 we skip the string parse.
    let cachedFontSize = -1;

    // ── Per-reaction draw (no shadow, cached font) ─────────────────────────
    const drawReaction = (r: ActiveReaction, now: number) => {
      const { width, height } = cssSizeRef.current;
      const unified = getUnified(r.emoji);
      const img = getEmojiImage(unified);
      if (!img) return;

      if (r.startedAt === null) {
        reactionsStore.markStarted(r.id, now);
      }

      const startedAt = r.startedAt ?? now;
      const elapsed = now - startedAt;
      const progress = clamp01(elapsed / r.duration);

      const opacity = computeOpacity(progress);
      const scale = computeScale(progress);

      const startY = height - BOTTOM_OFFSET;
      const endY = height * (1 - r.endYFraction);
      const y = lerp(startY, endY, progress);

      const wobbleX = Math.sin((now / 2000) * Math.PI * 2) * r.wobble;
      const x = r.xFraction * width + wobbleX;

      const drawSize = r.size * scale;

      ctx.globalAlpha = opacity;
      ctx.drawImage(img, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);

      // Username label — font cached to avoid repeated string parsing
      const nameSize = Math.max(11, Math.round(r.size * 0.34));
      if (nameSize !== cachedFontSize) {
        ctx.font = `600 ${nameSize}px ${FONT_FAMILY}`;
        cachedFontSize = nameSize;
      }

      const nameY = y + drawSize / 2 + NAME_GAP;
      ctx.strokeText(r.userName, x, nameY);
      ctx.fillText(r.userName, x, nameY);
    };

    // ── rAF tick ───────────────────────────────────────────────────────────
    const tick = () => {
      const reactions = reactionsStore.reactions;

      // Nothing to draw — pause the loop entirely.
      // A MobX reaction below will restart it when needed.
      if (reactions.length === 0) {
        rafIdRef.current = 0;
        return;
      }

      const { width, height } = cssSizeRef.current;
      ctx.clearRect(0, 0, width, height);

      const now = performance.now();

      // Static context properties hoisted out of the per-reaction call.
      // These never change between reactions so we set them once per frame.
      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillStyle = "#ffffff";

      // Direct iteration — no .slice() allocation each frame
      for (let i = 0; i < reactions.length; i++) {
        drawReaction(reactions[i], now);
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    // ── Loop start helper ──────────────────────────────────────────────────
    const startLoop = () => {
      if (rafIdRef.current === 0) {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };

    // ── MobX watcher: restart the loop when a reaction is added ───────────
    // This is the only place we observe the store; the tick itself reads
    // reactionsStore.reactions outside of any reactive context (intentional).
    const disposeWatcher = reaction(
      () => reactionsStore.reactions.length,
      (length) => {
        if (length > 0) startLoop();
      }
    );

    // Start immediately if there are already active reactions on mount
    if (reactionsStore.reactions.length > 0) startLoop();

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      resizeObserver.disconnect();
      disposeWatcher();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
};

ReactionsCanvas.displayName = "ReactionsCanvas";
