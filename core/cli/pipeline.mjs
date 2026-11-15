import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { buildRendererHtml } from '../engine/html-template.mjs';
import {
  acquireJobLock,
  computeSceneHashes,
  invalidateStaleApprovals,
  sha256File,
  sha256Json,
  writeJsonAtomic,
} from '../engine/state-manager.mjs';
import { generateVisemeTrack } from '../audio/thai_visemes.mjs';
import { generateStyleAudioFixture } from '../audio/audio_prep.mjs';
import { runPostRenderQc } from '../qa/qc.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

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

function loadValidator(schemaName) {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', schemaName), 'utf8'));
  return ajv.compile(schema);
}

function formatSrtTime(sec) {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(r).padStart(3, '0')}`;
}

function buildSrt(timeline) {
  const seen = new Set();
  const allCaps = [];
  for (const s of timeline.scenes) {
    for (const c of s.captions || []) {
      const key = `${c.startSec}|${c.endSec}|${c.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      allCaps.push(c);
    }
  }
  allCaps.sort((a, b) => a.startSec - b.startSec);
  return allCaps
    .map((c, idx) => `${idx + 1}\n${formatSrtTime(c.startSec)} --> ${formatSrtTime(c.endSec)}\n${c.text}\n`)
    .join('\n');
}

function loadPrivateMascotAssets(privateDir) {
  if (!privateDir || !fs.existsSync(privateDir)) return null;
  const resolved = path.resolve(privateDir);
  const result = { poses: {}, mouths: {} };

  const readPngGroup = (subDir, targetObj) => {
    const dir = path.join(resolved, subDir);
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.png')) continue;
      const key = path.basename(file, '.png');
      const fullPath = path.resolve(dir, file);
      if (!fullPath.startsWith(resolved + path.sep)) continue;
      const b64 = fs.readFileSync(fullPath).toString('base64');
      targetObj[key] = `data:image/png;base64,${b64}`;
    }
  };

  readPngGroup('poses', result.poses);
  readPngGroup('mouth_rig', result.mouths);
  if (Object.keys(result.poses).length === 0 && Object.keys(result.mouths).length === 0) {
    return null;
  }
  return result;
}

function parseArgs(argv) {
  const args = {
    cmd: argv[2] || 'run',
    job: 'assets/fixtures/sample-10s/job.json',
    cuesOverride: null,
    skipProbe: false,
  };
  for (let i = 3; i < argv.length; i++) {
    if (argv[i] === '--job' && argv[i + 1]) args.job = argv[++i];
    if (argv[i] === '--cues' && argv[i + 1]) args.cuesOverride = argv[++i];
    if (argv[i] === '--skip-probe') args.skipProbe = true;
  }
  return args;
}

const args = parseArgs(process.argv);
const jobJsonPath = path.resolve(ROOT, args.job);
const job = JSON.parse(fs.readFileSync(jobJsonPath, 'utf8'));

const validateJob = loadValidator('job.schema.json');
if (!validateJob(job)) {
  console.error('❌ Invalid job.json:', validateJob.errors);
  process.exit(1);
}

const jobDir = path.join(ROOT, 'jobs', job.jobId);
const releaseLock = acquireJobLock(jobDir);

try {
  const g3Dir = path.join(jobDir, 'gate3_sketch');
  const g4Dir = path.join(jobDir, 'gate4_storyboard');
  const framesDir = path.join(jobDir, 'frames');
  fs.mkdirSync(g3Dir, { recursive: true });
  fs.mkdirSync(g4Dir, { recursive: true });
  fs.mkdirSync(framesDir, { recursive: true });

  console.log(`=== GenhaLipza Pipeline — Job: ${job.jobId} [${job.styleId}] (rev ${job.revision || 1}) ===\n`);

  // Gate 1: Brief & Facts
  const factsSrc = path.join(path.dirname(jobJsonPath), 'facts.md');
  const factsDst = path.join(jobDir, 'facts.md');
  if (fs.existsSync(factsSrc)) {
    fs.copyFileSync(factsSrc, factsDst);
  }
  console.log('✅ Gate 1 (Brief & Facts): facts.md ready');

  // Gate 2: Audio-In / TTS + Cues -> Compile Timeline
  const cuesPath = path.resolve(ROOT, args.cuesOverride || job.audio.cuesPath);
  const rawCues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
  let cues = rawCues;

  const findPython = () => {
    const venvPy = path.join(ROOT, '.venv', 'bin', 'python');
    return fs.existsSync(venvPy) ? venvPy : 'python3';
  };

  let audioPath = job.audio.sourcePath ? path.resolve(ROOT, job.audio.sourcePath) : '';
  const hasExplicitSource = audioPath && fs.existsSync(audioPath);

  if (job.audio.mode === 'tts' && !hasExplicitSource) {
    const speaker = job.audio.speaker || 'male';
    const bgmMood = job.audio.bgmMood || 'calm';
    const bgmGain = job.audio.bgmGain ?? 0.14;
    const ttsCacheKey = sha256Json({ rawCues, speaker, bgmMood, bgmGain });
    const ttsCachePath = path.join(jobDir, 'tts_cache.json');
    const voiceTtsWav = path.join(jobDir, 'voice_tts.wav');
    const cuesTimedPath = path.join(jobDir, 'cues_timed.json');
    const mixedWav = path.join(jobDir, 'audio_mixed.wav');

    const prevCache = fs.existsSync(ttsCachePath)
      ? JSON.parse(fs.readFileSync(ttsCachePath, 'utf8'))
      : null;

    if (
      prevCache?.key === ttsCacheKey
      && fs.existsSync(voiceTtsWav)
      && fs.existsSync(cuesTimedPath)
      && fs.existsSync(mixedWav)
    ) {
      cues = JSON.parse(fs.readFileSync(cuesTimedPath, 'utf8'));
      audioPath = mixedWav;
      console.log(`ℹ️ Reusing cached Thai TTS + SFX/BGM mix (${cues.totalDurationSec}s, providers=${(cues.ttsProviders || []).join(',')})`);
    } else {
      const pyBin = findPython();
      const ttsRes = spawnSync(pyBin, [
        path.join(ROOT, 'core', 'audio', 'tts_adapter.py'),
        '--cues-in', cuesPath,
        '--out-wav', voiceTtsWav,
        '--out-cues', cuesTimedPath,
        '--speaker', speaker,
      ], { encoding: 'utf8' });

      if (ttsRes.status === 0 && fs.existsSync(voiceTtsWav) && fs.existsSync(cuesTimedPath)) {
        cues = JSON.parse(fs.readFileSync(cuesTimedPath, 'utf8'));
        const mixRes = spawnSync(pyBin, [
          path.join(ROOT, 'core', 'audio', 'audio_mixer.py'),
          '--voice-wav', voiceTtsWav,
          '--cues', cuesTimedPath,
          '--out-wav', mixedWav,
          '--mood', bgmMood,
          '--bgm-gain', String(bgmGain),
        ], { encoding: 'utf8' });

        if (mixRes.status === 0 && fs.existsSync(mixedWav)) {
          audioPath = mixedWav;
          writeJsonAtomic(ttsCachePath, { key: ttsCacheKey, providers: cues.ttsProviders || [] });
          console.log(`✅ Thai TTS (${(cues.ttsProviders || []).join(',')}) + SFX/BGM (${bgmMood}) -> ${cues.totalDurationSec}s`);
        } else {
          console.warn('⚠️ audio_mixer.py failed, using dry TTS voice:', mixRes.stderr || mixRes.stdout);
          audioPath = voiceTtsWav;
        }
      } else {
        console.warn('⚠️ Thai TTS failed/offline, falling back to deterministic fixture audio:', ttsRes.stderr || ttsRes.stdout);
      }
    }
  }

  // Audio-In (Philip's clone voice, locked 2026-11-15): never synthesize a
  // stand-in for Philip's voice. The real clone WAV must exist at
  // job.audio.sourcePath (private_assets/voice/, gitignored). Normalize it to
  // 48kHz mono, pad with silence to the authored timeline length, then mix
  // SFX + ducked BGM under it (BGM/SFX are approved).
  if (job.audio.mode === 'audio-in' && hasExplicitSource) {
    const totalDur = cues.totalDurationSec || 10.0;
    const voice48k = path.join(jobDir, 'voice_in_48k.wav');
    const mixedWav = path.join(jobDir, 'audio_mixed.wav');
    const durProbe = spawnSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      audioPath,
    ], { encoding: 'utf8' });
    const voiceDur = parseFloat((durProbe.stdout || '').trim());
    if (!Number.isFinite(voiceDur)) {
      throw new Error(`Audio-In source unreadable: ${job.audio.sourcePath} — place Philip's real clone voice WAV there (48kHz mono PCM).`);
    }
    if (voiceDur > totalDur + 0.05) {
      throw new Error(`Audio-In voice (${voiceDur.toFixed(2)}s) is longer than the authored timeline (${totalDur}s) — re-time cues.json to the real clone voice before rendering (see docs/PRIVATE_ASSETS.md).`);
    }
    const normRes = spawnSync('ffmpeg', [
      '-y', '-i', audioPath,
      '-af', 'aresample=48000,apad',
      '-t', String(totalDur),
      '-ac', '1', '-c:a', 'pcm_s16le',
      voice48k,
    ], { encoding: 'utf8' });
    if (normRes.status !== 0 || !fs.existsSync(voice48k)) {
      throw new Error(`Audio-In normalize failed for ${job.audio.sourcePath}: ${(normRes.stderr || '').slice(-500)}`);
    }
    const mixRes = spawnSync(findPython(), [
      path.join(ROOT, 'core', 'audio', 'audio_mixer.py'),
      '--voice-wav', voice48k,
      '--cues', cuesPath,
      '--out-wav', mixedWav,
      '--mood', job.audio.bgmMood || 'calm',
      '--bgm-gain', String(job.audio.bgmGain ?? 0.14),
    ], { encoding: 'utf8' });
    if (mixRes.status === 0 && fs.existsSync(mixedWav)) {
      audioPath = mixedWav;
      console.log(`✅ Clone voice (audio-in) + SFX/BGM (${job.audio.bgmMood || 'calm'}) -> ${totalDur}s`);
    } else {
      console.warn('⚠️ audio_mixer.py failed for audio-in voice, using dry clone voice:', mixRes.stderr || mixRes.stdout);
      audioPath = voice48k;
    }
  }

  if (!audioPath || !fs.existsSync(audioPath)) {
    // Locked 2026-11-15: a job that names a clone-voice file must never
    // silently render with synthetic fixture audio. Fail loudly instead.
    if (job.audio.mode === 'audio-in' && job.audio.sourcePath) {
      throw new Error(`Audio-In source missing: ${job.audio.sourcePath} — generate Philip's clone voice for this script on Colab (VoxCPM2) and place the 48kHz mono WAV at <repo>/private_assets/voice/ (gitignored, never commit voice files).`);
    }
    audioPath = path.join(jobDir, 'voice_fixture.wav');
    if (!fs.existsSync(audioPath)) {
      generateStyleAudioFixture({
        outWavPath: audioPath,
        durationSec: cues.totalDurationSec || 10.0,
        styleId: job.styleId,
        captions: cues.captions || [],
      });
      console.log(`ℹ️ Generated deterministic ${cues.totalDurationSec || 10}s fixture audio: ${path.relative(ROOT, audioPath)}`);
    }
  }

  const allVisemes = Array.isArray(cues.visemes)
    ? cues.visemes
    : (['liplnwza-mascot', 'stickman-duo'].includes(job.styleId)
      ? generateVisemeTrack(cues.captions || [])
      : []);

  const dimensions = job.aspect === '9:16' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
  const totalFrames = Math.round((cues.totalDurationSec || 10.0) * job.fps);

  const compiledScenes = cues.scenes.map((s) => {
    const startFrame = Math.round(s.startSec * job.fps);
    const endFrame = Math.round(s.endSec * job.fps);
    const sceneCaptions = (cues.captions || []).filter(
      (c) => c.endSec > s.startSec && c.startSec < s.endSec
    );
    const sceneVisemes = allVisemes.filter(
      (v) => v.endSec > s.startSec && v.startSec < s.endSec
    );
    return {
      sceneId: s.sceneId,
      recipe: s.recipe,
      startFrame,
      endFrame,
      headline: s.headline,
      captions: sceneCaptions,
      params: {
        ...(s.params || {}),
        subheadline: s.subheadline || '',
        ...(sceneVisemes.length > 0 ? { visemes: sceneVisemes } : {}),
      },
    };
  });

  const privateDir = job.privateAssetsDir || process.env.GENHALIPZA_PRIVATE_ASSETS || null;
  const privateMascotAssets = job.styleId === 'liplnwza-mascot' ? loadPrivateMascotAssets(privateDir) : null;

  const html = buildRendererHtml(ROOT);
  const rendererHash = sha256Json({ html });
  const inputHash = sha256Json({ job, cues, audioHash: sha256File(audioPath), hasPrivateAssets: Boolean(privateMascotAssets), rendererHash });
  const timeline = {
    schemaVersion: 1,
    jobId: job.jobId,
    revision: job.revision || 1,
    aspect: job.aspect,
    width: dimensions.width,
    height: dimensions.height,
    fps: job.fps,
    totalFrames,
    seed: job.seed,
    brandBadge: 'GenhaLipza',
    ...(job.captionStyle ? { captionStyle: job.captionStyle } : {}),
    ...(job.themeMode ? { themeMode: job.themeMode } : {}),
    ...(job.polish ? { polish: job.polish } : {}),
    buildIdentity: {
      engineVersion: '0.4.0-sprint1',
      rendererHash,
      styleId: job.styleId,
      styleVersion: '0.2.0',
      inputHash,
      fontHashes: {
        'Kanit-Regular.ttf': sha256File(path.join(ROOT, 'assets', 'fonts', 'Kanit-Regular.ttf')),
        'Kanit-SemiBold.ttf': sha256File(path.join(ROOT, 'assets', 'fonts', 'Kanit-SemiBold.ttf')),
        'Kanit-Bold.ttf': sha256File(path.join(ROOT, 'assets', 'fonts', 'Kanit-Bold.ttf')),
        'Kanit-ExtraBold.ttf': sha256File(path.join(ROOT, 'assets', 'fonts', 'Kanit-ExtraBold.ttf')),
        'Prompt-Regular.ttf': sha256File(path.join(ROOT, 'assets', 'fonts', 'Prompt-Regular.ttf')),
        'Prompt-Bold.ttf': sha256File(path.join(ROOT, 'assets', 'fonts', 'Prompt-Bold.ttf')),
        'NotoSansThai.ttf': sha256File(path.join(ROOT, 'assets', 'fonts', 'NotoSansThai.ttf')),
      },
    },
    scenes: compiledScenes,
  };

  const validateTimeline = loadValidator('timeline.schema.json');
  if (!validateTimeline(timeline)) {
    throw new Error(`Compiled timeline invalid: ${JSON.stringify(validateTimeline.errors)}`);
  }
  const timelinePath = path.join(jobDir, 'timeline.json');
  writeJsonAtomic(timelinePath, timeline);
  const srtPath = path.join(jobDir, 'subtitles.srt');
  fs.writeFileSync(srtPath, buildSrt(timeline));

  const approvalsPath = path.join(jobDir, 'approvals.json');
  invalidateStaleApprovals(approvalsPath, inputHash);

  const sceneHashes = computeSceneHashes(timeline);
  const frameCachePath = path.join(jobDir, 'frame_cache.json');
  const frameCache = fs.existsSync(frameCachePath) ? JSON.parse(fs.readFileSync(frameCachePath, 'utf8')) : {};

  console.log(`✅ Gate 2 (Compile Timeline): ${totalFrames} frames @ ${job.fps}fps (visemes=${allVisemes.length}, inputHash=${inputHash})`);

  // Launch Chromium once (warm reuse)
  const chromiumPath = findChromium();
  const browser = await chromium.launch({
    executablePath: chromiumPath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const gate4Keyframes = [];
  let renderedCount = 0;
  let cacheHits = 0;

  try {
    const page = await browser.newPage({ viewport: { width: timeline.width, height: timeline.height } });
    await page.setContent(html, { waitUntil: 'load' });

    if (job.styleId === 'wonlok-plus') {
      const geojsonPath = path.join(ROOT, 'assets', 'maps', 'ne_110m_countries.geojson');
      if (fs.existsSync(geojsonPath)) {
        const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
        await page.evaluate((g) => window.setGeoJsonData(g), geojson);
      }
    }

    if (privateMascotAssets) {
      await page.evaluate((assets) => window.setMascotAssets(assets), privateMascotAssets);
      console.log('ℹ️ Loaded private owner mascot clean-plates from external privateAssetsDir');
    }

    // Gate 3: Layout Sketch
    const tG3 = Date.now();
    const sketchPngs = [];
    for (const sc of timeline.scenes) {
      const midFrame = Math.floor((sc.startFrame + sc.endFrame) / 2);
      await page.evaluate(
        ({ tl, fi }) => window.renderTimelineFrame(tl, fi, 'sketch'),
        { tl: timeline, fi: midFrame }
      );
      const outPng = path.join(g3Dir, `sketch_${sc.sceneId}.png`);
      await page.screenshot({ path: outPng, type: 'png' });
      sketchPngs.push(outPng);
    }
    const sketchSheet = path.join(jobDir, 'gate3_sketch.png');
    execFileSync('ffmpeg', [
      '-y',
      ...sketchPngs.flatMap((p) => ['-i', p]),
      '-filter_complex', `hstack=inputs=${sketchPngs.length},scale=1440:-1`,
      sketchSheet,
    ], { stdio: 'ignore' });
    console.log(`✅ Gate 3 (Layout Sketch): ${sketchPngs.length} scenes in ${Date.now() - tG3}ms`);

    // Gate 4: Visual Storyboard (1 dynamic keyframe per scene)
    const tG4 = Date.now();
    const keyframeIndices = timeline.scenes.map((sc) => ({
      sceneId: sc.sceneId,
      frameIndex: Math.floor(sc.startFrame + (sc.endFrame - sc.startFrame) * 0.45),
    }));
    for (const kf of keyframeIndices) {
      await page.evaluate(
        ({ tl, fi }) => window.renderTimelineFrame(tl, fi, 'final'),
        { tl: timeline, fi: kf.frameIndex }
      );
      const fullPng = path.join(g4Dir, `storyboard_${kf.sceneId}_f${kf.frameIndex}.png`);
      await page.screenshot({ path: fullPng, type: 'png' });
      gate4Keyframes.push({ ...kf, pngPath: fullPng });
    }
    const storyboardSheet = path.join(jobDir, 'gate4_storyboard.png');
    execFileSync('ffmpeg', [
      '-y',
      ...gate4Keyframes.flatMap((k) => ['-i', k.pngPath]),
      '-filter_complex', `hstack=inputs=${gate4Keyframes.length},scale=1440:-1`,
      storyboardSheet,
    ], { stdio: 'ignore' });
    console.log(`✅ Gate 4 (Visual Storyboard): ${gate4Keyframes.length} keyframes + sheet in ${Date.now() - tG4}ms`);

    // Gate 5: Render frames with per-scene cache & atomic checkpointing
    for (const file of fs.readdirSync(framesDir)) {
      const m = file.match(/^frame_(\d{5})\.png$/);
      if (m && Number(m[1]) >= totalFrames) {
        fs.unlinkSync(path.join(framesDir, file));
      }
    }
    const tG5 = Date.now();
    for (let f = 0; f < totalFrames; f++) {
      const sc = timeline.scenes.find((s) => f >= s.startFrame && f < s.endFrame)
        || timeline.scenes[timeline.scenes.length - 1];
      const expectedKey = sceneHashes.scenes[sc.sceneId];
      const frameFile = path.join(framesDir, `frame_${String(f).padStart(5, '0')}.png`);

      if (frameCache[f] === expectedKey && fs.existsSync(frameFile)) {
        cacheHits++;
        continue;
      }

      await page.evaluate(
        ({ tl, fi }) => window.renderTimelineFrame(tl, fi, 'final'),
        { tl: timeline, fi: f }
      );
      await page.screenshot({ path: frameFile, type: 'png' });
      frameCache[f] = expectedKey;
      renderedCount++;

      if (renderedCount % 30 === 0) {
        writeJsonAtomic(frameCachePath, frameCache);
      }
    }
    writeJsonAtomic(frameCachePath, frameCache);
    console.log(`✅ Gate 5 (Frame Render): rendered=${renderedCount}, cacheHits=${cacheHits} in ${((Date.now() - tG5) / 1000).toFixed(2)}s`);
  } finally {
    await browser.close();
  }

  // Gate 4 Motion Probe (2.0s around first scene transition)
  if (!args.skipProbe && totalFrames >= 180) {
    const probeStart = Math.max(0, Math.min(totalFrames - 60, (timeline.scenes[0]?.endFrame || 150) - 30));
    const probeMp4 = path.join(jobDir, 'gate4_motion_probe.mp4');
    execFileSync('ffmpeg', [
      '-y',
      '-framerate', String(job.fps),
      '-start_number', String(probeStart),
      '-i', path.join(framesDir, 'frame_%05d.png'),
      '-frames:v', '60',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22',
      probeMp4,
    ], { stdio: 'ignore' });
    console.log('✅ Gate 4 (Motion Probe): 2.0s transition clip -> gate4_motion_probe.mp4');
  }

  // Gate 5 Audio: 2-pass loudnorm (-16 LUFS, TP=-2.0 target)
  const p1 = spawnSync('ffmpeg', [
    '-hide_banner', '-i', audioPath,
    '-af', 'loudnorm=I=-16:TP=-2.0:LRA=11:print_format=json',
    '-f', 'null', '-',
  ], { encoding: 'utf8' });
  const lnMatch = p1.stderr.match(/\{[\s\S]*"input_i"[\s\S]*\}/);
  if (!lnMatch) throw new Error('Loudnorm pass 1 failed');
  const ln1 = JSON.parse(lnMatch[0]);
  const p2Filter = `loudnorm=I=-16:TP=-2.0:LRA=11:measured_I=${ln1.input_i}:measured_TP=${ln1.input_tp}:measured_LRA=${ln1.input_lra}:measured_thresh=${ln1.input_thresh}:offset=${ln1.target_offset}:linear=true`;

  const finalMp4 = path.join(jobDir, 'final.mp4');
  const muxRes = spawnSync('ffmpeg', [
    '-y',
    '-framerate', String(job.fps),
    '-i', path.join(framesDir, 'frame_%05d.png'),
    '-i', audioPath,
    '-frames:v', String(totalFrames),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '18',
    '-af', p2Filter,
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-shortest', '-movflags', '+faststart',
    finalMp4,
  ], { encoding: 'utf8' });
  if (muxRes.status !== 0) {
    throw new Error(`FFmpeg mux failed: ${muxRes.stderr}`);
  }

  // Contact sheet (10 frames across full duration in 5x2 grid)
  const durationSec = totalFrames / job.fps;
  const sampleFps = (10 / Math.max(1, durationSec)).toFixed(4);
  const contactSheet = path.join(jobDir, 'contact_sheet.jpg');
  execFileSync('ffmpeg', [
    '-y', '-i', finalMp4,
    '-vf', `fps=${sampleFps},scale=360:-1,tile=5x2`,
    '-frames:v', '1',
    contactSheet,
  ], { stdio: 'ignore' });

  // Automated QC + Gate 4 parity check
  const qcReport = runPostRenderQc({
    jobDir,
    timeline,
    finalMp4Path: finalMp4,
    gate4Keyframes,
  });

  // Update pipeline_state.json & approvals.json
  const nowIso = new Date().toISOString();
  const state = {
    schemaVersion: 1,
    jobId: job.jobId,
    revision: timeline.revision,
    updatedAt: nowIso,
    gates: {
      gate1: { status: 'ready', inputHash, artifactPath: 'facts.md', updatedAt: nowIso },
      gate2: { status: 'ready', inputHash, artifactHash: sha256File(timelinePath), artifactPath: 'timeline.json', updatedAt: nowIso },
      gate3: { status: 'ready', inputHash, artifactHash: sha256File(path.join(jobDir, 'gate3_sketch.png')), artifactPath: 'gate3_sketch.png', updatedAt: nowIso },
      gate4: { status: 'ready', inputHash, artifactHash: sha256File(path.join(jobDir, 'gate4_storyboard.png')), artifactPath: 'gate4_storyboard.png', updatedAt: nowIso },
      gate5: { status: qcReport.passed ? 'ready' : 'failed', inputHash, artifactHash: sha256File(finalMp4), artifactPath: 'final.mp4', updatedAt: nowIso },
    },
  };
  const validateState = loadValidator('pipeline_state.schema.json');
  if (!validateState(state)) throw new Error(`Invalid pipeline_state: ${JSON.stringify(validateState.errors)}`);
  writeJsonAtomic(path.join(jobDir, 'pipeline_state.json'), state);

  const existingApprovals = fs.existsSync(approvalsPath)
    ? JSON.parse(fs.readFileSync(approvalsPath, 'utf8'))
    : { schemaVersion: 1, jobId: job.jobId, records: [] };
  existingApprovals.records.push({
    gate: 'gate5',
    revision: timeline.revision,
    approvedBy: 'pending-owner-review',
    approvedAt: nowIso,
    scope: 'automated-qc-only',
    inputHash,
    artifactHash: sha256File(finalMp4),
    notes: `Automated QC completed (rendered=${renderedCount}, cacheHits=${cacheHits}); awaiting Philip review.`,
  });
  const validateApprovals = loadValidator('approvals.schema.json');
  if (!validateApprovals(existingApprovals)) throw new Error(`Invalid approvals: ${JSON.stringify(validateApprovals.errors)}`);
  writeJsonAtomic(approvalsPath, existingApprovals);

  console.log('\n=== Gate 5 QC Summary ===');
  console.log(JSON.stringify({ passed: qcReport.passed, renderedCount, cacheHits, audio: qcReport.audio, gate4Parity: qcReport.gate4Parity }, null, 2));

  if (!qcReport.passed) {
    console.error('\n❌ Automated QC failed!');
    process.exitCode = 1;
  }
} finally {
  releaseLock();
}
