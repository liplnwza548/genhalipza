import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

function checkCaptions(timeline) {
  const seen = new Set();
  const allCaps = [];
  for (const scene of timeline.scenes) {
    for (const c of scene.captions || []) {
      const key = `${c.startSec}|${c.endSec}|${c.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      allCaps.push({ sceneId: scene.sceneId, ...c });
    }
  }
  allCaps.sort((a, b) => a.startSec - b.startSec);

  const issues = [];
  for (let i = 0; i < allCaps.length; i++) {
    const cur = allCaps[i];
    const dur = cur.endSec - cur.startSec;
    if (dur < 0.6) {
      issues.push(`Caption too short (${dur.toFixed(2)}s < 0.6s): "${cur.text}"`);
    }
    if (/^[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(cur.text)) {
      issues.push(`Caption starts with combining Thai vowel/tone mark: "${cur.text}"`);
    }
    if (i > 0 && cur.startSec < allCaps[i - 1].endSec) {
      issues.push(`Caption overlap between "${allCaps[i - 1].text}" and "${cur.text}"`);
    }
  }
  return { count: allCaps.length, passed: issues.length === 0, issues };
}

function measureSsim(imgA, imgB) {
  const res = spawnSync('ffmpeg', [
    '-hide_banner',
    '-i', imgA,
    '-i', imgB,
    '-lavfi', 'ssim',
    '-f', 'null', '-',
  ], { encoding: 'utf8' });
  const m = res.stderr.match(/All:([0-9.]+)/);
  return m ? Number(m[1]) : null;
}

export function runPostRenderQc({ jobDir, timeline, finalMp4Path, gate4Keyframes = [] }) {
  const probeRaw = execFileSync('ffprobe', [
    '-v', 'error', '-show_format', '-show_streams', '-of', 'json', finalMp4Path,
  ], { encoding: 'utf8' });
  const probe = JSON.parse(probeRaw);
  const vStream = probe.streams.find((s) => s.codec_type === 'video');
  const aStream = probe.streams.find((s) => s.codec_type === 'audio');

  const decodeRes = spawnSync('ffmpeg', ['-v', 'error', '-i', finalMp4Path, '-f', 'null', '-'], { encoding: 'utf8' });
  const decodeErrors = decodeRes.stderr.trim();

  const lnRes = spawnSync('ffmpeg', [
    '-hide_banner', '-i', finalMp4Path,
    '-af', 'loudnorm=I=-16:TP=-1.0:LRA=11:print_format=json',
    '-f', 'null', '-',
  ], { encoding: 'utf8' });
  const lnMatch = lnRes.stderr.match(/\{[\s\S]*"input_i"[\s\S]*\}/);
  const lnJson = lnMatch ? JSON.parse(lnMatch[0]) : null;

  const measuredLufs = lnJson ? Number(lnJson.input_i) : null;
  const measuredTp = lnJson ? Number(lnJson.input_tp) : null;
  const videoDurationSec = vStream ? Number(vStream.duration) : 0;
  const nbFrames = vStream ? Number(vStream.nb_frames) : 0;

  // Frame parity check: extract exact frameIndex from final.mp4 & compare SSIM against Gate 4 PNG
  const parityDir = path.join(jobDir, 'qc_parity');
  fs.mkdirSync(parityDir, { recursive: true });
  const parityResults = [];
  for (const kf of gate4Keyframes) {
    const extractedPng = path.join(parityDir, `extracted_f${kf.frameIndex}.png`);
    execFileSync('ffmpeg', [
      '-y', '-i', finalMp4Path,
      '-vf', `select=eq(n\\,${kf.frameIndex})`,
      '-vsync', 'vfr',
      '-vframes', '1',
      extractedPng,
    ], { stdio: 'ignore' });
    const ssim = measureSsim(kf.pngPath, extractedPng);
    parityResults.push({
      sceneId: kf.sceneId,
      frameIndex: kf.frameIndex,
      ssim,
      passed: ssim !== null && ssim >= 0.95,
    });
  }

  const captionCheck = checkCaptions(timeline);

  const checks = {
    dimensionsMatch: vStream?.width === timeline.width && vStream?.height === timeline.height,
    frameCountMatch: nbFrames === timeline.totalFrames,
    videoCodecH264: vStream?.codec_name === 'h264',
    audioCodecAac: aStream?.codec_name === 'aac',
    decodeClean: decodeErrors === '',
    lufsInTarget: measuredLufs !== null && measuredLufs >= -16.5 && measuredLufs <= -15.5,
    truePeakInTarget: measuredTp !== null && measuredTp <= -1.0,
    captionsValid: captionCheck.passed,
    gate4ParityPassed: parityResults.every((r) => r.passed),
  };

  const allPassed = Object.values(checks).every(Boolean);
  const report = {
    schemaVersion: 1,
    jobId: timeline.jobId,
    revision: timeline.revision,
    timestamp: new Date().toISOString(),
    passed: allPassed,
    checks,
    video: {
      codec: vStream?.codec_name,
      width: vStream?.width,
      height: vStream?.height,
      rFrameRate: vStream?.r_frame_rate,
      nbFrames,
      videoDurationSec,
    },
    audio: {
      codec: aStream?.codec_name,
      sampleRate: Number(aStream?.sample_rate || 0),
      measuredLufs,
      measuredTruePeakDbtp: measuredTp,
    },
    captions: captionCheck,
    gate4Parity: parityResults,
    decodeErrors,
  };

  fs.writeFileSync(path.join(jobDir, 'qc_report.json'), JSON.stringify(report, null, 2));
  return report;
}
