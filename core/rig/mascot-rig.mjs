/**
 * Browser-side Mascot Rig + Private Owner Asset Adapter (Overhauled)
 * LOCKED 2026-11-15 (Philip): the REAL LipInwZa mascot (master-lock PNG) is the
 * primary mascot, loaded from privateAssetsDir / GENHALIPZA_PRIVATE_ASSETS.
 * - If window.__MASCOT_ASSETS__ is loaded, renders the owner's high-res PNG
 *   poses & mouth overlays cleanly. This is the ONLY approved mascot for
 *   LipInwZa clips.
 * - Otherwise renders a generic Clean-Room Cel-Shaded Mascot (styled hair,
 *   hoodie, expressive eyes/brows, articulated hands, 6 poses + 6 smooth
 *   visemes + blink) as a FALLBACK ONLY for testing when no private assets
 *   are present. The fallback is NOT the LipInwZa mascot and must never be
 *   presented as Philip's mascot.
 */
export function getMascotRigScript() {
  return `
    window.__MASCOT_ASSETS__ = null;
    window.__MASCOT_IMG_CACHE__ = {};
    window.setMascotAssets = async (assetDataUris) => {
      window.__MASCOT_ASSETS__ = assetDataUris || null;
      window.__MASCOT_IMG_CACHE__ = {};
      if (!assetDataUris) return;
      const entries = [];
      for (const [group, map] of Object.entries(assetDataUris)) {
        if (!map || typeof map !== 'object') continue;
        for (const [key, uri] of Object.entries(map)) {
          entries.push(new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              window.__MASCOT_IMG_CACHE__[group + ':' + key] = img;
              resolve();
            };
            img.onerror = () => resolve();
            img.src = uri;
          }));
        }
      }
      await Promise.all(entries);
    };

    function drawExpressiveMouth(ctx, x, y, viseme, isSketch) {
      ctx.save();
      ctx.translate(x, y);
      const stroke = '#1e1b4b';
      const inner = isSketch ? '#cbd5e1' : '#881337';
      const tongue = isSketch ? '#94a3b8' : '#fb7185';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = stroke;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      if (viseme === 'A') {
        ctx.fillStyle = inner;
        ctx.beginPath(); ctx.ellipse(0, 5, 22, 19, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.roundRect(-14, -10, 28, 7, 3); ctx.fill();
        ctx.fillStyle = tongue;
        ctx.beginPath(); ctx.ellipse(0, 14, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
      } else if (viseme === 'E') {
        ctx.fillStyle = inner;
        ctx.beginPath(); ctx.roundRect(-24, -6, 48, 20, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.roundRect(-18, -4, 36, 7, 3); ctx.fill();
      } else if (viseme === 'I') {
        ctx.fillStyle = inner;
        ctx.beginPath(); ctx.roundRect(-19, -4, 38, 12, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-14, -2, 28, 4);
      } else if (viseme === 'O') {
        ctx.fillStyle = inner;
        ctx.beginPath(); ctx.ellipse(0, 5, 14, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (viseme === 'U') {
        ctx.fillStyle = inner;
        ctx.beginPath(); ctx.ellipse(0, 5, 10, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        // Warm confident smile
        ctx.beginPath();
        ctx.moveTo(-19, 1);
        ctx.quadraticCurveTo(0, 13, 19, 1);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawStyledHand(ctx, x, y, r, angle, poseType, isSketch) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const skin = isSketch ? '#ffffff' : '#fed7aa';
      const skinShade = isSketch ? '#e2e8f0' : '#fdba74';
      ctx.fillStyle = skin;
      ctx.strokeStyle = '#181b26';
      ctx.lineWidth = 4.5;

      if (poseType === 'thumbs_up') {
        // Fist + raised thumb
        drawRoundRect(ctx, -20, -14, 40, 32, 12);
        ctx.fill(); ctx.stroke();
        drawRoundRect(ctx, -8, -42, 16, 32, 8);
        ctx.fill(); ctx.stroke();
      } else if (poseType === 'point') {
        drawRoundRect(ctx, -16, -14, 34, 28, 12);
        ctx.fill(); ctx.stroke();
        drawRoundRect(ctx, 10, -10, 26, 12, 6);
        ctx.fill(); ctx.stroke();
      } else {
        // Open palm with subtle shading
        ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.86, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = skinShade;
        ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 0.65, r * 0.35, 0, 0, Math.PI); ctx.fill();
      }
      ctx.restore();
    }

    function drawMascotRig(ctx, cx, cy, scale, opts) {
      const { pose = 'explain', viseme = 'REST', t = 0, isSketch = false } = opts || {};
      const bobY = Math.sin(t * 2.8) * 6;
      const swayDeg = Math.sin(t * 1.6) * 1.3;
      const blinkCycle = t % 3.4;
      const isBlinking = blinkCycle > 3.25;

      // Normalize pose aliases
      const normPose = pose === 'point_up' ? 'point_right'
        : pose === 'excited' ? 'thumbs_up'
        : pose === 'welcome' ? 'explain'
        : pose === 'idle' ? 'explain'
        : pose;

      // 1. Private owner PNG clean-plates if loaded
      const poseImg = window.__MASCOT_IMG_CACHE__['poses:' + normPose] || window.__MASCOT_IMG_CACHE__['poses:explain'];
      if (poseImg) {
        ctx.save();
        ctx.translate(cx, cy + bobY);
        ctx.rotate((swayDeg * Math.PI) / 180);
        ctx.scale(scale, scale);
        const w = poseImg.width;
        const h = poseImg.height;
        ctx.drawImage(poseImg, -w / 2, -h, w, h);
        const mouthImg = window.__MASCOT_IMG_CACHE__['mouths:' + viseme] || window.__MASCOT_IMG_CACHE__['mouths:REST'];
        if (mouthImg) {
          ctx.drawImage(mouthImg, -mouthImg.width / 2, -h * 0.62, mouthImg.width, mouthImg.height);
        }
        ctx.restore();
        return;
      }

      // 2. Clean-Room Cel-Shaded Vector Mascot (Hoodie + Styled Hair + Expressive Face)
      ctx.save();
      ctx.translate(cx, cy + bobY);
      ctx.rotate((swayDeg * Math.PI) / 180);
      ctx.scale(scale * 1.12, scale * 1.12);

      const ink = '#181b26';
      const hoodieBase = isSketch ? '#e2e8f0' : '#1e293b';
      const hoodieLight = isSketch ? '#f8fafc' : '#334155';
      const hoodieDark = isSketch ? '#cbd5e1' : '#0f172a';
      const skin = isSketch ? '#ffffff' : '#ffedd5';
      const skinShadow = isSketch ? '#e2e8f0' : '#fdba74';
      const hairCol = isSketch ? '#334155' : '#1c1917';
      const hairHi = isSketch ? '#64748b' : '#44403c';
      const accent = isSketch ? '#94a3b8' : '#38bdf8';

      // Soft ground shadow
      ctx.fillStyle = isSketch ? 'rgba(15, 23, 42, 0.10)' : 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath(); ctx.ellipse(0, -4, 155, 22, 0, 0, Math.PI * 2); ctx.fill();

      // Hoodie Torso with gradient
      ctx.save();
      const bodyGrad = ctx.createLinearGradient(0, -230, 0, -10);
      bodyGrad.addColorStop(0, hoodieLight);
      bodyGrad.addColorStop(0.55, hoodieBase);
      bodyGrad.addColorStop(1, hoodieDark);
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(-125, -14);
      ctx.quadraticCurveTo(-132, -165, -78, -210);
      ctx.lineTo(78, -210);
      ctx.quadraticCurveTo(132, -165, 125, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Hoodie collar & hood rim
      ctx.fillStyle = hoodieDark;
      ctx.beginPath();
      ctx.ellipse(0, -206, 76, 26, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Hoodie strings
      ctx.strokeStyle = isSketch ? '#475569' : '#e2e8f0';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-24, -184); ctx.lineTo(-27, -124); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24, -184); ctx.lineTo(27, -124); ctx.stroke();

      // Front pocket & small chest badge
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-66, -14); ctx.lineTo(-52, -78); ctx.lineTo(52, -78); ctx.lineTo(66, -14);
      ctx.stroke();

      if (!isSketch) {
        drawRoundRect(ctx, -46, -155, 92, 26, 13);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.fill();
        ctx.fillStyle = accent;
        ctx.font = '800 16px "Prompt", "Kanit"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LIPZA', 0, -141);
      }
      ctx.restore();

      // Articulated Arms & Hands by Pose
      const gWave = Math.sin(t * 4.2) * 8;
      const poseArms = {
        explain:     { lx: -158, ly: -135 + gWave, lAng: -0.4, lHand: 'open',      rx: 158, ry: -135 - gWave, rAng: 0.4,  rHand: 'open' },
        point_right: { lx: -120, ly: -70,          lAng: 0.2,  lHand: 'open',      rx: 185, ry: -210 + gWave, rAng: -0.3, rHand: 'point' },
        point_left:  { lx: -185, ly: -210 + gWave, lAng: 3.4,  lHand: 'point',     rx: 120, ry: -70,          rAng: -0.2, rHand: 'open' },
        thinking:    { lx: -118, ly: -72,          lAng: 0.2,  lHand: 'open',      rx: 46,  ry: -206,         rAng: 0.1,  rHand: 'open' },
        thumbs_up:   { lx: -122, ly: -82,          lAng: 0.2,  lHand: 'open',      rx: 152, ry: -180 + gWave, rAng: 0.0,  rHand: 'thumbs_up' },
        magnify:     { lx: -125, ly: -78,          lAng: 0.2,  lHand: 'open',      rx: 138, ry: -200 + gWave, rAng: -0.2, rHand: 'open' },
      };
      const arm = poseArms[normPose] || poseArms.explain;

      // Left arm sleeve + hand
      ctx.lineCap = 'round';
      ctx.strokeStyle = ink; ctx.lineWidth = 36;
      ctx.beginPath(); ctx.moveTo(-88, -172); ctx.quadraticCurveTo(-132, -135, arm.lx, arm.ly); ctx.stroke();
      ctx.strokeStyle = hoodieBase; ctx.lineWidth = 25;
      ctx.beginPath(); ctx.moveTo(-88, -172); ctx.quadraticCurveTo(-132, -135, arm.lx, arm.ly); ctx.stroke();
      drawStyledHand(ctx, arm.lx, arm.ly, 22, arm.lAng, arm.lHand, isSketch);

      // Right arm sleeve + hand
      ctx.strokeStyle = ink; ctx.lineWidth = 36;
      ctx.beginPath(); ctx.moveTo(88, -172); ctx.quadraticCurveTo(132, -135, arm.rx, arm.ry); ctx.stroke();
      ctx.strokeStyle = hoodieBase; ctx.lineWidth = 25;
      ctx.beginPath(); ctx.moveTo(88, -172); ctx.quadraticCurveTo(132, -135, arm.rx, arm.ry); ctx.stroke();
      drawStyledHand(ctx, arm.rx, arm.ry, 22, arm.rAng, arm.rHand, isSketch);

      // Neck
      ctx.fillStyle = skinShadow;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 4.5;
      drawRoundRect(ctx, -26, -236, 52, 42, 16);
      ctx.fill(); ctx.stroke();

      // Ears
      for (const side of [-1, 1]) {
        ctx.fillStyle = skinShadow;
        ctx.beginPath(); ctx.ellipse(side * 96, -296, 17, 24, side * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      // Head base with warm soft shading
      const headGrad = ctx.createRadialGradient(-24, -330, 15, 0, -298, 115);
      headGrad.addColorStop(0, skin);
      headGrad.addColorStop(0.75, skin);
      headGrad.addColorStop(1, skinShadow);
      ctx.fillStyle = headGrad;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.ellipse(0, -304, 96, 94, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Subtle blush cheeks
      if (!isSketch) {
        ctx.fillStyle = 'rgba(251, 113, 133, 0.24)';
        ctx.beginPath(); ctx.ellipse(-54, -276, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(54, -276, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Styled Spiky-Side Hair Crown + Bangs
      ctx.fillStyle = hairCol;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-98, -310);
      ctx.quadraticCurveTo(-110, -385, -52, -412);
      ctx.lineTo(-34, -432);
      ctx.lineTo(-10, -414);
      ctx.lineTo(18, -438);
      ctx.lineTo(38, -412);
      ctx.lineTo(68, -422);
      ctx.quadraticCurveTo(110, -380, 98, -310);
      ctx.quadraticCurveTo(75, -352, 42, -342);
      ctx.lineTo(18, -366);
      ctx.lineTo(-8, -338);
      ctx.lineTo(-36, -364);
      ctx.quadraticCurveTo(-68, -346, -98, -310);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Hair shine arc
      if (!isSketch) {
        ctx.strokeStyle = hairHi;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(-10, -368, 52, Math.PI * 1.15, Math.PI * 1.65);
        ctx.stroke();
      }

      // Expressive Eyes with catchlight
      for (const ex of [-34, 34]) {
        if (isBlinking) {
          ctx.strokeStyle = ink; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(ex - 15, -304); ctx.quadraticCurveTo(ex, -296, ex + 15, -304); ctx.stroke();
        } else {
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = ink; ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.ellipse(ex, -304, 16, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath(); ctx.ellipse(ex + 2, -302, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(ex + 6, -308, 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(ex - 2, -296, 2, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Eyebrows matching pose mood
      ctx.strokeStyle = ink; ctx.lineWidth = 6; ctx.lineCap = 'round';
      const browY = normPose === 'thumbs_up' ? -338 : normPose === 'thinking' ? -333 : -335;
      ctx.beginPath(); ctx.moveTo(-52, browY + 3); ctx.quadraticCurveTo(-34, browY - 4, -18, browY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, browY + (normPose === 'thinking' ? 5 : 0)); ctx.quadraticCurveTo(34, browY - 4, 52, browY + 3); ctx.stroke();

      // Cute subtle nose
      if (!isSketch) {
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, -282, 4, 0.2, Math.PI - 0.2); ctx.stroke();
      }

      // Expressive Mouth (6 Visemes)
      drawExpressiveMouth(ctx, 0, -254, viseme, isSketch);

      // Magnifying glass prop when pose === 'magnify'
      if (normPose === 'magnify') {
        ctx.save();
        ctx.translate(arm.rx - 4, arm.ry - 34);
        ctx.strokeStyle = ink; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, 44); ctx.stroke();
        ctx.fillStyle = isSketch ? 'rgba(203, 213, 225, 0.5)' : 'rgba(186, 230, 253, 0.45)';
        ctx.beginPath(); ctx.arc(0, -10, 32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }
  `;
}
