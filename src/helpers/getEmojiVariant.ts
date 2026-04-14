export type EmojiVariant = "single" | "few" | "text";

/**
 * Matches a single visible emoji cluster, including:
 * - Base emoji (\p{Extended_Pictographic})
 * - Optional variation selector (\uFE0F)
 * - Optional skin tone modifier ([\u{1F3FB}-\u{1F3FF}])
 * - ZWJ sequences (e.g. 👨‍💻, 👨‍👩‍👧)
 * - Country flags (two regional indicator letters, e.g. 🇺🇦)
 */
export const EMOJI_CLUSTER_REGEX = new RegExp(
  "\\p" + "{Extended_Pictographic}(?:\\uFE0F?[\\u{1F3FB}-\\u{1F3FF}])?(?:\\u200D\\p" + "{Extended_Pictographic}(?:\\uFE0F?[\\u{1F3FB}-\\u{1F3FF}])?)*\\uFE0F?|[\\u{1F1E6}-\\u{1F1FF}]{2}",
  "gu"
);

/**
 * Returns the emoji display variant for a chat message:
 * - "single" — exactly 1 emoji, no other text → very large, no bubble
 * - "few"    — 2–3 emojis, no other text → medium large, no bubble
 * - "text"   — regular text (or 4+ emojis mixed/only) → normal bubble
 */
export const getEmojiVariant = (text: string): EmojiVariant => {
  const trimmed = text.trim();
  if (!trimmed) return "text";

  const clusters = trimmed.match(EMOJI_CLUSTER_REGEX) ?? [];
  if (clusters.length === 0) return "text";

  // After removing all emoji clusters, if anything non-whitespace remains — regular text
  const remainder = trimmed.replace(EMOJI_CLUSTER_REGEX, "").trim();
  if (remainder.length > 0) return "text";

  if (clusters.length === 1) return "single";
  if (clusters.length <= 3) return "few";

  return "text";
};

