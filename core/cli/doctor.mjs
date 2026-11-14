import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

function runCmd(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    return null;
  }
}

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
  return null;
}

const checks = [];
function record(name, ok, detail) {
  checks.push({ name, ok, detail });
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${name}: ${detail}`);
}

console.log('=== GenhaLipza Environment Doctor (Phase 0A) ===\n');

// 1. Node.js
const nodeMajor = Number(process.versions.node.split('.')[0]);
record('Node.js', nodeMajor >= 20, `v${process.versions.node} (require >= 20)`);

// 2. Python 3
const pyVer = runCmd('python3', ['--version']);
record('Python 3', Boolean(pyVer), pyVer || 'not found');

// 3. FFmpeg & required codecs/filters
const ffmpegVer = runCmd('ffmpeg', ['-version']);
const ffmpegFirstLine = ffmpegVer ? ffmpegVer.split('\n')[0] : 'not found';
const encoders = runCmd('ffmpeg', ['-hide_banner', '-encoders']) || '';
const filters = runCmd('ffmpeg', ['-hide_banner', '-filters']) || '';
const hasH264 = encoders.includes('libx264');
const hasAac = encoders.includes(' aac ');
const hasLoudnorm = filters.includes('loudnorm');
record('FFmpeg', Boolean(ffmpegVer), ffmpegFirstLine);
record('FFmpeg Capabilities', hasH264 && hasAac && hasLoudnorm, `libx264=${hasH264}, aac=${hasAac}, loudnorm=${hasLoudnorm}`);

// 4. Chromium
const chromiumPath = findChromium();
const chromiumVer = chromiumPath ? runCmd(chromiumPath, ['--version']) : null;
record('Chromium', Boolean(chromiumPath && chromiumVer), chromiumPath ? `${chromiumPath} (${chromiumVer})` : 'not found');

// 5. Thai OFL Fonts in assets/fonts/
const fontsDir = path.join(ROOT, 'assets', 'fonts');
const requiredFonts = ['Prompt-Regular.ttf', 'Prompt-Bold.ttf', 'NotoSansThai.ttf'];
const missingFonts = requiredFonts.filter((f) => !fs.existsSync(path.join(fontsDir, f)));
record('Thai OFL Fonts', missingFonts.length === 0, missingFonts.length === 0 ? `${requiredFonts.join(', ')} present in assets/fonts/` : `Missing: ${missingFonts.join(', ')}`);

// 6. Schemas
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const schemasDir = path.join(ROOT, 'schemas');
const schemaFiles = fs.existsSync(schemasDir)
  ? fs.readdirSync(schemasDir).filter((f) => f.endsWith('.schema.json'))
  : [];
let schemasOk = schemaFiles.length >= 5;
for (const f of schemaFiles) {
  try {
    ajv.compile(JSON.parse(fs.readFileSync(path.join(schemasDir, f), 'utf8')));
  } catch {
    schemasOk = false;
  }
}
record('JSON Schemas', schemasOk, `${schemaFiles.length} schemas compiled`);

const failed = checks.filter((c) => !c.ok);
console.log(`\nSummary: ${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length > 0) {
  process.exit(1);
}
