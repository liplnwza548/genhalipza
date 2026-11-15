/**
 * Style Renderer: wonlok-plus (Overhauled Clean-Room Geo & Route Engine)
 * - Rich ocean radial gradient, coastal glow under landmasses, crisp GeoJSON borders
 * - Dynamic camera follow along animated route head + live distance/time telemetry pill
 * - Smart Label Collision Solver (prevents city labels, badges, and compare cards from overlapping)
 */
export function getWonlokStyleScript() {
  return `
    function rectsOverlap(a, b, pad = 10) {
      return !(
        a.x + a.w + pad < b.x ||
        b.x + b.w + pad < a.x ||
        a.y + a.h + pad < b.y ||
        b.y + b.h + pad < a.y
      );
    }

    function placeNonOverlappingBox(anchorX, anchorY, bw, bh, placedRects, W, minY, maxY) {
      const candidates = [
        { x: anchorX - bw / 2, y: anchorY - bh - 28 },          // top
        { x: anchorX - bw / 2, y: anchorY + 28 },               // bottom
        { x: anchorX + 28,     y: anchorY - bh / 2 },           // right
        { x: anchorX - bw - 28,y: anchorY - bh / 2 },           // left
        { x: anchorX - bw / 2, y: anchorY - bh - 76 },          // higher top
        { x: anchorX - bw / 2, y: anchorY + 76 },               // lower bottom
      ];
      for (const c of candidates) {
        const box = {
          x: clamp(c.x, 76, W - 76 - bw),
          y: clamp(c.y, minY, maxY - bh),
          w: bw,
          h: bh,
        };
        if (!placedRects.some((r) => rectsOverlap(box, r, 12))) {
          placedRects.push(box);
          return box;
        }
      }
      const fallback = {
        x: clamp(anchorX - bw / 2, 76, W - 76 - bw),
        y: clamp(anchorY - bh - 28, minY, maxY - bh),
        w: bw,
        h: bh,
      };
      placedRects.push(fallback);
      return fallback;
    }

    function renderWonlokPlusScene(ctx, timeline, scene, p, t, W, H, isSketch) {
      // 1. Deep Ocean Backdrop
      if (isSketch) {
        ctx.fillStyle = '#f4f6f9';
        ctx.fillRect(0, 0, W, H);
      } else {
        const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 80, W * 0.5, H * 0.5, H * 0.72);
        bg.addColorStop(0, '#0f2347');
        bg.addColorStop(0.55, '#08142b');
        bg.addColorStop(1, '#040914');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
      }

      const camFrom = scene.params?.camFrom || { lon: 101.0, lat: 14.0, zoom: 12 };
      const camTo = scene.params?.camTo || camFrom;
      const camT = easeInOutCubic(p);
      const camLon = lerp(camFrom.lon, camTo.lon, camT);
      const camLat = lerp(camFrom.lat, camTo.lat, camT);
      const zoom = lerp(camFrom.zoom, camTo.zoom, camT);

      // 2. Subtle Lat/Lon Graticule
      ctx.strokeStyle = isSketch ? 'rgba(100, 116, 139, 0.2)' : 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1.5;
      for (let lon = -180; lon <= 180; lon += 10) {
        const a = projectLonLat(lon, -75, camLon, camLat, zoom, W, H);
        const b = projectLonLat(lon, 75, camLon, camLat, zoom, W, H);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (let lat = -60; lat <= 75; lat += 10) {
        for (let lon = -180; lon < 180; lon += 20) {
          const a = projectLonLat(lon, lat, camLon, camLat, zoom, W, H);
          const b = projectLonLat(lon + 20, lat, camLon, camLat, zoom, W, H);
          if (Math.abs(b.x - a.x) > W * 0.65) continue;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      // 3. Landmasses with Coastal Glow + Highlighted Countries
      const highlightSet = new Set((scene.params?.highlightCountries || []).map((c) => String(c).toUpperCase()));
      const features = window.__GEOJSON__?.features || [];
      const highlightedFeatures = [];

      ctx.save();
      if (!isSketch) {
        ctx.shadowColor = 'rgba(0, 229, 255, 0.16)';
        ctx.shadowBlur = 14;
      }
      ctx.fillStyle = isSketch ? 'rgba(148, 163, 184, 0.18)' : '#17253d';
      ctx.strokeStyle = isSketch ? 'rgba(71, 85, 105, 0.45)' : 'rgba(56, 189, 248, 0.30)';
      ctx.lineWidth = 1.8;

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
      ctx.restore();

      if (highlightedFeatures.length > 0) {
        ctx.save();
        ctx.fillStyle = isSketch ? 'rgba(37, 99, 235, 0.22)' : 'rgba(14, 165, 233, 0.38)';
        ctx.strokeStyle = isSketch ? '#1d4ed8' : '#38bdf8';
        ctx.lineWidth = 3.5;
        if (!isSketch) { ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 20; }
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

      // Reserve Compare Cards region first so map labels never collide with cards
      const placedRects = [];
      const cards = scene.params?.compareCards || [];
      if (cards.length > 0) {
        const cardW = 420, gap = 32;
        const startX = (W - (cards.length * cardW + (cards.length - 1) * gap)) / 2;
        const cardY = 1020;
        cards.forEach((_, idx) => {
          placedRects.push({ x: startX + idx * (cardW + gap), y: cardY, w: cardW, h: 215 });
        });
      }

      // 4. Routes + Moving Ring Marker + Live Telemetry Pill
      const routes = scene.params?.routes || [];
      let activeTelemetry = null;
      for (const rt of routes) {
        const p0 = projectLonLat(rt.from[0], rt.from[1], camLon, camLat, zoom, W, H);
        const p3 = projectLonLat(rt.to[0], rt.to[1], camLon, camLat, zoom, W, H);
        const midX = (p0.x + p3.x) / 2;
        const midY = (p0.y + p3.y) / 2 - Math.hypot(p3.x - p0.x, p3.y - p0.y) * 0.22;
        const p1 = { x: lerp(p0.x, midX, 0.5), y: lerp(p0.y, midY, 0.7) };
        const p2 = { x: lerp(p3.x, midX, 0.5), y: lerp(p0.y, midY, 0.7) };

        // Dashed planned line
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.strokeStyle = isSketch ? '#94a3b8' : 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 7; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.setLineDash([]);

        // Animated glowing route line
        const prog = rt.animate === false ? 1 : easeOutCubic(clamp(p * 1.25, 0, 1));
        const maxStep = Math.max(1, Math.floor(48 * prog));
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y);
        let head = p0;
        for (let i = 1; i <= maxStep; i++) {
          const pt = cubicBezierPoint(p0, p1, p2, p3, i / 48);
          ctx.lineTo(pt.x, pt.y);
          head = pt;
        }
        ctx.save();
        if (!isSketch) { ctx.shadowColor = rt.color || '#00e5ff'; ctx.shadowBlur = 22; }
        ctx.strokeStyle = isSketch ? '#0f172a' : (rt.color || '#00e5ff');
        ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
        ctx.restore();

        // Moving Head Ring + Beacon
        const pulse = (Math.sin(t * Math.PI * 3.5) + 1) * 0.5;
        ctx.beginPath(); ctx.arc(head.x, head.y, 18 + pulse * 22, 0, Math.PI * 2);
        ctx.strokeStyle = isSketch ? '#334155' : 'rgba(255, 59, 107, 0.8)';
        ctx.lineWidth = 4; ctx.stroke();
        ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
        ctx.beginPath(); ctx.arc(head.x, head.y, 8, 0, Math.PI * 2); ctx.fill();

        if (rt.totalKm) {
          activeTelemetry = {
            km: Math.round(rt.totalKm * prog),
            hours: rt.totalHours ? (rt.totalHours * prog).toFixed(1) : null,
          };
        }

        // Endpoint Pins & Non-Overlapping Labels
        for (const [pt, lbl, col] of [[p0, rt.fromLabel, '#38bdf8'], [p3, rt.toLabel, '#ff3b6b']]) {
          ctx.fillStyle = isSketch ? '#1e293b' : col;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5; ctx.stroke();

          if (lbl) {
            ctx.font = '700 32px "Prompt", "Kanit"';
            const bw = ctx.measureText(lbl).width + 34;
            const bh = 50;
            const box = placeNonOverlappingBox(pt.x, pt.y, bw, bh, placedRects, W, 500, 1240);

            // Leader line if box shifted far
            ctx.strokeStyle = isSketch ? '#64748b' : 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(box.x + box.w / 2, box.y + box.h / 2); ctx.stroke();

            drawRoundRect(ctx, box.x, box.y, box.w, box.h, 12);
            ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(15, 23, 42, 0.94)'; ctx.fill();
            ctx.strokeStyle = isSketch ? '#0f172a' : col; ctx.lineWidth = 2.5; ctx.stroke();
            ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(lbl, box.x + box.w / 2, box.y + box.h / 2 + 1);
          }
        }

        if (rt.badge) {
          const midPt = cubicBezierPoint(p0, p1, p2, p3, 0.5);
          ctx.font = '700 32px "Prompt", "Kanit"';
          const bw = ctx.measureText(rt.badge).width + 46;
          const bh = 58;
          const box = placeNonOverlappingBox(midPt.x, midPt.y + 40, bw, bh, placedRects, W, 500, 1240);
          drawRoundRect(ctx, box.x, box.y, box.w, box.h, 29);
          ctx.fillStyle = isSketch ? '#e2e8f0' : (rt.badgeColor || '#ff3b6b'); ctx.fill();
          if (isSketch) { ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke(); }
          ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(rt.badge, box.x + box.w / 2, box.y + box.h / 2 + 1);
        }
      }

      // 5. Markers (Non-Overlapping)
      for (const mk of scene.params?.markers || []) {
        const pt = projectLonLat(mk.lon, mk.lat, camLon, camLat, zoom, W, H);
        const pulse = (Math.sin(t * Math.PI * 3.5) + 1) * 0.5;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 26 + pulse * 30, 0, Math.PI * 2);
        ctx.strokeStyle = isSketch ? '#334155' : 'rgba(255, 209, 102, 0.82)';
        ctx.lineWidth = 4; ctx.stroke();
        ctx.fillStyle = isSketch ? '#0f172a' : '#ff3b6b';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 16, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5; ctx.stroke();

        if (mk.label) {
          ctx.font = '700 34px "Prompt", "Kanit"';
          const bw = ctx.measureText(mk.label).width + 38;
          const bh = 54;
          const box = placeNonOverlappingBox(pt.x, pt.y, bw, bh, placedRects, W, 500, 1240);
          drawRoundRect(ctx, box.x, box.y, box.w, box.h, 12);
          ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(15, 23, 42, 0.94)'; ctx.fill();
          ctx.strokeStyle = isSketch ? '#0f172a' : '#ffd166'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(mk.label, box.x + box.w / 2, box.y + box.h / 2 + 1);
        }
      }

      // 6. Live Distance/Time Telemetry Pill (Top under headline)
      if (activeTelemetry && !isSketch) {
        const txt = activeTelemetry.hours
          ? ('ราว ' + activeTelemetry.km.toLocaleString('en-US') + ' กม.  |  ~' + activeTelemetry.hours + ' ชม.')
          : ('ระยะทาง ~' + activeTelemetry.km.toLocaleString('en-US') + ' กม.');
        ctx.font = '700 32px "Prompt", "Kanit"';
        const tw = ctx.measureText(txt).width + 48;
        drawRoundRect(ctx, 540 - tw / 2, 466, tw, 54, 27);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = '#FFD648';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, 540, 494);
      }

      // 7. Compare Cards (with entrance pop)
      if (cards.length > 0) {
        const cardW = 420, gap = 32;
        const startX = (W - (cards.length * cardW + (cards.length - 1) * gap)) / 2;
        const cardY = 1020;
        cards.forEach((card, idx) => {
          const pop = isSketch ? 1 : easeOutCubic(clamp((p - idx * 0.12) * 4.5, 0, 1));
          const x = startX + idx * (cardW + gap);
          ctx.save();
          ctx.globalAlpha = isSketch ? 1 : pop;
          ctx.translate(0, (1 - pop) * 20);
          drawRoundRect(ctx, x, cardY, cardW, 215, 22);
          ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(15, 23, 42, 0.94)'; ctx.fill();
          ctx.strokeStyle = isSketch ? '#0f172a' : (card.color || '#38bdf8'); ctx.lineWidth = 4; ctx.stroke();
          ctx.fillStyle = isSketch ? '#334155' : '#cbd5e1';
          ctx.font = '600 32px "Prompt", "Kanit", "Noto Sans Thai"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(card.title, x + cardW / 2, cardY + 62);
          ctx.fillStyle = isSketch ? '#0f172a' : (card.color || '#ffd166');
          ctx.font = '800 50px "Prompt", "Kanit"';
          ctx.fillText(card.value, x + cardW / 2, cardY + 146);
          ctx.restore();
        });
      }
    }
  `;
}
