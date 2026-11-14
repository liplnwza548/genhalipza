/**
 * Clean-Room Thai Text-to-Viseme Estimator & Deduplicator
 * Maps Thai vowel graphemes within each caption cue to 6 mouth shapes:
 *   A (open jaw), E (wide smile), I (narrow high), O (rounded), U (pursed), REST (closed)
 * and enforces a minimum hold duration so rapid frames don't chatter.
 */

const VOWEL_MAP = new Map([
  ['า', 'A'], ['ะ', 'A'], ['ำ', 'A'], ['ั', 'A'],
  ['เ', 'E'], ['แ', 'E'], ['ไ', 'E'], ['ใ', 'E'],
  ['ิ', 'I'], ['ี', 'I'], ['ึ', 'I'], ['ื', 'I'], ['ย', 'I'],
  ['โ', 'O'], ['อ', 'O'], ['็', 'O'],
  ['ุ', 'U'], ['ู', 'U'], ['ว', 'U'],
]);

/**
 * Estimates viseme intervals from Thai text across [startSec, endSec].
 */
export function estimateVisemesForCue(text, startSec, endSec, minHoldSec = 0.085) {
  const duration = Math.max(0.05, endSec - startSec);
  const chars = Array.from(String(text || ''));
  const rawShapes = [];

  for (const ch of chars) {
    if (VOWEL_MAP.has(ch)) {
      rawShapes.push(VOWEL_MAP.get(ch));
    } else if (ch === ' ') {
      rawShapes.push('REST');
    }
  }

  if (rawShapes.length === 0) {
    rawShapes.push('A', 'E', 'O', 'REST');
  }

  const step = Math.max(minHoldSec, duration / rawShapes.length);
  const events = [];
  let cursor = startSec;

  for (let i = 0; i < rawShapes.length && cursor < endSec - 0.02; i++) {
    const shape = rawShapes[i];
    const nextEnd = Math.min(endSec, cursor + step);
    const prev = events[events.length - 1];
    if (prev && prev.viseme === shape) {
      prev.endSec = nextEnd;
    } else {
      events.push({
        startSec: Number(cursor.toFixed(3)),
        endSec: Number(nextEnd.toFixed(3)),
        viseme: shape,
      });
    }
    cursor = nextEnd;
  }

  // Merge micro-segments shorter than minHoldSec
  const deduped = [];
  for (const ev of events) {
    const dur = ev.endSec - ev.startSec;
    if (dur < minHoldSec * 0.7 && deduped.length > 0) {
      deduped[deduped.length - 1].endSec = ev.endSec;
    } else {
      deduped.push({ ...ev });
    }
  }
  return deduped;
}

/**
 * Builds a complete sorted viseme timeline from caption cues (or words if present).
 */
export function generateVisemeTrack(captions, minHoldSec = 0.085) {
  const track = [];
  for (const cap of captions || []) {
    if (Array.isArray(cap.words) && cap.words.length > 0) {
      for (const w of cap.words) {
        track.push(...estimateVisemesForCue(w.text, w.startSec, w.endSec, minHoldSec));
      }
    } else {
      track.push(...estimateVisemesForCue(cap.text, cap.startSec, cap.endSec, minHoldSec));
    }
  }
  track.sort((a, b) => a.startSec - b.startSec);
  return track;
}
