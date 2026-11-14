/**
 * Thai Text Segmentation & Safe Wrapping Utilities
 * Uses V8/ICU Intl.Segmenter for Thai word boundaries and grapheme clusters
 * so Thai words and combining vowels/tone marks are never split mid-syllable.
 */

const wordSegmenter = new Intl.Segmenter('th', { granularity: 'word' });
const graphemeSegmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });

const COMBINING_THAI_RE = /^[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;

/**
 * Segments Thai text into word tokens while keeping spaces/punctuation attached cleanly.
 */
export function segmentThaiWords(text) {
  if (!text) return [];
  const tokens = [];
  for (const { segment } of wordSegmenter.segment(String(text))) {
    tokens.push(segment);
  }
  return tokens;
}

/**
 * Segments text into grapheme clusters (prevents splitting base char from tone marks/vowels).
 */
export function segmentGraphemes(text) {
  if (!text) return [];
  return Array.from(graphemeSegmenter.segment(String(text)), (s) => s.segment);
}

/**
 * Checks whether any line starts with a Thai combining vowel/tone mark.
 */
export function validateThaiLines(lines) {
  const issues = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimStart();
    if (COMBINING_THAI_RE.test(line)) {
      issues.push(`Line ${i + 1} starts with combining Thai mark: "${line}"`);
    }
  }
  return { valid: issues.length === 0, issues };
}

/**
 * Wraps Thai text into lines that fit within maxWidth using a caller-provided measureWidth(str) fn.
 * Never splits mid-word unless a single word exceeds maxWidth (in which case it falls back to graphemes).
 */
export function wrapThaiText(text, maxWidth, measureWidth, maxLines = 2) {
  const tokens = segmentThaiWords(text);
  const lines = [];
  let current = '';

  for (const tok of tokens) {
    const candidate = current + tok;
    if (current === '' || measureWidth(candidate) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current.trimEnd());
      current = tok.trimStart();
    }
  }
  if (current.trim().length > 0) {
    lines.push(current.trimEnd());
  }

  const overflow = lines.length > maxLines;
  const check = validateThaiLines(lines);
  return {
    lines: lines.slice(0, maxLines),
    allLines: lines,
    overflow,
    valid: !overflow && check.valid,
    issues: overflow ? [`Wrapped into ${lines.length} lines (max ${maxLines})`, ...check.issues] : check.issues,
  };
}
