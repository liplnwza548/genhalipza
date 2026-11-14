/**
 * Style Renderer: `liplnwza-mascot` (3-Zone Paper-Cutout Card + Mascot Lip-Sync Stage)
 * Recipes: `card-explain`, `card-compare`, `card-summary`
 */
export function getMascotStyleScript() {
  return `
    function renderMascotScene(ctx, timeline, scene, p, t, W, H, isSketch) {
      // 1. Warm Paper-Cutout Backdrop
      if (isSketch) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);
      } else {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1e1b4b');
        bg.addColorStop(0.55, '#312e81');
        bg.addColorStop(1, '#0f172a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Subtle diagonal paper craft stripes
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let sx = -400; sx < W + 400; sx += 110) {
          ctx.beginPath();
          ctx.moveTo(sx, 0); ctx.lineTo(sx + 45, 0);
          ctx.lineTo(sx - 260, H); ctx.lineTo(sx - 305, H);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }

      // 2. Top Zone: Layered Paper-Cutout Card (y: 440..1030)
      const cardX = 110;
      const cardY = 460;
      const cardW = 860;
      const cardH = 540;
      const cardEase = easeOutCubic(clamp(p * 3.5, 0, 1));
      const slideOffset = (1 - cardEase) * 40;

      ctx.save();
      ctx.translate(0, slideOffset);

      // Paper drop layer
      if (!isSketch) {
        drawRoundRect(ctx, cardX + 18, cardY + 20, cardW, cardH, 32);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.fill();
      }

      // Main card sheet
      drawRoundRect(ctx, cardX, cardY, cardW, cardH, 32);
      ctx.fillStyle = isSketch ? '#ffffff' : '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = isSketch ? '#0f172a' : '#38bdf8';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Card header ribbon
      drawRoundRect(ctx, cardX + 36, cardY + 34, cardW - 72, 74, 18);
      ctx.fillStyle = isSketch ? '#e2e8f0' : '#0ea5e9';
      ctx.fill();
      ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
      ctx.font = '700 36px "Prompt"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(scene.params?.cardTitle || 'สรุปประเด็นสำคัญ', cardX + cardW / 2, cardY + 72);

      // Card content by recipe
      const bullets = scene.params?.bullets || [];
      if (scene.recipe === 'card-compare' && scene.params?.comparePair) {
        const pair = scene.params.comparePair;
        pair.forEach((item, idx) => {
          const bx = cardX + 42 + idx * 400;
          const by = cardY + 145;
          drawRoundRect(ctx, bx, by, 376, 340, 22);
          ctx.fillStyle = isSketch ? '#f1f5f9' : (idx === 0 ? '#fee2e2' : '#dcfce7');
          ctx.fill();
          ctx.strokeStyle = isSketch ? '#334155' : (idx === 0 ? '#ef4444' : '#22c55e');
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.font = '700 34px "Prompt"';
          ctx.fillText(item.label, bx + 188, by + 68);
          ctx.fillStyle = isSketch ? '#0f172a' : (idx === 0 ? '#b91c1c' : '#15803d');
          ctx.font = '700 54px "Prompt"';
          ctx.fillText(item.value, bx + 188, by + 185);
          ctx.fillStyle = '#334155';
          ctx.font = '600 28px "Noto Sans Thai"';
          ctx.fillText(item.note || '', bx + 188, by + 275);
        });
      } else {
        bullets.forEach((b, idx) => {
          const itemP = clamp((p - idx * 0.14) * 4, 0, 1);
          ctx.save();
          ctx.globalAlpha = isSketch ? 1 : itemP;
          const by = cardY + 150 + idx * 120;
          drawRoundRect(ctx, cardX + 42, by, cardW - 84, 96, 18);
          ctx.fillStyle = isSketch ? '#f1f5f9' : '#e0f2fe';
          ctx.fill();
          ctx.fillStyle = isSketch ? '#0f172a' : '#0284c7';
          ctx.beginPath(); ctx.arc(cardX + 94, by + 48, 22, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 26px "Prompt"';
          ctx.textAlign = 'center';
          ctx.fillText(String(idx + 1), cardX + 94, by + 49);

          ctx.fillStyle = '#0f172a';
          ctx.font = '600 34px "Noto Sans Thai"';
          ctx.textAlign = 'left';
          ctx.fillText(b, cardX + 136, by + 49);
          ctx.restore();
        });
      }
      ctx.restore();

      // 3. Determine active viseme at time t
      const visemes = scene.params?.visemes || timeline.visemes || [];
      const activeVis = visemes.find((v) => t >= v.startSec && t <= v.endSec);
      const visemeCode = activeVis ? activeVis.viseme : 'REST';

      // 4. Bottom Zone: Mascot Stage (below caption bar, y base = 1860)
      drawMascotRig(ctx, 540, 1865, 1.0, {
        pose: scene.params?.pose || 'explain',
        viseme: visemeCode,
        t,
        isSketch,
      });

      // Sketch Zone Label
      if (isSketch) {
        ctx.fillStyle = '#334155';
        ctx.font = '600 24px "Prompt"';
        ctx.textAlign = 'left';
        ctx.fillText('[MASCOT ZONE: pose=' + (scene.params?.pose || 'explain') + ', viseme=' + visemeCode + ']', 110, 1365);
      }
    }
  `;
}
