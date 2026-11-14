/**
 * Style Renderer: `mystery-stage` (Investigative Board + Fog + Candlelight + Flashlight + Red Thread)
 * Recipes: `evidence-board`, `clue-zoom`, `case-verdict`
 */
export function getMysteryStyleScript() {
  return `
    function renderMysteryStageScene(ctx, timeline, scene, p, t, W, H, isSketch) {
      // 1. Dark Investigative Slate / Corkboard Backdrop
      if (isSketch) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);
      } else {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#09090b');
        bg.addColorStop(0.5, '#18181b');
        bg.addColorStop(1, '#09090b');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Subtle evidence board grid
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.06)';
        ctx.lineWidth = 1.5;
        for (let x = 0; x <= W; x += 72) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 72) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      }

      // 2. Evidence Cards & Animated Red String Thread
      const cards = scene.params?.evidenceCards || [];
      if (cards.length > 1) {
        const threadProgress = easeOutCubic(clamp(p * 1.4, 0, 1));
        const totalSegs = cards.length - 1;
        const exactSeg = threadProgress * totalSegs;

        ctx.save();
        ctx.strokeStyle = isSketch ? '#dc2626' : '#ef4444';
        ctx.lineWidth = 5;
        if (!isSketch) {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
        }
        ctx.beginPath();
        for (let i = 0; i < totalSegs; i++) {
          const segT = clamp(exactSeg - i, 0, 1);
          if (segT <= 0) break;
          const a = cards[i];
          const b = cards[i + 1];
          const ax = a.x, ay = a.y - (a.h || 230) / 2 + 10;
          const bx = b.x, by = b.y - (b.h || 230) / 2 + 10;
          const cx = (ax + bx) / 2;
          const cy = Math.max(ay, by) + 45;
          ctx.moveTo(ax, ay);
          // Quadratic curve progressive trace
          const steps = 20;
          const maxS = Math.max(1, Math.floor(steps * segT));
          for (let s = 1; s <= maxS; s++) {
            const u = s / steps;
            const px = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx;
            const py = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by;
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      for (const card of cards) {
        drawEvidenceCard(ctx, card, t, isSketch);
      }

      // 3. Verdict Stamp Overlay (for 'case-verdict' recipe)
      if (scene.recipe === 'case-verdict' && scene.params?.stampText) {
        const stampScale = lerp(1.35, 1.0, easeOutCubic(clamp(p * 3.0, 0, 1)));
        ctx.save();
        ctx.translate(565, 1085);
        ctx.rotate(-0.10);
        ctx.scale(stampScale, stampScale);
        ctx.font = '700 46px "Prompt"';
        const sw = ctx.measureText(scene.params.stampText).width + 56;
        ctx.strokeStyle = isSketch ? '#dc2626' : '#ef4444';
        ctx.lineWidth = 6;
        ctx.strokeRect(-sw / 2, -40, sw, 80);
        ctx.fillStyle = isSketch ? '#dc2626' : '#ef4444';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(scene.params.stampText, 0, 2);
        ctx.restore();
      }

      // 4. Procedural Atmosphere (Fog + Flickering Candle + Flashlight Beam + Vignette)
      const focusCard = cards[Math.min(cards.length - 1, Math.floor(p * cards.length))];
      drawMysteryAtmosphere(ctx, W, H, t, timeline.seed, {
        fogIntensity: scene.params?.fogIntensity ?? 0.65,
        candlePos: { x: 145, y: 1200 },
        flashlight: {
          originX: 540,
          originY: 1850,
          targetX: focusCard ? focusCard.x : 540 + Math.sin(t * 1.3) * 220,
          targetY: focusCard ? focusCard.y : 850,
        },
        isSketch,
      });
    }
  `;
}
