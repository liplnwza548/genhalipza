import fs from 'node:fs';
import path from 'node:path';

/**
 * Generates self-contained HTML for Chromium with embedded Thai OFL fonts
 * and a deterministic window.renderTimelineFrame(timeline, frameIndex, mode) entrypoint.
 */
export function buildRendererHtml(rootDir) {
  const toFontDataUri = (filename) => {
    const b64 = fs.readFileSync(path.join(rootDir, 'assets', 'fonts', filename)).toString('base64');
    return `data:font/ttf;base64,${b64}`;
  };

  const promptReg = toFontDataUri('Prompt-Regular.ttf');
  const promptBold = toFontDataUri('Prompt-Bold.ttf');
  const notoThai = toFontDataUri('NotoSansThai.ttf');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <style>
    @font-face {
      font-family: 'Prompt';
      src: url('${promptReg}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Prompt';
      src: url('${promptBold}') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    @font-face {
      font-family: 'Noto Sans Thai';
      src: url('${notoThai}') format('truetype');
      font-weight: 100 900;
      font-style: normal;
    }
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #000;
    }
    canvas {
      display: block;
    }
  </style>
</head>
<body>
  <canvas id="stage" width="1080" height="1920"></canvas>
  <script>
    // Deterministic PRNG (Mulberry32)
    function mulberry32(seed) {
      let a = seed >>> 0;
      return function() {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }

    function easeOutCubic(x) {
      return 1 - Math.pow(1 - x, 3);
    }

    function cubicBezierPoint(p0, p1, p2, p3, t) {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;
      return {
        x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
        y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
      };
    }

    let fontsReadyPromise = null;
    async function ensureFonts() {
      if (!fontsReadyPromise) {
        fontsReadyPromise = Promise.all([
          document.fonts.load('400 40px "Prompt"'),
          document.fonts.load('700 64px "Prompt"'),
          document.fonts.load('600 42px "Noto Sans Thai"'),
        ]).then(() => document.fonts.ready);
      }
      await fontsReadyPromise;
      return {
        promptLoaded: document.fonts.check('700 64px "Prompt"'),
        notoLoaded: document.fonts.check('600 42px "Noto Sans Thai"'),
      };
    }

    function drawRoundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    const thWordSeg = new Intl.Segmenter('th', { granularity: 'word' });
    function wrapThaiLines(ctx, text, maxWidth, maxLines = 2) {
      const tokens = Array.from(thWordSeg.segment(String(text || '')), (s) => s.segment);
      const lines = [];
      let cur = '';
      for (const tok of tokens) {
        const cand = cur + tok;
        if (cur === '' || ctx.measureText(cand).width <= maxWidth) {
          cur = cand;
        } else {
          lines.push(cur.trimEnd());
          cur = tok.trimStart();
        }
      }
      if (cur.trim().length > 0) lines.push(cur.trimEnd());
      return lines.slice(0, maxLines);
    }

    window.renderTimelineFrame = async (timeline, frameIndex, mode = 'final') => {
      const fontStatus = await ensureFonts();
      const canvas = document.getElementById('stage');
      if (canvas.width !== timeline.width || canvas.height !== timeline.height) {
        canvas.width = timeline.width;
        canvas.height = timeline.height;
      }
      const ctx = canvas.getContext('2d');
      const W = timeline.width;
      const H = timeline.height;
      const t = frameIndex / timeline.fps;
      const isSketch = mode === 'sketch';

      const scene = timeline.scenes.find((s) => frameIndex >= s.startFrame && frameIndex < s.endFrame)
        || timeline.scenes[timeline.scenes.length - 1];
      const sceneDurFrames = Math.max(1, scene.endFrame - scene.startFrame);
      const p = clamp((frameIndex - scene.startFrame) / sceneDurFrames, 0, 1);

      // 1. Background
      if (isSketch) {
        ctx.fillStyle = '#f4f6f9';
        ctx.fillRect(0, 0, W, H);
      } else {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#070d1f');
        bg.addColorStop(0.55, '#0d1b38');
        bg.addColorStop(1, '#081022');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
      }

      // 2. Stylized Map Grid & Contours (Deterministic via seed)
      ctx.save();
      const gridStep = 90;
      ctx.strokeStyle = isSketch ? 'rgba(100, 116, 139, 0.25)' : 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= W; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Stylized terrain polygons
      const rng = mulberry32(timeline.seed + (scene.sceneId === 'scene-2' ? 99 : 0));
      ctx.fillStyle = isSketch ? 'rgba(148, 163, 184, 0.16)' : 'rgba(30, 58, 138, 0.28)';
      ctx.strokeStyle = isSketch ? 'rgba(71, 85, 105, 0.4)' : 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const cx = 180 + rng() * 720;
        const cy = 520 + rng() * 720;
        const rx = 120 + rng() * 180;
        const ry = 80 + rng() * 140;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // 3. Scene-specific Vector Map Route
      ctx.save();
      const p0 = { x: 250, y: 1180 };
      const p1 = { x: 340, y: 880 };
      const p2 = { x: 700, y: 940 };
      const p3 = { x: 820, y: 650 };

      if (scene.recipe === 'zoom-destination') {
        const zoom = 1 + 0.28 * easeOutCubic(p);
        ctx.translate(p3.x, p3.y);
        ctx.scale(zoom, zoom);
        ctx.translate(-p3.x, -p3.y);
      }

      // Route base track
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      ctx.strokeStyle = isSketch ? '#94a3b8' : 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 10;
      ctx.setLineDash([16, 12]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated active route
      const routeProgress = scene.recipe === 'overview-route' ? easeOutCubic(clamp(p * 1.25, 0, 1)) : 1;
      const steps = 48;
      const maxStep = Math.max(1, Math.floor(steps * routeProgress));
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      let head = p0;
      for (let i = 1; i <= maxStep; i++) {
        const pt = cubicBezierPoint(p0, p1, p2, p3, i / steps);
        ctx.lineTo(pt.x, pt.y);
        head = pt;
      }
      if (!isSketch) {
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 22;
      }
      ctx.strokeStyle = isSketch ? '#0f172a' : '#00e5ff';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pulse ring on destination / head
      const pulse = (Math.sin(t * Math.PI * 3) + 1) * 0.5;
      const targetPt = scene.recipe === 'zoom-destination' ? p3 : head;
      ctx.beginPath();
      ctx.arc(targetPt.x, targetPt.y, 24 + pulse * 26, 0, Math.PI * 2);
      ctx.strokeStyle = isSketch ? '#334155' : 'rgba(255, 59, 107, 0.65)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // City pins
      const pins = [
        { pt: p0, label: 'กรุงเทพฯ', color: '#38bdf8' },
        { pt: p3, label: 'นครราชสีมา', color: '#ff3b6b' },
      ];
      for (const pin of pins) {
        ctx.fillStyle = isSketch ? '#1e293b' : pin.color;
        ctx.beginPath();
        ctx.arc(pin.pt.x, pin.pt.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Label badge
        ctx.font = '700 34px "Prompt"';
        const tw = ctx.measureText(pin.label).width;
        const bx = pin.pt.x - (tw + 36) / 2;
        const by = pin.pt.y - 76;
        drawRoundRect(ctx, bx, by, tw + 36, 52, 12);
        ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(15, 23, 42, 0.88)';
        ctx.fill();
        ctx.strokeStyle = isSketch ? '#0f172a' : pin.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pin.label, pin.pt.x, by + 27);
      }

      // Metric Pill
      const badgeText = scene.params?.distanceBadge || scene.params?.highlightMetric || '';
      if (badgeText) {
        const mx = 540;
        const my = 860;
        ctx.font = '700 38px "Prompt"';
        const bw = ctx.measureText(badgeText).width + 52;
        drawRoundRect(ctx, mx - bw / 2, my - 34, bw, 68, 34);
        ctx.fillStyle = isSketch ? '#e2e8f0' : '#ff3b6b';
        ctx.fill();
        if (isSketch) {
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, mx, my + 2);
      }
      ctx.restore();

      // 4. Safe Area & Typography (Headline + Phrase Captions)
      const safeX = 80;
      const safeY = 220;
      const safeW = 920;
      const safeH = 1320;

      if (isSketch) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.strokeRect(safeX, safeY, safeW, safeH);
        ctx.setLineDash([]);
      }

      // Headline box
      const headline = scene.headline || '';
      const subheadline = scene.params?.subheadline || '';
      if (isSketch) {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(100, 250, 880, 175);
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
      ctx.font = '700 60px "Prompt"';
      const headLines = wrapThaiLines(ctx, headline, 840, 2);
      headLines.forEach((ln, idx) => {
        ctx.fillText(ln, 540, 315 + idx * 66);
      });

      if (subheadline) {
        const subY = headLines.length > 1 ? 430 : 390;
        ctx.fillStyle = isSketch ? '#334155' : '#ffd166';
        ctx.font = '600 40px "Noto Sans Thai"';
        const subLines = wrapThaiLines(ctx, subheadline, 840, 1);
        ctx.fillText(subLines[0] || '', 540, subY);
      }

      // Active Phrase Caption
      const activeCap = (scene.captions || []).find((c) => t >= c.startSec && t <= c.endSec);
      if (isSketch) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(100, 1340, 880, 130);
      }
      if (activeCap) {
        drawRoundRect(ctx, 100, 1340, 880, 130, 22);
        ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(7, 13, 31, 0.86)';
        ctx.fill();
        ctx.strokeStyle = isSketch ? '#dc2626' : 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
        ctx.font = '700 42px "Noto Sans Thai"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const capLines = wrapThaiLines(ctx, activeCap.text, 820, 2);
        if (capLines.length === 1) {
          ctx.fillText(capLines[0], 540, 1406);
        } else {
          ctx.fillText(capLines[0], 540, 1382);
          ctx.fillText(capLines[1], 540, 1432);
        }
      }

      // 5. Sketch Metadata Header (Preview-only)
      if (isSketch) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, 90);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 30px "Prompt"';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          'GATE 3 SKETCH | ' + scene.sceneId + ' | t=' + t.toFixed(2) + 's | ' + timeline.aspect + ' | rev ' + timeline.revision,
          40,
          45
        );
      }

      return { fontStatus, sceneId: scene.sceneId, t };
    };
  </script>
</body>
</html>`;
}
