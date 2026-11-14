import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'tmp', 'smoke');
fs.mkdirSync(OUT_DIR, { recursive: true });

function findChromium() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.CHROMIUM_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chromium executable not found. Run `npm run doctor` first.');
}

function runFfmpeg(args, captureStderr = false) {
  try {
    const res = execFileSync('ffmpeg', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { stdout: res, stderr: '' };
  } catch (err) {
    if (captureStderr && err.stderr) {
      return { stdout: err.stdout || '', stderr: err.stderr };
    }
    throw new Error(`FFmpeg failed: ${err.stderr || err.message}`);
  }
}

console.log('=== GenhaLipza Phase 0A Capability Smoke Test ===\n');

const chromiumPath = findChromium();
const toFontDataUri = (filename) => {
  const b64 = fs.readFileSync(path.join(ROOT, 'assets', 'fonts', filename)).toString('base64');
  return `data:font/ttf;base64,${b64}`;
};
const promptBoldUrl = toFontDataUri('Prompt-Bold.ttf');
const promptRegUrl = toFontDataUri('Prompt-Regular.ttf');
const notoThaiUrl = toFontDataUri('NotoSansThai.ttf');

const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <style>
    @font-face {
      font-family: 'Prompt';
      src: url('${promptRegUrl}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Prompt';
      src: url('${promptBoldUrl}') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    @font-face {
      font-family: 'Noto Sans Thai';
      src: url('${notoThaiUrl}') format('truetype');
      font-weight: 100 900;
      font-style: normal;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      background: #0b1020;
    }
  </style>
</head>
<body>
  <canvas id="stage" width="1080" height="1920"></canvas>
  <script>
    window.renderSmokeFrame = async () => {
      await Promise.all([
        document.fonts.load('400 42px "Prompt"'),
        document.fonts.load('700 66px "Prompt"'),
        document.fonts.load('600 46px "Noto Sans Thai"'),
      ]);
      await document.fonts.ready;
      const promptLoaded = document.fonts.check('700 66px "Prompt"');
      const notoLoaded = document.fonts.check('600 46px "Noto Sans Thai"');

      const canvas = document.getElementById('stage');
      const ctx = canvas.getContext('2d');

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, 1920);
      bg.addColorStop(0, '#0a1128');
      bg.addColorStop(1, '#141e30');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1920);

      // Safe-area guide box (9:16 TikTok/Reels safe zone)
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 4;
      ctx.setLineDash([14, 10]);
      ctx.strokeRect(80, 220, 920, 1320);
      ctx.setLineDash([]);

      // Stylized vector route curve
      ctx.beginPath();
      ctx.moveTo(220, 1080);
      ctx.bezierCurveTo(380, 820, 720, 960, 860, 680);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 10;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 24;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Route markers
      for (const [x, y, label] of [[220, 1080, 'จุดเริ่มต้น'], [860, 680, 'ปลายทาง']]) {
        ctx.fillStyle = '#ff3b6b';
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 34px "Prompt"';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y - 34);
      }

      // Thai headline (testing upper/lower vowels and tone marks)
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 66px "Prompt"';
      ctx.textAlign = 'center';
      ctx.fillText('ทดสอบภาษาไทย 100%', 540, 340);

      ctx.fillStyle = '#ffd166';
      ctx.font = '600 46px "Noto Sans Thai"';
      ctx.fillText('ปูพื้นฐาน เก้าอี้ น้ำพุ สระและวรรณยุกต์ไม่ขาด', 540, 425);

      // Bottom caption pill
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.fillRect(110, 1340, 860, 130);
      ctx.fillStyle = '#ffffff';
      ctx.font = '400 42px "Prompt"';
      ctx.fillText('Phase 0A: Chromium + Thai Fonts + FFmpeg', 540, 1418);

      return { promptLoaded, notoLoaded };
    };
  </script>
</body>
</html>`;

const t0 = Date.now();
const browser = await chromium.launch({
  executablePath: chromiumPath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

let fontStatus;
const framePng = path.join(OUT_DIR, 'smoke_frame.png');
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.setContent(html, { waitUntil: 'load' });
  fontStatus = await page.evaluate(() => window.renderSmokeFrame());
  await page.screenshot({ path: framePng, type: 'png' });
} finally {
  await browser.close();
}
const renderMs = Date.now() - t0;
console.log(`✅ Chromium rendered 1080x1920 Thai frame in ${renderMs}ms (fonts: ${JSON.stringify(fontStatus)})`);
if (!fontStatus?.promptLoaded || !fontStatus?.notoLoaded) {
  throw new Error(`Thai font verification failed: ${JSON.stringify(fontStatus)}`);
}

// Generate 2s fixture audio (sine wave 440Hz, -20dB)
const rawWav = path.join(OUT_DIR, 'fixture_audio.wav');
execFileSync('ffmpeg', [
  '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2.0:sample_rate=48000',
  '-af', 'volume=-20dB', '-c:a', 'pcm_s16le', rawWav,
], { stdio: 'ignore' });

// Pass 1: measure loudnorm on fixture audio
const p1 = spawnSync('ffmpeg', [
  '-hide_banner', '-i', rawWav,
  '-af', 'loudnorm=I=-16:TP=-2.0:LRA=11:print_format=json',
  '-f', 'null', '-',
], { encoding: 'utf8' });

const jsonMatch = p1.stderr.match(/\{[\s\S]*"input_i"[\s\S]*\}/);
if (!jsonMatch) throw new Error('Failed to parse loudnorm Pass 1 JSON');
const ln1 = JSON.parse(jsonMatch[0]);

// Pass 2: mux PNG (2s @ 30fps = 60 frames) + linear loudnorm -> H.264/AAC MP4
const smokeMp4 = path.join(OUT_DIR, 'smoke_test.mp4');
const p2Filter = `loudnorm=I=-16:TP=-2.0:LRA=11:measured_I=${ln1.input_i}:measured_TP=${ln1.input_tp}:measured_LRA=${ln1.input_lra}:measured_thresh=${ln1.input_thresh}:offset=${ln1.target_offset}:linear=true`;

const p2 = spawnSync('ffmpeg', [
  '-y',
  '-loop', '1', '-framerate', '30', '-t', '2.0', '-i', framePng,
  '-i', rawWav,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-profile:v', 'high', '-crf', '18',
  '-af', p2Filter,
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-shortest', '-movflags', '+faststart',
  smokeMp4,
], { encoding: 'utf8' });
if (p2.status !== 0) throw new Error(`FFmpeg mux failed: ${p2.stderr}`);

// Verify final MP4 with ffprobe + decode check + post-encode loudnorm measurement
const probe = execFileSync('ffprobe', [
  '-v', 'error', '-show_format', '-show_streams', '-of', 'json', smokeMp4,
], { encoding: 'utf8' });
const probeJson = JSON.parse(probe);
const vStream = probeJson.streams.find((s) => s.codec_type === 'video');
const aStream = probeJson.streams.find((s) => s.codec_type === 'audio');

const decodeCheck = spawnSync('ffmpeg', ['-v', 'error', '-i', smokeMp4, '-f', 'null', '-'], { encoding: 'utf8' });
const postLn = spawnSync('ffmpeg', [
  '-hide_banner', '-i', smokeMp4,
  '-af', 'loudnorm=I=-16:TP=-1.0:LRA=11:print_format=json',
  '-f', 'null', '-',
], { encoding: 'utf8' });
const postMatch = postLn.stderr.match(/\{[\s\S]*"input_i"[\s\S]*\}/);
const postMetrics = postMatch ? JSON.parse(postMatch[0]) : null;

const report = {
  timestamp: new Date().toISOString(),
  chromiumPath,
  renderMs,
  fonts: fontStatus,
  video: {
    codec: vStream.codec_name,
    width: vStream.width,
    height: vStream.height,
    rFrameRate: vStream.r_frame_rate,
    nbFrames: Number(vStream.nb_frames),
    durationSec: Number(vStream.duration),
  },
  audio: {
    codec: aStream.codec_name,
    sampleRate: Number(aStream.sample_rate),
    measuredLufs: postMetrics ? Number(postMetrics.input_i) : null,
    measuredTruePeakDbtp: postMetrics ? Number(postMetrics.input_tp) : null,
  },
  decodeErrors: decodeCheck.stderr.trim(),
};

fs.writeFileSync(path.join(OUT_DIR, 'smoke_report.json'), JSON.stringify(report, null, 2));
console.log('✅ Smoke MP4 generated & verified:');
console.log(JSON.stringify(report, null, 2));
