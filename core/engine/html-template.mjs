import fs from 'node:fs';
import path from 'node:path';
import { getMascotRigScript } from '../rig/mascot-rig.mjs';
import { getStickmanRigScript } from '../rig/stickman-rig.mjs';
import { getMysteryFxScript } from '../atmosphere/mystery-fx.mjs';
import { getMascotStyleScript } from './styles/liplnwza-mascot.mjs';
import { getStickmanStyleScript } from './styles/stickman-duo.mjs';
import { getMysteryStyleScript } from './styles/mystery-stage.mjs';
import { getWonlokStyleScript } from './styles/wonlok-plus.mjs';
import { getSubtitlesScript } from './subtitles.mjs';
import { getPolishScript } from './polish.mjs';

/**
 * Self-contained HTML5 Canvas renderer for Chromium.
 * Dispatches cleanly across all MVP styles with multi-style Thai subtitles & MotionForge Polish:
 *   - pilot-map-route / wonlok-plus (GeoJSON Web Mercator + Neon Routes + Smart Labels + Compare)
 *   - liplnwza-mascot (AoT Paper / Studio Dark 3-Zone Stage + Cel-Shaded Mascot + Viseme Lip-Sync)
 *   - stickman-duo (Parametric 2-Speaker Stickman Dialogue)
 *   - mystery-stage (Fog + Candle + Flashlight + Evidence Board + Red Thread)
 */
export function buildRendererHtml(rootDir) {
  const toFontDataUri = (filename) => {
    const b64 = fs.readFileSync(path.join(rootDir, 'assets', 'fonts', filename)).toString('base64');
    return `data:font/ttf;base64,${b64}`;
  };

  const promptReg = toFontDataUri('Prompt-Regular.ttf');
  const promptBold = toFontDataUri('Prompt-Bold.ttf');
  const notoThai = toFontDataUri('NotoSansThai.ttf');
  const kanitReg = toFontDataUri('Kanit-Regular.ttf');
  const kanitSemi = toFontDataUri('Kanit-SemiBold.ttf');
  const kanitBold = toFontDataUri('Kanit-Bold.ttf');
  const kanitExtra = toFontDataUri('Kanit-ExtraBold.ttf');

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
    @font-face {
      font-family: 'Kanit';
      src: url('${kanitReg}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Kanit';
      src: url('${kanitSemi}') format('truetype');
      font-weight: 600;
      font-style: normal;
    }
    @font-face {
      font-family: 'Kanit';
      src: url('${kanitBold}') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    @font-face {
      font-family: 'Kanit';
      src: url('${kanitExtra}') format('truetype');
      font-weight: 800;
      font-style: normal;
    }
    html, body { margin: 0; padding: 0; overflow: hidden; background: #000; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="stage" width="1080" height="1920"></canvas>
  <script>
    window.__GEOJSON__ = null;
    window.setGeoJsonData = (geojson) => {
      window.__GEOJSON__ = geojson;
    };

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

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
    function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

    function cubicBezierPoint(p0, p1, p2, p3, t) {
      const u = 1 - t, tt = t * t, uu = u * u, uuu = uu * u, ttt = tt * t;
      return {
        x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
        y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
      };
    }

    function mercatorY(latDeg) {
      const lat = clamp(latDeg, -85, 85) * Math.PI / 180;
      return Math.log(Math.tan(Math.PI / 4 + lat / 2));
    }

    function projectLonLat(lon, lat, camLon, camLat, zoom, W, H) {
      const scale = (W / (2 * Math.PI)) * zoom;
      let dLon = lon - camLon;
      if (dLon > 180) dLon -= 360;
      if (dLon < -180) dLon += 360;
      const x = W / 2 + (dLon * Math.PI / 180) * scale;
      const y = H * 0.52 - (mercatorY(lat) - mercatorY(camLat)) * scale;
      return { x, y };
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

    function drawPolygonRings(ctx, rings, camLon, camLat, zoom, W, H) {
      for (const ring of rings) {
        if (!ring || ring.length < 2) continue;
        const pts = [];
        let wrapsAntimeridian = false;
        for (let i = 0; i < ring.length; i++) {
          const [lon, lat] = ring[i];
          const pt = projectLonLat(lon, lat, camLon, camLat, zoom, W, H);
          if (i > 0 && Math.abs(pt.x - pts[i - 1].x) > W * 0.65) {
            wrapsAntimeridian = true;
            break;
          }
          pts.push(pt);
        }
        if (wrapsAntimeridian) continue;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
          else ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    function drawGeoBaseAndHighlight(ctx, scene, p, W, H, isSketch) {
      const camFrom = scene.params?.camFrom || { lon: 101.0, lat: 14.0, zoom: 12 };
      const camTo = scene.params?.camTo || camFrom;
      const camT = easeInOutCubic(p);
      const camLon = lerp(camFrom.lon, camTo.lon, camT);
      const camLat = lerp(camFrom.lat, camTo.lat, camT);
      const zoom = lerp(camFrom.zoom, camTo.zoom, camT);

      ctx.strokeStyle = isSketch ? 'rgba(100, 116, 139, 0.2)' : 'rgba(56, 189, 248, 0.09)';
      ctx.lineWidth = 1.5;
      for (let lon = -180; lon <= 180; lon += 10) {
        const a = projectLonLat(lon, -75, camLon, camLat, zoom, W, H);
        const b = projectLonLat(lon, 75, camLon, camLat, zoom, W, H);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (let lat = -60; lat <= 75; lat += 10) {
        const a = projectLonLat(-180, lat, camLon, camLat, zoom, W, H);
        const b = projectLonLat(180, lat, camLon, camLat, zoom, W, H);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      const highlightSet = new Set((scene.params?.highlightCountries || []).map((c) => String(c).toUpperCase()));
      const features = window.__GEOJSON__?.features || [];

      ctx.fillStyle = isSketch ? 'rgba(148, 163, 184, 0.18)' : 'rgba(30, 41, 59, 0.85)';
      ctx.strokeStyle = isSketch ? 'rgba(71, 85, 105, 0.45)' : 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.8;

      const highlightedFeatures = [];
      for (const feat of features) {
        const iso = String(feat.properties?.ADM0_A3 || feat.properties?.ISO_A3 || '').toUpperCase();
        if (highlightSet.has(iso)) {
          highlightedFeatures.push(feat);
          continue;
        }
        const geom = feat.geometry;
        if (!geom) continue;
        if (geom.type === 'Polygon') {
          drawPolygonRings(ctx, geom.coordinates, camLon, camLat, zoom, W, H);
        } else if (geom.type === 'MultiPolygon') {
          for (const poly of geom.coordinates) {
            drawPolygonRings(ctx, poly, camLon, camLat, zoom, W, H);
          }
        }
      }

      if (highlightedFeatures.length > 0) {
        ctx.save();
        ctx.fillStyle = isSketch ? 'rgba(37, 99, 235, 0.22)' : 'rgba(14, 165, 233, 0.35)';
        ctx.strokeStyle = isSketch ? '#1d4ed8' : '#38bdf8';
        ctx.lineWidth = 3.5;
        if (!isSketch) { ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 18; }
        for (const feat of highlightedFeatures) {
          const geom = feat.geometry;
          if (!geom) continue;
          if (geom.type === 'Polygon') {
            drawPolygonRings(ctx, geom.coordinates, camLon, camLat, zoom, W, H);
          } else if (geom.type === 'MultiPolygon') {
            for (const poly of geom.coordinates) {
              drawPolygonRings(ctx, poly, camLon, camLat, zoom, W, H);
            }
          }
        }
        ctx.restore();
      }
      return { camLon, camLat, zoom };
    }

    function drawWonlokRoutesAndMarkers(ctx, scene, cam, p, t, W, H, isSketch) {
      const routes = scene.params?.routes || [];
      for (const rt of routes) {
        const p0 = projectLonLat(rt.from[0], rt.from[1], cam.camLon, cam.camLat, cam.zoom, W, H);
        const p3 = projectLonLat(rt.to[0], rt.to[1], cam.camLon, cam.camLat, cam.zoom, W, H);
        const midX = (p0.x + p3.x) / 2;
        const midY = (p0.y + p3.y) / 2 - Math.hypot(p3.x - p0.x, p3.y - p0.y) * 0.22;
        const p1 = { x: lerp(p0.x, midX, 0.5), y: lerp(p0.y, midY, 0.7) };
        const p2 = { x: lerp(p3.x, midX, 0.5), y: lerp(p0.y, midY, 0.7) };

        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.strokeStyle = isSketch ? '#94a3b8' : 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 7; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.setLineDash([]);

        const prog = rt.animate === false ? 1 : easeOutCubic(clamp(p * 1.25, 0, 1));
        const maxStep = Math.max(1, Math.floor(48 * prog));
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y);
        let head = p0;
        for (let i = 1; i <= maxStep; i++) {
          const pt = cubicBezierPoint(p0, p1, p2, p3, i / 48);
          ctx.lineTo(pt.x, pt.y); head = pt;
        }
        ctx.save();
        if (!isSketch) { ctx.shadowColor = rt.color || '#00e5ff'; ctx.shadowBlur = 20; }
        ctx.strokeStyle = isSketch ? '#0f172a' : (rt.color || '#00e5ff');
        ctx.lineWidth = 9; ctx.stroke();
        ctx.restore();

        const pulse = (Math.sin(t * Math.PI * 3) + 1) * 0.5;
        ctx.beginPath(); ctx.arc(head.x, head.y, 18 + pulse * 22, 0, Math.PI * 2);
        ctx.strokeStyle = isSketch ? '#334155' : 'rgba(255, 59, 107, 0.75)';
        ctx.lineWidth = 4; ctx.stroke();

        for (const [pt, lbl, col] of [[p0, rt.fromLabel, '#38bdf8'], [p3, rt.toLabel, '#ff3b6b']]) {
          ctx.fillStyle = isSketch ? '#1e293b' : col;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
          if (lbl) {
            ctx.font = '700 30px "Prompt"';
            const tw = ctx.measureText(lbl).width;
            const bx = clamp(pt.x - (tw + 30) / 2, 90, W - tw - 120);
            const by = pt.y - 68;
            drawRoundRect(ctx, bx, by, tw + 30, 46, 10);
            ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(15, 23, 42, 0.9)'; ctx.fill();
            ctx.strokeStyle = isSketch ? '#0f172a' : col; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(lbl, bx + (tw + 30) / 2, by + 24);
          }
        }

        if (rt.badge) {
          const midPt = cubicBezierPoint(p0, p1, p2, p3, 0.5);
          const dist = Math.hypot(p3.x - p0.x, p3.y - p0.y);
          const badgeY = dist < 240 ? Math.max(p0.y, p3.y) + 46 : midPt.y;
          ctx.font = '700 32px "Prompt"';
          const bw = ctx.measureText(rt.badge).width + 44;
          drawRoundRect(ctx, midPt.x - bw / 2, badgeY - 30, bw, 58, 29);
          ctx.fillStyle = isSketch ? '#e2e8f0' : (rt.badgeColor || '#ff3b6b'); ctx.fill();
          if (isSketch) { ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke(); }
          ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(rt.badge, midPt.x, badgeY + 1);
        }
      }

      for (const mk of scene.params?.markers || []) {
        const pt = projectLonLat(mk.lon, mk.lat, cam.camLon, cam.camLat, cam.zoom, W, H);
        const pulse = (Math.sin(t * Math.PI * 3.5) + 1) * 0.5;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 26 + pulse * 30, 0, Math.PI * 2);
        ctx.strokeStyle = isSketch ? '#334155' : 'rgba(255, 209, 102, 0.8)';
        ctx.lineWidth = 4; ctx.stroke();
        ctx.fillStyle = isSketch ? '#0f172a' : '#ff3b6b';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 16, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5; ctx.stroke();
        if (mk.label) {
          ctx.font = '700 34px "Prompt"';
          const tw = ctx.measureText(mk.label).width;
          drawRoundRect(ctx, pt.x - (tw + 36) / 2, pt.y - 78, tw + 36, 52, 12);
          ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(15, 23, 42, 0.92)'; ctx.fill();
          ctx.strokeStyle = isSketch ? '#0f172a' : '#ffd166'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(mk.label, pt.x, pt.y - 51);
        }
      }

      const cards = scene.params?.compareCards || [];
      if (cards.length > 0) {
        const cardW = 410, gap = 36;
        const startX = (W - (cards.length * cardW + (cards.length - 1) * gap)) / 2;
        const cardY = 1040;
        cards.forEach((card, idx) => {
          const x = startX + idx * (cardW + gap);
          drawRoundRect(ctx, x, cardY, cardW, 210, 20);
          ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(15, 23, 42, 0.9)'; ctx.fill();
          ctx.strokeStyle = isSketch ? '#0f172a' : (card.color || '#38bdf8'); ctx.lineWidth = 3.5; ctx.stroke();
          ctx.fillStyle = isSketch ? '#334155' : '#94a3b8';
          ctx.font = '600 32px "Noto Sans Thai"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(card.title, x + cardW / 2, cardY + 58);
          ctx.fillStyle = isSketch ? '#0f172a' : (card.color || '#ffd166');
          ctx.font = '700 46px "Prompt"';
          ctx.fillText(card.value, x + cardW / 2, cardY + 138);
        });
      }
    }

    function drawWordHighlightCaption(ctx, activeCap, t, isSketch, boxY = 1340) {
      const boxH = 140;
      const borderCol = activeCap.speaker === 'B' ? '#fb7185' : 'rgba(56, 189, 248, 0.5)';
      drawRoundRect(ctx, 100, boxY, 880, boxH, 22);
      ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(7, 13, 31, 0.88)';
      ctx.fill();
      ctx.strokeStyle = isSketch ? '#dc2626' : borderCol;
      ctx.lineWidth = 3;
      ctx.stroke();

      const words = activeCap.words;
      if (words && words.length > 0) {
        ctx.font = '700 38px "Noto Sans Thai"';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        const maxRowW = 810;
        const rows = [[]];
        let rowW = 0;
        for (const w of words) {
          const ww = ctx.measureText(w.text).width;
          if (rows[rows.length - 1].length > 0 && rowW + ww > maxRowW && rows.length < 2) {
            rows.push([w]);
            rowW = ww;
          } else {
            rows[rows.length - 1].push(w);
            rowW += ww;
          }
        }
        rows.forEach((row, rIdx) => {
          const rw = row.reduce((acc, w) => acc + ctx.measureText(w.text).width, 0);
          let curX = 540 - rw / 2;
          const ry = rows.length === 1 ? boxY + 70 : (boxY + 46 + rIdx * 50);
          for (const w of row) {
            const isActive = t >= w.startSec && t <= w.endSec;
            ctx.fillStyle = isSketch
              ? (isActive ? '#dc2626' : '#0f172a')
              : (isActive ? '#ffd166' : '#f8fafc');
            ctx.fillText(w.text, curX, ry);
            curX += ctx.measureText(w.text).width;
          }
        });
      } else {
        ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
        ctx.font = '700 38px "Noto Sans Thai"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const capLines = wrapThaiLines(ctx, activeCap.text, 820, 2);
        if (capLines.length === 1) {
          ctx.fillText(capLines[0], 540, boxY + 70);
        } else {
          ctx.fillText(capLines[0], 540, boxY + 45);
          ctx.fillText(capLines[1], 540, boxY + 95);
        }
      }
    }

    ${getSubtitlesScript()}
    ${getPolishScript()}
    ${getMascotRigScript()}
    ${getStickmanRigScript()}
    ${getMysteryFxScript()}
    ${getWonlokStyleScript()}
    ${getMascotStyleScript()}
    ${getStickmanStyleScript()}
    ${getMysteryStyleScript()}

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
      const styleId = timeline.buildIdentity?.styleId || 'wonlok-plus';

      const scene = timeline.scenes.find((s) => frameIndex >= s.startFrame && frameIndex < s.endFrame)
        || timeline.scenes[timeline.scenes.length - 1];
      const sceneDurFrames = Math.max(1, scene.endFrame - scene.startFrame);
      const p = clamp((frameIndex - scene.startFrame) / sceneDurFrames, 0, 1);

      let captionCenterY = 1380;
      let defaultCapStyle = 'clean-pill';
      let isDarkStage = true;

      if (styleId === 'liplnwza-mascot') {
        renderMascotScene(ctx, timeline, scene, p, t, W, H, isSketch);
        captionCenterY = 1095;
        defaultCapStyle = 'pop-chips';
        isDarkStage = timeline.themeMode === 'dark' || timeline.themeMode === 'studio';
      } else if (styleId === 'stickman-duo') {
        renderStickmanDuoScene(ctx, timeline, scene, p, t, W, H, isSketch);
        captionCenterY = 1435;
        defaultCapStyle = 'clean-pill';
      } else if (styleId === 'mystery-stage') {
        renderMysteryStageScene(ctx, timeline, scene, p, t, W, H, isSketch);
        captionCenterY = 1410;
        defaultCapStyle = 'cinema-minimal';
      } else if (['locate', 'trace-route', 'compare'].includes(scene.recipe)) {
        renderWonlokPlusScene(ctx, timeline, scene, p, t, W, H, isSketch);
        captionCenterY = 1385;
        defaultCapStyle = 'bold-karaoke';
      } else {
        // pilot-map-route simple fallback
        if (isSketch) {
          ctx.fillStyle = '#f4f6f9';
          ctx.fillRect(0, 0, W, H);
        } else {
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#060c1a');
          bg.addColorStop(0.55, '#0b1730');
          bg.addColorStop(1, '#060b18');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);
        }

        ctx.save();
        ctx.strokeStyle = isSketch ? 'rgba(100, 116, 139, 0.25)' : 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1.5;
        for (let x = 0; x <= W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        const rng = mulberry32(timeline.seed + (scene.sceneId === 'scene-2' ? 99 : 0));
        ctx.fillStyle = isSketch ? 'rgba(148, 163, 184, 0.16)' : 'rgba(30, 58, 138, 0.28)';
        ctx.strokeStyle = isSketch ? 'rgba(71, 85, 105, 0.4)' : 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.ellipse(180 + rng() * 720, 520 + rng() * 720, 120 + rng() * 180, 80 + rng() * 140, rng() * Math.PI, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
        const p0 = { x: 250, y: 1180 }, p1 = { x: 340, y: 880 }, p2 = { x: 700, y: 940 }, p3 = { x: 820, y: 650 };
        if (scene.recipe === 'zoom-destination') {
          const zoom = 1 + 0.28 * easeOutCubic(p);
          ctx.translate(p3.x, p3.y); ctx.scale(zoom, zoom); ctx.translate(-p3.x, -p3.y);
        }
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.strokeStyle = isSketch ? '#94a3b8' : 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 10; ctx.setLineDash([16, 12]); ctx.stroke(); ctx.setLineDash([]);
        const routeProgress = scene.recipe === 'overview-route' ? easeOutCubic(clamp(p * 1.25, 0, 1)) : 1;
        const maxStep = Math.max(1, Math.floor(48 * routeProgress));
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y);
        let head = p0;
        for (let i = 1; i <= maxStep; i++) {
          const pt = cubicBezierPoint(p0, p1, p2, p3, i / 48);
          ctx.lineTo(pt.x, pt.y); head = pt;
        }
        if (!isSketch) { ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 22; }
        ctx.strokeStyle = isSketch ? '#0f172a' : '#00e5ff'; ctx.lineWidth = 10; ctx.stroke(); ctx.shadowBlur = 0;
        const pulse = (Math.sin(t * Math.PI * 3) + 1) * 0.5;
        const targetPt = scene.recipe === 'zoom-destination' ? p3 : head;
        ctx.beginPath(); ctx.arc(targetPt.x, targetPt.y, 24 + pulse * 26, 0, Math.PI * 2);
        ctx.strokeStyle = isSketch ? '#334155' : 'rgba(255, 59, 107, 0.65)'; ctx.lineWidth = 4; ctx.stroke();
        for (const pin of [{ pt: p0, label: 'กรุงเทพฯ', color: '#38bdf8' }, { pt: p3, label: 'นครราชสีมา', color: '#ff3b6b' }]) {
          ctx.fillStyle = isSketch ? '#1e293b' : pin.color;
          ctx.beginPath(); ctx.arc(pin.pt.x, pin.pt.y, 18, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
          ctx.font = '700 34px "Kanit", "Prompt"';
          const tw = ctx.measureText(pin.label).width;
          const bx = pin.pt.x - (tw + 36) / 2, by = pin.pt.y - 76;
          drawRoundRect(ctx, bx, by, tw + 36, 52, 12);
          ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(15, 23, 42, 0.88)'; ctx.fill();
          ctx.strokeStyle = isSketch ? '#0f172a' : pin.color; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(pin.label, pin.pt.x, by + 27);
        }
        const badgeText = scene.params?.distanceBadge || scene.params?.highlightMetric || '';
        if (badgeText) {
          ctx.font = '700 38px "Kanit", "Prompt"';
          const bw = ctx.measureText(badgeText).width + 52;
          drawRoundRect(ctx, 540 - bw / 2, 826, bw, 68, 34);
          ctx.fillStyle = isSketch ? '#e2e8f0' : '#ff3b6b'; ctx.fill();
          if (isSketch) { ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke(); }
          ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, 540, 862);
        }
        ctx.restore();
      }

      // Top readability gradient backdrop for Headline (dark stage only)
      if (!isSketch && isDarkStage && styleId !== 'mystery-stage' && styleId !== 'liplnwza-mascot') {
        const topGrad = ctx.createLinearGradient(0, 0, 0, 500);
        topGrad.addColorStop(0, 'rgba(6, 12, 26, 0.88)');
        topGrad.addColorStop(0.7, 'rgba(6, 12, 26, 0.55)');
        topGrad.addColorStop(1, 'rgba(6, 12, 26, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, W, 500);
      }

      // Safe Area Guide (Sketch only)
      if (isSketch) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.strokeRect(80, 220, 920, 1560);
        ctx.setLineDash([]);
      }

      // Layer: 2-Line Thai Headline + Subheadline (for non-windowed styles)
      if (styleId !== 'liplnwza-mascot') {
        const headline = scene.headline || '';
        const subheadline = scene.params?.subheadline || '';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
        ctx.font = '800 62px "Kanit", "Prompt"';
        const headLines = wrapThaiLines(ctx, headline, 840, 2);
        headLines.forEach((ln, idx) => {
          ctx.fillText(ln, 540, 310 + idx * 68);
        });

        if (subheadline) {
          const subY = headLines.length > 1 ? 426 : 386;
          ctx.fillStyle = isSketch ? '#334155' : '#ffd166';
          ctx.font = '600 40px "Kanit", "Noto Sans Thai"';
          const subLines = wrapThaiLines(ctx, subheadline, 840, 1);
          ctx.fillText(subLines[0] || '', 540, subY);
        }
      }

      // Layer: Multi-Style Thai Captions
      const activeCap = (scene.captions || []).find((c) => t >= c.startSec && t <= c.endSec);
      const captionStyle = timeline.captionStyle || defaultCapStyle;
      if (isSketch) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(90, captionCenterY - 72, 900, 144);
      }
      if (activeCap) {
        drawSubtitleByStyle(ctx, activeCap, t, isSketch, captionStyle, captionCenterY);
      }

      // Apply MotionForge-inspired Polish (Bloom + Vignette + Temporal Film/Paper Grain)
      const polishOpts = timeline.polish || { grain: true, bloom: isDarkStage, vignette: true };
      applyMotionForgePolish(ctx, W, H, frameIndex, {
        ...polishOpts,
        isDark: isDarkStage,
        isSketch,
      });

      // Global Overlay: Persistent Brand Badge
      const brandText = timeline.brandBadge || 'GenhaLipza';
      ctx.font = '700 26px "Kanit", "Prompt"';
      const brandW = ctx.measureText(brandText).width + 36;
      drawRoundRect(ctx, W - 90 - brandW, 130, brandW, 48, 24);
      ctx.fillStyle = isSketch ? '#e2e8f0' : (isDarkStage ? 'rgba(15, 23, 42, 0.82)' : '#181B26');
      ctx.fill();
      ctx.strokeStyle = isSketch ? '#0f172a' : (isDarkStage ? 'rgba(56, 189, 248, 0.55)' : '#FFE9A8');
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = isSketch ? '#0f172a' : (isDarkStage ? '#38bdf8' : '#FFE9A8');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(brandText, W - 90 - brandW / 2, 155);

      // Sketch Metadata Header (Preview-only)
      if (isSketch) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, 90);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 28px "Kanit", "Prompt"';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          'GATE 3 SKETCH | ' + styleId + ' | ' + scene.sceneId + ' (' + scene.recipe + ') | ' + captionStyle,
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
