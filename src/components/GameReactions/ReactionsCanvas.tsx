import { useEffect, useRef } from "react";

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
  if (progress < FADE_IN_END) {
    return progress / FADE_IN_END;
  }

  if (progress > FADE_OUT_START) {
    return 1 - (progress - FADE_OUT_START) / (1 - FADE_OUT_START);
  }

  return 1;
};

const computeScale = (progress: number): number => {
  if (progress < SCALE_PEAK_END) {
    return lerp(0.5, 1.1, progress / SCALE_PEAK_END);
  }

  if (progress < SCALE_SETTLE_END) {
    return lerp(
      1.1,
      1,
      (progress - SCALE_PEAK_END) / (SCALE_SETTLE_END - SCALE_PEAK_END)
    );
  }

  return 1;
};

/**
 * Single canvas overlay that draws all active floating reactions.
 *
 * Designed to never trigger React re-renders after mount: the rAF loop reads
 * reactionsStore.reactions directly each frame and draws Apple PNG emojis from
 * a module-level cache. Each reaction's animation starts only after its PNG
 * is fully loaded (no flicker, no mid-animation snap).
 */
export const ReactionsCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cssSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

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

    let rafId = 0;

    const drawReaction = (reaction: ActiveReaction, now: number) => {
      const { width, height } = cssSizeRef.current;
      const unified = getUnified(reaction.emoji);
      const img = getEmojiImage(unified);

      if (!img) return;

      if (reaction.startedAt === null) {
        reactionsStore.markStarted(reaction.id, now);
      }

      const startedAt = reaction.startedAt ?? now;
      const elapsed = now - startedAt;
      const progress = clamp01(elapsed / reaction.duration);

      const opacity = computeOpacity(progress);
      const scale = computeScale(progress);

      const startY = height - BOTTOM_OFFSET;
      const endY = height * (1 - reaction.endYFraction);
      const y = lerp(startY, endY, progress);

      const wobbleX = Math.sin((now / 2000) * Math.PI * 2) * reaction.wobble;
      const x = reaction.xFraction * width + wobbleX;

      const drawSize = reaction.size * scale;

      ctx.globalAlpha = opacity;

      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      ctx.drawImage(
        img,
        x - drawSize / 2,
        y - drawSize / 2,
        drawSize,
        drawSize
      );

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const nameSize = Math.max(11, Math.round(reaction.size * 0.34));
      ctx.font = `600 ${nameSize}px ${FONT_FAMILY}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillStyle = "#ffffff";

      const nameY = y + drawSize / 2 + NAME_GAP;
      ctx.strokeText(reaction.userName, x, nameY);
      ctx.fillText(reaction.userName, x, nameY);
    };

    const tick = () => {
      const { width, height } = cssSizeRef.current;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 1;

      const now = performance.now();
      const reactions = reactionsStore.reactions.slice();

      for (const reaction of reactions) {
        drawReaction(reaction, now);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
};

ReactionsCanvas.displayName = "ReactionsCanvas";
