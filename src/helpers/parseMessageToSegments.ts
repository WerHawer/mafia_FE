export type TextSegment = { type: "text"; value: string };
export type EmojiSegment = { type: "emoji"; value: string; unified: string };
export type MessageSegment = TextSegment | EmojiSegment;

// Same pattern as EMOJI_CLUSTER_REGEX in getEmojiVariant.ts
// Duplicated intentionally to keep helpers independent (no circular imports)
const EMOJI_SEGMENT_REGEX = new RegExp(
  "\\p" + "{Extended_Pictographic}(?:\\uFE0F?[\\u{1F3FB}-\\u{1F3FF}])?(?:\\u200D\\p" + "{Extended_Pictographic}(?:\\uFE0F?[\\u{1F3FB}-\\u{1F3FF}])?)*\\uFE0F?|[\\u{1F1E6}-\\u{1F1FF}]{2}",
  "gu"
);

/**
 * Converts a single emoji Unicode string into the lowercase hex unified code
 * used by emoji-picker-react and emoji-datasource CDNs.
 * e.g. "😀" → "1f600", "👋🏽" → "1f44b-1f3fd", "👨‍💻" → "1f468-200d-1f4bb"
 */
const emojiToUnified = (emoji: string): string =>
  [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .join("-");

/**
 * Splits a message string into alternating text and emoji segments.
 * Text segments: plain strings to render as-is.
 * Emoji segments: Unicode emoji clusters with their unified hex code.
 */
export const parseMessageToSegments = (text: string): MessageSegment[] => {
  const segments: MessageSegment[] = [];

  // Re-create with the same flags so exec() iteration is safe (own lastIndex)
  const regex = new RegExp(EMOJI_SEGMENT_REGEX.source, EMOJI_SEGMENT_REGEX.flags);
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    segments.push({
      type: "emoji",
      value: match[0],
      unified: emojiToUnified(match[0]),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
};



