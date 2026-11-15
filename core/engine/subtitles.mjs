/**
 * Browser-side Thai Multi-Style Subtitle Engine (Clean-Room)
 * Supports 4 distinct visual presets:
 *   - pop-chips:      Spring-popping colored pills (0.6x -> 1.08x -> 1.0x in 0.13s, ±2° tilt, ink outline)
 *   - bold-karaoke:   Prompt Bold white text with thick dark outline + active word gold pop
 *   Font rule (locked 2026-11-15): Prompt is the primary font in every preset;
 *   Kanit stays only as a fallback in the font stack, never as the first family.
 *   - clean-pill:     Translucent frosted dark capsule with active word highlight
 *   - cinema-minimal: Crisp documentary lower-third with subtle drop shadow
 */
export function getSubtitlesScript() {
  return `
    function springPopScale(u) {
      if (u <= 0) return 0.6;
      if (u >= 1) return 1.0;
      if (u < 0.5) {
        const f = (1 - Math.cos(Math.PI * (u / 0.5))) / 2;
        return 0.6 + (1.08 - 0.6) * f;
      }
      const f = (1 - Math.cos(Math.PI * ((u - 0.5) / 0.5))) / 2;
      return 1.08 + (1.0 - 1.08) * f;
    }

    function buildWordRows(ctx, activeCap, maxRowW, maxWordsPerRow = 3) {
      const words = activeCap.words && activeCap.words.length > 0
        ? activeCap.words
        : Array.from(thWordSeg.segment(String(activeCap.text || '')), (s) => ({
            text: s.segment,
            startSec: activeCap.startSec,
            endSec: activeCap.endSec,
          })).filter((w) => w.text.trim().length > 0);

      const rows = [[]];
      let rowW = 0;
      for (const w of words) {
        const ww = ctx.measureText(w.text).width + 26;
        const curRow = rows[rows.length - 1];
        if (curRow.length > 0 && (rowW + ww > maxRowW || curRow.length >= maxWordsPerRow)) {
          rows.push([w]);
          rowW = ww;
        } else {
          curRow.push(w);
          rowW += ww;
        }
      }
      return rows.slice(0, 2);
    }

    function drawPopChipsCaption(ctx, activeCap, t, isSketch, centerY) {
      const CHIP_PALETTE = [
        { bg: '#FFD648', fg: '#181B26' },
        { bg: '#2264D8', fg: '#FFFDF6' },
        { bg: '#F44336', fg: '#FFFDF6' },
        { bg: '#38B577', fg: '#181B26' },
      ];
      ctx.font = '800 54px "Prompt", "Kanit"';
      const rows = buildWordRows(ctx, activeCap, 880, 3);
      const rowGap = 112;
      const startY = rows.length === 1 ? centerY : centerY - rowGap * 0.48;

      rows.forEach((row, rIdx) => {
        const chipH = 92;
        const gap = 16;
        const widths = row.map((w) => Math.max(96, ctx.measureText(w.text.trim()).width + 54));
        const totalW = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, widths.length - 1);
        const scaleFit = Math.min(1, 940 / Math.max(1, totalW));
        let curX = 540 - (totalW * scaleFit) / 2;
        const ry = startY + rIdx * rowGap;

        row.forEach((w, wIdx) => {
          const cw = widths[wIdx] * scaleFit;
          const appearT = w.startSec - 0.02;
          if (!isSketch && t < appearT) {
            curX += cw + gap * scaleFit;
            return;
          }
          const u = isSketch ? 1 : clamp((t - appearT) / 0.13, 0, 1);
          const pop = springPopScale(u);
          const isActive = t >= w.startSec && t <= w.endSec;
          const pal = CHIP_PALETTE[(rIdx * 3 + wIdx) % CHIP_PALETTE.length];
          const rot = ((wIdx + rIdx) % 2 === 0 ? -2.0 : 2.0) * (Math.PI / 180);

          ctx.save();
          ctx.translate(curX + cw / 2, ry);
          ctx.rotate(rot);
          ctx.scale(pop * (isActive ? 1.05 : 1.0), pop * (isActive ? 1.05 : 1.0));

          if (!isSketch) {
            // Crisp comic drop shadow
            drawRoundRect(ctx, -cw / 2 + 5, -chipH / 2 + 7, cw, chipH, 18);
            ctx.fillStyle = 'rgba(24, 27, 38, 0.85)';
            ctx.fill();
          }

          drawRoundRect(ctx, -cw / 2, -chipH / 2, cw, chipH, 18);
          ctx.fillStyle = isSketch ? '#ffffff' : pal.bg;
          ctx.fill();
          ctx.strokeStyle = '#181B26';
          ctx.lineWidth = 5;
          ctx.stroke();

          ctx.fillStyle = isSketch ? '#0f172a' : pal.fg;
          ctx.font = '800 ' + Math.round(52 * scaleFit) + 'px "Prompt", "Kanit"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(w.text.trim(), 0, 3);
          ctx.restore();

          curX += cw + gap * scaleFit;
        });
      });
    }

    function drawBoldKaraokeCaption(ctx, activeCap, t, isSketch, centerY) {
      const baseSize = 60;
      ctx.font = '800 ' + baseSize + 'px "Prompt", "Kanit"';
      const rows = buildWordRows(ctx, activeCap, 860, 5);
      const lineH = 84;
      const startY = rows.length === 1 ? centerY : centerY - lineH * 0.48;

      rows.forEach((row, rIdx) => {
        ctx.font = '800 ' + baseSize + 'px "Prompt", "Kanit"';
        const rawWidths = row.map((w) => ctx.measureText(w.text).width);
        const gaps = row.map((w, idx) => {
          if (idx >= row.length - 1) return 0;
          const a = w.text.trim();
          const b = row[idx + 1].text.trim();
          const isLatinBoundary = /[A-Za-z0-9]$/.test(a) || /^[A-Za-z0-9]/.test(b);
          return isLatinBoundary ? 14 : 6;
        });
        const totalRawW = rawWidths.reduce((s, w) => s + w, 0) + gaps.reduce((s, g) => s + g, 0);
        const scaleFit = Math.min(1, 920 / Math.max(1, totalRawW));
        const fontSize = Math.round(baseSize * scaleFit);
        ctx.font = '800 ' + fontSize + 'px "Prompt", "Kanit"';

        const widths = row.map((w) => ctx.measureText(w.text).width);
        const scaledGaps = gaps.map((g) => g * scaleFit);
        const totalW = widths.reduce((s, w) => s + w, 0) + scaledGaps.reduce((s, g) => s + g, 0);
        const ry = startY + rIdx * lineH;

        const positions = [];
        let curX = 540 - totalW / 2;
        row.forEach((w, wIdx) => {
          positions.push(curX + widths[wIdx] / 2);
          curX += widths[wIdx] + (scaledGaps[wIdx] || 0);
        });

        // Pass 1: Draw all dark outlines first so outlines never cut into neighbor fills
        row.forEach((w, wIdx) => {
          const isActive = t >= w.startSec && t <= w.endSec;
          ctx.save();
          ctx.translate(positions[wIdx], ry);
          if (isActive && !isSketch) {
            const u = clamp((t - w.startSec) / 0.1, 0, 1);
            const sc = 1 + 0.08 * Math.sin(u * Math.PI * 0.5);
            ctx.scale(sc, sc);
          }
          ctx.font = '800 ' + fontSize + 'px "Prompt", "Kanit"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          if (!isSketch) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 5;
          }
          ctx.strokeStyle = isSketch ? '#ffffff' : '#0b0f19';
          ctx.lineWidth = Math.round(14 * scaleFit);
          ctx.strokeText(w.text, 0, 0);
          ctx.restore();
        });

        // Pass 2: Draw all crisp fills on top
        row.forEach((w, wIdx) => {
          const isActive = t >= w.startSec && t <= w.endSec;
          ctx.save();
          ctx.translate(positions[wIdx], ry);
          if (isActive && !isSketch) {
            const u = clamp((t - w.startSec) / 0.1, 0, 1);
            const sc = 1 + 0.08 * Math.sin(u * Math.PI * 0.5);
            ctx.scale(sc, sc);
          }
          ctx.font = '800 ' + fontSize + 'px "Prompt", "Kanit"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isSketch
            ? (isActive ? '#dc2626' : '#0f172a')
            : (isActive ? '#FFD648' : '#FFFFFF');
          ctx.fillText(w.text, 0, 0);
          ctx.restore();
        });
      });
    }

    function drawCleanPillCaption(ctx, activeCap, t, isSketch, centerY) {
      const boxH = 144;
      const boxY = centerY - boxH / 2;
      const borderCol = activeCap.speaker === 'B' ? '#fb7185' : 'rgba(56, 189, 248, 0.65)';
      ctx.save();
      if (!isSketch) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
      }
      drawRoundRect(ctx, 90, boxY, 900, boxH, 26);
      ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(7, 13, 31, 0.88)';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isSketch ? '#dc2626' : borderCol;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      ctx.font = '700 42px "Prompt", "Kanit", "Noto Sans Thai"';
      const rows = buildWordRows(ctx, activeCap, 830, 6);
      rows.forEach((row, rIdx) => {
        const rw = row.reduce((acc, w) => acc + ctx.measureText(w.text).width, 0);
        let curX = 540 - rw / 2;
        const ry = rows.length === 1 ? centerY : (centerY - 26 + rIdx * 54);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        for (const w of row) {
          const isActive = t >= w.startSec && t <= w.endSec;
          ctx.fillStyle = isSketch
            ? (isActive ? '#dc2626' : '#0f172a')
            : (isActive ? '#FFD648' : '#f8fafc');
          ctx.fillText(w.text, curX, ry);
          curX += ctx.measureText(w.text).width;
        }
      });
    }

    function drawCinemaMinimalCaption(ctx, activeCap, t, isSketch, centerY) {
      ctx.font = '600 46px "Prompt", "Kanit", "Noto Sans Thai"';
      const rows = buildWordRows(ctx, activeCap, 860, 6);
      const lineH = 60;
      const startY = rows.length === 1 ? centerY : centerY - lineH * 0.45;
      rows.forEach((row, rIdx) => {
        const rw = row.reduce((acc, w) => acc + ctx.measureText(w.text).width, 0);
        let curX = 540 - rw / 2;
        const ry = startY + rIdx * lineH;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        for (const w of row) {
          const isActive = t >= w.startSec && t <= w.endSec;
          if (!isSketch) {
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
            ctx.lineWidth = 8;
            ctx.lineJoin = 'round';
            ctx.strokeText(w.text, curX, ry);
          }
          ctx.fillStyle = isSketch
            ? (isActive ? '#dc2626' : '#0f172a')
            : (isActive ? '#fef08a' : '#f1f5f9');
          ctx.fillText(w.text, curX, ry);
          curX += ctx.measureText(w.text).width;
        }
      });
    }

    function drawSubtitleByStyle(ctx, activeCap, t, isSketch, styleName, centerY) {
      if (!activeCap) return;
      if (styleName === 'pop-chips') {
        drawPopChipsCaption(ctx, activeCap, t, isSketch, centerY);
      } else if (styleName === 'bold-karaoke') {
        drawBoldKaraokeCaption(ctx, activeCap, t, isSketch, centerY);
      } else if (styleName === 'cinema-minimal') {
        drawCinemaMinimalCaption(ctx, activeCap, t, isSketch, centerY);
      } else {
        drawCleanPillCaption(ctx, activeCap, t, isSketch, centerY);
      }
    }
  `;
}
