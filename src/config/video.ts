/**
 * Quality tier definitions and hardware-based auto-detection.
 *
 * Detection algorithm:
 *   • CPU cores  — navigator.hardwareConcurrency
 *   • RAM        — navigator.deviceMemory (Chrome/Edge only; Safari returns undefined)
 *   • Camera     — actual track settings after getUserMedia resolves
 *
 * The detected tier is only a starting point; users can override it at any time
 * via the VideoConfig UI and the choice is persisted to localStorage.
 */

export type QualityTier = 'high' | 'medium' | 'low';

export interface QualitySettings {
  /** Camera capture width requested via getUserMedia */
  width: number;
  /** Camera capture height requested via getUserMedia */
  height: number;
  /** Max FPS for both captureStream and the render loop */
  fps: number;
  /** Human-readable label shown in the settings UI */
  label: string;
  /** LiveKit publish encoding — max bitrate in bps */
  maxBitrate: number;
}

export const QUALITY_PRESETS: Record<QualityTier, QualitySettings> = {
  high:   { width: 1280, height: 720,  fps: 30, label: '720p · 30 fps', maxBitrate: 1_500_000 },
  medium: { width: 854,  height: 480,  fps: 24, label: '480p · 24 fps', maxBitrate:   800_000 },
  low:    { width: 640,  height: 360,  fps: 20, label: '360p · 20 fps', maxBitrate:   400_000 },
};

export const QUALITY_STORAGE_KEY = 'mafia_video_quality';

/**
 * Deterministic, synchronous hardware tier estimate.
 * Used as the *default* if the user has no saved preference.
 *
 * Thresholds (conservative — err on the side of lower quality):
 *   high   : ≥6 logical cores  AND  ≥4 GB RAM
 *   medium : ≥4 logical cores  AND  ≥2 GB RAM
 *   low    : everything else
 */
export function detectHardwareTier(): QualityTier {
  const cores  = navigator.hardwareConcurrency ?? 2;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 2;

  if (cores >= 6 && memory >= 4) return 'high';
  if (cores >= 4 && memory >= 2) return 'medium';
  return 'low';
}

/** Returns the saved preference, or detects the tier automatically. */
export function getInitialTier(): QualityTier {
  try {
    const saved = localStorage.getItem(QUALITY_STORAGE_KEY) as QualityTier | null;
    if (saved && saved in QUALITY_PRESETS) return saved;
  } catch {
    // localStorage might be blocked in private mode
  }
  return detectHardwareTier();
}

export const videoOptions = QUALITY_PRESETS[getInitialTier()];
