import { useCallback, useEffect, useRef, useState } from 'react';

import {
  detectHardwareTier,
  getInitialTier,
  QUALITY_PRESETS,
  QUALITY_STORAGE_KEY,
  QualitySettings,
  QualityTier,
} from '@/config/video';

/**
 * Manages video quality tier selection with:
 *   - Automatic hardware-based initial tier
 *   - Persistent user override (localStorage)
 *   - Real camera resolution detection (via track.getSettings)
 *   - Runtime performance monitoring with auto-downgrade
 */
export const useAdaptiveQuality = () => {
  const [tier, setTierState] = useState<QualityTier>(getInitialTier);

  /** Cores / RAM detected at startup — shown as a hint in the UI */
  const detectedTier = detectHardwareTier();

  /** Actual resolution the camera returned (may differ from requested) */
  const [actualResolution, setActualResolution] = useState<{
    width: number;
    height: number;
  } | null>(null);

  /**
   * Called by GamePage once the camera stream is ready.
   * Reads real track settings and — if the camera can't reach the requested
   * resolution — silently downgrades the tier.
   */
  const onStreamReady = useCallback(
    (stream: MediaStream) => {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;

      const { width = 0, height = 0 } = videoTrack.getSettings();
      setActualResolution({ width, height });

      // Auto-downgrade if the camera delivered less than 85% of requested height
      const requested = QUALITY_PRESETS[tier].height;
      if (height < requested * 0.85) {
        if (tier === 'high') {
          console.log(
            `[AdaptiveQuality] Camera only delivered ${height}p (requested ${requested}p) — downgrading to medium`
          );
          setTierState('medium');
        } else if (tier === 'medium') {
          console.log(
            `[AdaptiveQuality] Camera only delivered ${height}p (requested ${requested}p) — downgrading to low`
          );
          setTierState('low');
        }
      }
    },
    [tier]
  );

  /** Persist user selection and apply immediately */
  const setTier = useCallback((newTier: QualityTier) => {
    setTierState(newTier);
    try {
      localStorage.setItem(QUALITY_STORAGE_KEY, newTier);
    } catch {
      // ignore private-mode errors
    }
    console.log(`[AdaptiveQuality] User selected tier: ${newTier}`);
  }, []);

  return {
    tier,
    settings: QUALITY_PRESETS[tier] satisfies QualitySettings,
    setTier,
    detectedTier,
    actualResolution,
    onStreamReady,
    allPresets: QUALITY_PRESETS,
  };
};
