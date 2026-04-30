/**
 * Best-effort conversion from an emoji character to its unified code point sequence
 * (the same format used by emoji-datasource files, e.g. "1f44d" or "2764-fe0f").
 *
 * The fe0f variation selector is kept ONLY for short emojis (<=2 UTF-16 code units),
 * because emoji-datasource files like "2764-fe0f.png" require it for some short emojis,
 * while longer sequences (skin tones, ZWJ joins) usually do not.
 */
export const getUnified = (emoji: string): string => {
  if (!emoji) return "";

  try {
    return [...emoji]
      .map((c) => c.codePointAt(0)!.toString(16).padStart(4, "0"))
      .filter((hex) => hex !== "fe0f" || emoji.length <= 2)
      .join("-");
  } catch {
    return "";
  }
};
