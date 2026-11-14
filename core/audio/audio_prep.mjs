import { execFileSync } from 'node:child_process';

/**
 * Generates deterministic fixture audio tailored to the job style:
 * - Default: gentle speech-cadence dual-tone
 * - Multi-speaker (stickman-duo): distinct voice pitch for Speaker A (310Hz) vs Speaker B (440Hz)
 * - Mystery ambient mix: optional procedural dark drone + filtered pink-noise wind underneath voice
 */
export function generateStyleAudioFixture({ outWavPath, durationSec = 10.0, styleId = 'pilot-map-route', captions = [] }) {
  if (styleId === 'stickman-duo' && captions.length > 0) {
    // Build speaker-aware tone segments via FFmpeg filter_complex
    const exprParts = [];
    for (const c of captions) {
      const freq = c.speaker === 'B' ? 440 : 295;
      exprParts.push(`between(t,${c.startSec.toFixed(2)},${c.endSec.toFixed(2)})*sin(2*PI*${freq}*t)*0.22`);
    }
    const expr = exprParts.length > 0 ? exprParts.join('+') : 'sin(2*PI*330*t)*0.15';
    execFileSync('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', `aevalsrc='${expr}':s=48000:d=${durationSec}`,
      '-af', `afade=t=in:st=0:d=0.1,afade=t=out:st=${Math.max(0, durationSec - 0.25).toFixed(2)}:d=0.25`,
      '-c:a', 'pcm_s16le',
      outWavPath,
    ], { stdio: 'ignore' });
    return;
  }

  if (styleId === 'mystery-stage') {
    // Voice fixture + procedural dark drone (65Hz) + filtered ambient wind bed
    execFileSync('ffmpeg', [
      '-y',
      '-f', 'lavfi', '-i', `sine=frequency=260:duration=${durationSec}:sample_rate=48000`,
      '-f', 'lavfi', '-i', `sine=frequency=65:duration=${durationSec}:sample_rate=48000`,
      '-f', 'lavfi', '-i', `anoisesrc=color=pink:duration=${durationSec}:sample_rate=48000`,
      '-filter_complex',
      `[0:a]volume=-18dB[voice];[1:a]volume=-28dB[drone];[2:a]lowpass=f=320,volume=-30dB[wind];[voice][drone][wind]amix=inputs=3:normalize=0,afade=t=in:st=0:d=0.25,afade=t=out:st=${Math.max(0, durationSec - 0.4).toFixed(2)}:d=0.4`,
      '-c:a', 'pcm_s16le',
      outWavPath,
    ], { stdio: 'ignore' });
    return;
  }

  // Default speech-cadence fixture
  execFileSync('ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', `sine=frequency=330:duration=${durationSec}:sample_rate=48000`,
    '-f', 'lavfi', '-i', `sine=frequency=495:duration=${durationSec}:sample_rate=48000`,
    '-filter_complex',
    `[0:a][1:a]amix=inputs=2:weights=0.7 0.3,volume=-18dB,afade=t=in:st=0:d=0.15,afade=t=out:st=${Math.max(0, durationSec - 0.3).toFixed(2)}:d=0.3`,
    '-c:a', 'pcm_s16le',
    outWavPath,
  ], { stdio: 'ignore' });
}
