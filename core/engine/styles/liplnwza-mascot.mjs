/**
 * Style Renderer: liplnwza-mascot (Overhauled 3-Zone Stage — AoT Paper Mode & Studio Dark Mode)
 * - Zone 1 (Top Panel x:48..1032, y:48..928): Mac-style header + beat banner + rich visual stage
 *   (supports compare-split, checklist-flow, savings-meter, and optional owner illustrations)
 * - Zone 2 (Middle Subtitle Strip y≈1085): Uses chosen subtitle style (pop-chips / bold-karaoke / clean-pill)
 * - Zone 3 (Bottom Mascot y=1872): Cel-shaded vector mascot or private PNG clean-plates
 */
export function getMascotStyleScript() {
  return `
    function renderMascotScene(ctx, timeline, scene, p, t, W, H, isSketch) {
      const mode = timeline.themeMode || 'paper';
      const isDark = mode === 'dark' || mode === 'studio';

      // 1. Backdrop (AoT Cream Paper + Dot Grid vs Studio Dark)
      if (isSketch) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);
      } else if (isDark) {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#090d1a');
        bg.addColorStop(0.55, '#131c36');
        bg.addColorStop(1, '#070a14');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
      } else {
        // Warm cream paper background (#FFF6E8) + faint dot grid
        ctx.fillStyle = '#FFF6E8';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(24, 27, 38, 0.08)';
        for (let gx = 32; gx < W; gx += 44) {
          for (let gy = 32; gy < H; gy += 44) {
            ctx.beginPath(); ctx.arc(gx, gy, 2.2, 0, Math.PI * 2); ctx.fill();
          }
        }
      }

      // 2. Top Frame Window (x: 48..1032, y: 120..920) leaving clean margin for safe area
      const fx = 54, fy = 210, fw = 972, fh = 720, headerH = 88;
      const slideIn = (1 - easeOutCubic(clamp(p * 4.5, 0, 1))) * 22;

      ctx.save();
      ctx.translate(0, slideIn);

      if (!isSketch) {
        // Crisp comic shadow behind window
        drawRoundRect(ctx, fx + 10, fy + 12, fw, fh, 26);
        ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(24, 27, 38, 0.16)';
        ctx.fill();
      }

      // Window Body
      drawRoundRect(ctx, fx, fy, fw, fh, 26);
      ctx.fillStyle = isSketch ? '#ffffff' : (isDark ? '#0f172a' : '#FFFDF6');
      ctx.fill();
      ctx.strokeStyle = isSketch ? '#0f172a' : (isDark ? '#38bdf8' : '#181B26');
      ctx.lineWidth = 5;
      ctx.stroke();

      // Header Bar (#FFE9A8 in paper mode)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(fx + 26, fy);
      ctx.lineTo(fx + fw - 26, fy);
      ctx.quadraticCurveTo(fx + fw, fy, fx + fw, fy + 26);
      ctx.lineTo(fx + fw, fy + headerH);
      ctx.lineTo(fx, fy + headerH);
      ctx.lineTo(fx, fy + 26);
      ctx.quadraticCurveTo(fx, fy, fx + 26, fy);
      ctx.closePath();
      ctx.fillStyle = isSketch ? '#e2e8f0' : (isDark ? '#1e293b' : '#FFE9A8');
      ctx.fill();
      ctx.strokeStyle = isSketch ? '#0f172a' : (isDark ? '#38bdf8' : '#181B26');
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // Three macOS-style dots
      const dotCols = isSketch ? ['#94a3b8', '#94a3b8', '#94a3b8'] : ['#F44336', '#FFD648', '#38B577'];
      dotCols.forEach((dc, idx) => {
        ctx.fillStyle = dc;
        ctx.strokeStyle = '#181B26';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(fx + 42 + idx * 34, fy + headerH / 2, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });

      // Header Title / Beat Banner
      const cardTitle = scene.params?.cardTitle || scene.headline || 'ประเด็นสำคัญ';
      ctx.fillStyle = isSketch ? '#0f172a' : (isDark ? '#f8fafc' : '#181B26');
      ctx.font = '800 38px "Prompt", "Kanit"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cardTitle, fx + fw / 2 + 24, fy + headerH / 2 + 2);

      // Content Area inside Window (y: fy + headerH .. fy + fh)
      const bodyY = fy + headerH;
      const bodyH = fh - headerH;
      const bullets = scene.params?.bullets || [];

      if (scene.recipe === 'card-compare' && scene.params?.comparePair) {
        const pair = scene.params.comparePair;
        pair.forEach((item, idx) => {
          const staggerStart = idx * 0.12;
          const pop = isSketch ? 1 : easeOutCubic(clamp((p - staggerStart) * 5, 0, 1));
          const bx = fx + 44 + idx * 452;
          const by = bodyY + 46;
          const bw = 432;
          const bh = bodyH - 96;

          ctx.save();
          ctx.translate(bx + bw / 2, by + bh / 2);
          ctx.scale(0.88 + 0.12 * pop, 0.88 + 0.12 * pop);
          ctx.globalAlpha = isSketch ? 1 : pop;

          const cardBg = isSketch ? '#f8fafc' : (idx === 0 ? '#FEE2E2' : '#DCFCE7');
          const cardBorder = isSketch ? '#0f172a' : (idx === 0 ? '#EF4444' : '#22C55E');
          const valCol = isSketch ? '#0f172a' : (idx === 0 ? '#B91C1C' : '#15803D');

          if (!isSketch) {
            drawRoundRect(ctx, -bw / 2 + 6, -bh / 2 + 8, bw, bh, 24);
            ctx.fillStyle = 'rgba(24, 27, 38, 0.12)'; ctx.fill();
          }
          drawRoundRect(ctx, -bw / 2, -bh / 2, bw, bh, 24);
          ctx.fillStyle = cardBg; ctx.fill();
          ctx.strokeStyle = cardBorder; ctx.lineWidth = 4.5; ctx.stroke();

          // Top pill tag
          drawRoundRect(ctx, -145, -bh / 2 + 34, 290, 56, 28);
          ctx.fillStyle = cardBorder; ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '800 32px "Prompt", "Kanit"';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(item.label, 0, -bh / 2 + 63);

          // Big Hero Metric
          ctx.fillStyle = valCol;
          ctx.font = '800 92px "Prompt", "Kanit"';
          ctx.fillText(item.value, 0, 16);

          // Note pill
          ctx.fillStyle = '#1e293b';
          ctx.font = '700 32px "Prompt", "Kanit", "Noto Sans Thai"';
          ctx.fillText(item.note || '', 0, bh / 2 - 70);
          ctx.restore();
        });
      } else {
        // Rich Staggered Visual Cards + Progress Meter
        const pillCols = ['#2264D8', '#38B577', '#F44336'];
        bullets.slice(0, 3).forEach((b, idx) => {
          const itemU = isSketch ? 1 : clamp((p - idx * 0.14) * 4.5, 0, 1);
          const pop = easeOutCubic(itemU);
          const iy = bodyY + 52 + idx * 145;
          const ix = fx + 44;
          const iw = fw - 88;
          const ih = 118;

          ctx.save();
          ctx.globalAlpha = isSketch ? 1 : pop;
          ctx.translate(0, (1 - pop) * 18);

          if (!isSketch) {
            drawRoundRect(ctx, ix + 6, iy + 7, iw, ih, 22);
            ctx.fillStyle = 'rgba(24, 27, 38, 0.12)'; ctx.fill();
          }
          drawRoundRect(ctx, ix, iy, iw, ih, 22);
          ctx.fillStyle = isSketch ? '#f8fafc' : (isDark ? '#1e293b' : '#FFFFFF');
          ctx.fill();
          ctx.strokeStyle = isSketch ? '#0f172a' : '#181B26';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Number badge
          ctx.fillStyle = isSketch ? '#0f172a' : pillCols[idx % pillCols.length];
          ctx.beginPath(); ctx.arc(ix + 58, iy + ih / 2, 30, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#181B26'; ctx.lineWidth = 3; ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = '800 32px "Prompt", "Kanit"';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(idx + 1), ix + 58, iy + ih / 2 + 2);

          // Bullet text
          ctx.fillStyle = isSketch ? '#0f172a' : (isDark ? '#f8fafc' : '#181B26');
          ctx.font = '700 38px "Prompt", "Kanit", "Noto Sans Thai"';
          ctx.textAlign = 'left';
          ctx.fillText(b, ix + 110, iy + ih / 2 + 2);
          ctx.restore();
        });

        // Visual bottom accent bar inside window
        const barW = fw - 88;
        const prog = easeInOutCubic(p);
        drawRoundRect(ctx, fx + 44, fy + fh - 56, barW, 20, 10);
        ctx.fillStyle = isSketch ? '#e2e8f0' : (isDark ? '#334155' : '#F1E8D6');
        ctx.fill();
        drawRoundRect(ctx, fx + 44, fy + fh - 56, Math.max(24, barW * prog), 20, 10);
        ctx.fillStyle = isSketch ? '#0f172a' : '#38B577';
        ctx.fill();
      }
      ctx.restore();

      // 3. Determine active viseme at time t
      const visemes = scene.params?.visemes || timeline.visemes || [];
      const activeVis = visemes.find((v) => t >= v.startSec && t <= v.endSec);
      const visemeCode = activeVis ? activeVis.viseme : 'REST';

      // 4. Bottom Zone: Mascot Stage (alpha-bottom anchored at y=1872)
      drawMascotRig(ctx, 540, 1872, 1.02, {
        pose: scene.params?.pose || 'explain',
        viseme: visemeCode,
        t,
        isSketch,
      });

      if (isSketch) {
        ctx.fillStyle = '#334155';
        ctx.font = '700 24px "Prompt", "Kanit"';
        ctx.textAlign = 'left';
        ctx.fillText('[MASCOT ZONE: pose=' + (scene.params?.pose || 'explain') + ', viseme=' + visemeCode + ']', 90, 1360);
      }
    }
  `;
}
