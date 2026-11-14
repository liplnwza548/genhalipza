/**
 * Browser-side Procedural Canvas Atmosphere Engine for `mystery-stage`.
 * Deterministic per-frame fog, flickering candlelight, sweeping flashlight cone,
 * film grain, and detective evidence board with animated red string.
 */
export function getMysteryFxScript() {
  return `
    function drawMysteryAtmosphere(ctx, W, H, t, seed, opts) {
      const { fogIntensity = 0.6, candlePos = null, flashlight = null, isSketch = false } = opts || {};
      if (isSketch) return;

      // 1. Drifting Volumetric Fog Bands (deterministic sine harmonics)
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const speed = (i % 2 === 0 ? 1 : -1) * (18 + i * 7);
        const fx = ((W * 0.5 + Math.sin(t * 0.35 + i * 1.7 + seed) * 260 + t * speed) % (W + 400)) - 200;
        const fy = 420 + i * 270 + Math.cos(t * 0.5 + i) * 35;
        const grad = ctx.createRadialGradient(fx, fy, 40, fx, fy, 460);
        grad.addColorStop(0, 'rgba(148, 163, 184, ' + (0.12 * fogIntensity).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();

      // 2. Flickering Candlelight Glow
      if (candlePos) {
        const flicker = 0.88 + 0.08 * Math.sin(t * 17.3) + 0.04 * Math.cos(t * 29.7);
        const rad = 360 * flicker;
        const cg = ctx.createRadialGradient(candlePos.x, candlePos.y, 12, candlePos.x, candlePos.y, rad);
        cg.addColorStop(0, 'rgba(255, 214, 102, 0.36)');
        cg.addColorStop(0.35, 'rgba(249, 115, 22, 0.16)');
        cg.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = cg;
        ctx.fillRect(0, 0, W, H);

        // Candle stick + flame
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(candlePos.x - 10, candlePos.y + 18, 20, 48);
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.ellipse(candlePos.x, candlePos.y + 4, 8 * flicker, 16 * flicker, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(candlePos.x, candlePos.y + 6, 4 * flicker, 9 * flicker, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Sweeping Flashlight Cone
      if (flashlight) {
        const originX = flashlight.originX ?? W * 0.5;
        const originY = flashlight.originY ?? H * 0.92;
        const targetX = flashlight.targetX ?? (W * 0.5 + Math.sin(t * 1.1) * 280);
        const targetY = flashlight.targetY ?? (H * 0.45 + Math.cos(t * 0.8) * 120);
        const angle = Math.atan2(targetY - originY, targetX - originX);
        const spread = 0.24;
        const len = 1350;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const fg = ctx.createRadialGradient(originX, originY, 30, originX, originY, len);
        fg.addColorStop(0, 'rgba(254, 249, 195, 0.32)');
        fg.addColorStop(0.6, 'rgba(254, 240, 138, 0.12)');
        fg.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.arc(originX, originY, len, angle - spread, angle + spread);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 4. Deep Vignette
      const vig = ctx.createRadialGradient(W * 0.5, H * 0.48, W * 0.28, W * 0.5, H * 0.5, H * 0.65);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(2, 6, 23, 0.78)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }

    function drawEvidenceCard(ctx, card, t, isSketch) {
      ctx.save();
      const sway = Math.sin(t * 1.6 + card.x * 0.01) * 0.015;
      ctx.translate(card.x, card.y);
      ctx.rotate((card.tiltDeg || 0) * Math.PI / 180 + sway);

      const cw = card.w || 320;
      const ch = card.h || 230;
      // Drop shadow
      if (!isSketch) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(-cw / 2 + 10, -ch / 2 + 12, cw, ch);
      }

      // Polaroid paper card
      ctx.fillStyle = isSketch ? '#ffffff' : '#f1f5f9';
      ctx.strokeStyle = isSketch ? '#0f172a' : '#334155';
      ctx.lineWidth = 3;
      ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
      ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);

      // Photo inner frame
      ctx.fillStyle = isSketch ? '#e2e8f0' : '#0f172a';
      ctx.fillRect(-cw / 2 + 18, -ch / 2 + 18, cw - 36, ch - 82);

      // Clues icon/tag inside photo
      ctx.fillStyle = isSketch ? '#0f172a' : '#f59e0b';
      ctx.font = '700 28px "Prompt"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.tag || 'EVIDENCE', 0, -24);

      // Handwritten / Thai clue label at bottom of Polaroid
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 26px "Noto Sans Thai"';
      ctx.fillText(card.label || '', 0, ch / 2 - 32);

      // Red pushpin at top center
      ctx.fillStyle = isSketch ? '#0f172a' : '#dc2626';
      ctx.beginPath(); ctx.arc(0, -ch / 2 + 10, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();

      ctx.restore();
    }
  `;
}
