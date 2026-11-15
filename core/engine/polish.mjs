/**
 * MotionForge-Inspired Clean-Room Visual Polish Layer
 * - Deterministic Film/Paper Grain (pre-baked 256x256 tile shifted per frameIndex via mulberry32)
 * - Soft Atmospheric Vignette
 * - Subtle Bloom Glow pass for highlights
 */
export function getPolishScript() {
  return `
    let __grainCanvas = null;
    function getGrainTile() {
      if (__grainCanvas) return __grainCanvas;
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const gctx = c.getContext('2d');
      const img = gctx.createImageData(256, 256);
      const rng = mulberry32(20261115);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.floor(110 + (rng() - 0.5) * 44);
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 28;
      }
      gctx.putImageData(img, 0, 0);
      __grainCanvas = c;
      return c;
    }

    let __bloomCanvas = null;
    function applyMotionForgePolish(ctx, W, H, frameIndex, opts) {
      const { grain = true, bloom = true, vignette = true, isDark = true, isSketch = false } = opts || {};
      if (isSketch) return;

      // 1. Subtle Bloom (fast downsampled bilinear soft glow composited with screen)
      if (bloom) {
        if (!__bloomCanvas) {
          __bloomCanvas = document.createElement('canvas');
          __bloomCanvas.width = 135;
          __bloomCanvas.height = 240;
        }
        const bctx = __bloomCanvas.getContext('2d');
        bctx.imageSmoothingEnabled = true;
        bctx.clearRect(0, 0, 135, 240);
        bctx.drawImage(ctx.canvas, 0, 0, 135, 240);
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = isDark ? 0.14 : 0.06;
        ctx.drawImage(__bloomCanvas, 0, 0, W, H);
        ctx.restore();
      }

      // 2. Soft Atmospheric Vignette
      if (vignette) {
        ctx.save();
        const vg = ctx.createRadialGradient(W * 0.5, H * 0.48, W * 0.34, W * 0.5, H * 0.5, H * 0.68);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, isDark ? 'rgba(2, 6, 23, 0.42)' : 'rgba(120, 95, 65, 0.14)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // 3. Deterministic Temporal Film/Paper Grain
      if (grain) {
        const tile = getGrainTile();
        const rng = mulberry32(frameIndex * 7919 + 131);
        const ox = Math.floor(rng() * 256);
        const oy = Math.floor(rng() * 256);
        ctx.save();
        ctx.globalCompositeOperation = isDark ? 'overlay' : 'multiply';
        ctx.globalAlpha = isDark ? 0.32 : 0.24;
        const pat = ctx.createPattern(tile, 'repeat');
        ctx.translate(-ox, -oy);
        ctx.fillStyle = pat;
        ctx.fillRect(ox, oy, W + 256, H + 256);
        ctx.restore();
      }
    }
  `;
}
