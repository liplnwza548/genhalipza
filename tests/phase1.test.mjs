import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  segmentThaiWords,
  validateThaiLines,
  wrapThaiText,
} from '../core/thai-text/thai-text.mjs';
import {
  acquireJobLock,
  computeSceneHashes,
  invalidateStaleApprovals,
  writeJsonAtomic,
} from '../core/engine/state-manager.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

test('Thai word segmentation keeps words intact and wraps without orphan tone marks', () => {
  const words = segmentThaiWords('เจาะเส้นทางรถไฟความเร็วสูงสายแรก');
  assert.ok(words.includes('เจาะ'));
  assert.ok(words.includes('เส้น'));
  assert.ok(words.includes('ทาง'));
  assert.ok(words.includes('รถไฟ'));

  const res = wrapThaiText(
    'เจาะเส้นทางรถไฟความเร็วสูงจากกรุงเทพมหานครสู่นครราชสีมา',
    20,
    (s) => s.length,
    3
  );
  assert.ok(res.lines.length >= 2);
  assert.equal(validateThaiLines(res.lines).valid, true);

  const bad = validateThaiLines(['ทดสอบ', '้ำพุ']);
  assert.equal(bad.valid, false);
});

test('Scene hashing isolates single-scene edits and invalidates stale approvals', () => {
  const baseTimeline = {
    width: 1080,
    height: 1920,
    fps: 30,
    seed: 4201,
    buildIdentity: { engineVersion: '0.2.0', styleId: 'pilot-map-route', styleVersion: '0.1.0', fontHashes: { p: 'abc' } },
    scenes: [
      { sceneId: 'scene-1', recipe: 'overview-route', startFrame: 0, endFrame: 150, headline: 'A', captions: [] },
      { sceneId: 'scene-2', recipe: 'zoom-destination', startFrame: 150, endFrame: 300, headline: 'B', captions: [] },
    ],
  };

  const h1 = computeSceneHashes(baseTimeline);
  const patched = structuredClone(baseTimeline);
  patched.scenes[1].headline = 'B-edited';
  const h2 = computeSceneHashes(patched);

  assert.equal(h1.scenes['scene-1'], h2.scenes['scene-1'], 'Unchanged scene-1 must keep identical hash');
  assert.notEqual(h1.scenes['scene-2'], h2.scenes['scene-2'], 'Edited scene-2 must get new hash');

  const tmpDir = path.join(ROOT, 'tmp', 'test_state');
  fs.mkdirSync(tmpDir, { recursive: true });
  const approvalsPath = path.join(tmpDir, 'approvals.json');
  writeJsonAtomic(approvalsPath, {
    schemaVersion: 1,
    jobId: 'test',
    records: [
      {
        gate: 'gate4',
        revision: 1,
        approvedBy: 'philip',
        approvedAt: new Date().toISOString(),
        scope: 'storyboard',
        inputHash: 'oldhash',
        artifactHash: 'arthash',
      },
    ],
  });

  const updated = invalidateStaleApprovals(approvalsPath, 'newhash');
  assert.equal(updated.records[0].scope, 'storyboard:stale');
});

test('Job directory single-writer lock prevents concurrent writers', () => {
  const lockDir = path.join(ROOT, 'tmp', 'test_lock');
  const release = acquireJobLock(lockDir);
  assert.throws(() => acquireJobLock(lockDir), /locked by another process/);
  release();
  const release2 = acquireJobLock(lockDir);
  release2();
});

test('TTS adapter --check returns structured availability JSON', () => {
  const out = execFileSync('python3', ['core/audio/tts_adapter.py', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const parsed = JSON.parse(out);
  assert.equal(parsed.provider, 'edge-tts');
  assert.equal(parsed.fallback, 'audio-in');
  assert.equal(typeof parsed.available, 'boolean');
});
