import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function sha256Json(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

export function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').slice(0, 16);
}

/**
 * Computes per-scene effective cache keys so editing one scene (with unchanged timing)
 * only invalidates that scene's frames, while global changes (seed, aspect, fonts, style)
 * invalidate all scenes.
 */
export function computeSceneHashes(timeline) {
  const globalKey = sha256Json({
    width: timeline.width,
    height: timeline.height,
    fps: timeline.fps,
    seed: timeline.seed,
    buildIdentity: {
      engineVersion: timeline.buildIdentity?.engineVersion,
      styleId: timeline.buildIdentity?.styleId,
      styleVersion: timeline.buildIdentity?.styleVersion,
      fontHashes: timeline.buildIdentity?.fontHashes,
    },
  });

  const hashes = {};
  for (const scene of timeline.scenes) {
    hashes[scene.sceneId] = sha256Json({
      globalKey,
      scene,
    });
  }
  return { globalKey, scenes: hashes };
}

/**
 * Atomic JSON write via temp file + rename to prevent partial/corrupted state on crash.
 */
export function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, filePath);
}

/**
 * Simple file-based single-writer lock per job directory.
 */
export function acquireJobLock(jobDir) {
  fs.mkdirSync(jobDir, { recursive: true });
  const lockPath = path.join(jobDir, '.pipeline.lock');
  if (fs.existsSync(lockPath)) {
    const pid = fs.readFileSync(lockPath, 'utf8').trim();
    throw new Error(`Job directory is locked by another process (pid=${pid}): ${lockPath}`);
  }
  fs.writeFileSync(lockPath, String(process.pid));
  return () => {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  };
}

/**
 * Marks existing approvals as stale if their inputHash no longer matches the current build.
 */
export function invalidateStaleApprovals(approvalsPath, currentInputHash) {
  if (!fs.existsSync(approvalsPath)) return null;
  const approvals = JSON.parse(fs.readFileSync(approvalsPath, 'utf8'));
  let changed = false;
  for (const rec of approvals.records || []) {
    if (rec.inputHash !== currentInputHash && !rec.scope.endsWith(':stale')) {
      rec.scope = `${rec.scope}:stale`;
      rec.notes = `${rec.notes || ''} [INVALIDATED: inputHash changed from ${rec.inputHash} to ${currentInputHash}]`.trim();
      changed = true;
    }
  }
  if (changed) {
    writeJsonAtomic(approvalsPath, approvals);
  }
  return approvals;
}
