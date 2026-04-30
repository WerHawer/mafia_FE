/**
 * Module-level cache of Apple-style emoji PNGs used by the canvas overlay.
 *
 * CDN matches the one used by emoji-picker-react (emoji-datasource-apple),
 * so images served here are byte-identical to what the rest of the UI shows.
 *
 * Usage: call getEmojiImage(unified) every frame; it returns null until the
 * PNG is fully decoded. The caller is responsible for delaying its animation
 * until a non-null value is returned (no placeholders / no flicker).
 */
const CDN_BASE =
  "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/";

const cache = new Map<string, HTMLImageElement>();

const isReady = (img: HTMLImageElement): boolean =>
  img.complete && img.naturalWidth > 0;

export const getEmojiImage = (unified: string): HTMLImageElement | null => {
  if (!unified) return null;

  const cached = cache.get(unified);

  if (cached) {
    return isReady(cached) ? cached : null;
  }

  const img = new Image();
  img.decoding = "async";
  img.crossOrigin = "anonymous";
  img.src = `${CDN_BASE}${unified}.png`;
  cache.set(unified, img);

  return null;
};
