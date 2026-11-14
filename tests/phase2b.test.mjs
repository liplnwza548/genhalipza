import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { estimateVisemesForCue, generateVisemeTrack } from '../core/audio/thai_visemes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

test('Thai viseme estimator produces valid deduplicated mouth shapes', () => {
  const events = estimateVisemesForCue('มาลดค่าไฟกันครับ', 0.5, 2.5);
  assert.ok(events.length >= 2);
  const validShapes = new Set(['A', 'E', 'I', 'O', 'U', 'REST']);
  for (let i = 0; i < events.length; i++) {
    assert.ok(validShapes.has(events[i].viseme));
    assert.ok(events[i].endSec > events[i].startSec);
    if (i > 0) {
      assert.ok(events[i].startSec >= events[i - 1].endSec - 0.001);
    }
  }

  const track = generateVisemeTrack([
    { text: 'สวัสดี', startSec: 0.3, endSec: 1.5 },
    { text: 'โลกใบใหม่', startSec: 1.7, endSec: 3.2 },
  ]);
  assert.ok(track.length >= 3);
});

test('All MVP-4 style manifests validate against style.manifest.schema.json', () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', 'style.manifest.schema.json'), 'utf8'));
  const validate = ajv.compile(schema);

  const expectedStyles = ['wonlok-plus', 'liplnwza-mascot', 'stickman-duo', 'mystery-stage'];
  for (const styleId of expectedStyles) {
    const manifestPath = path.join(ROOT, 'styles', 'mvp-4', styleId, 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), `Missing manifest for ${styleId}`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const ok = validate(manifest);
    assert.equal(ok, true, `Manifest validation failed for ${styleId}: ${JSON.stringify(validate.errors)}`);
    assert.equal(manifest.id, styleId);
  }
});
