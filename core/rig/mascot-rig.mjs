/**
 * Browser-side Clean-Room Mascot Rig + Private Owner Asset Adapter.
 * - If window.__MASCOT_ASSETS__ is populated (loaded from user's privateAssetsDir outside public repo),
 *   renders the owner's 6 pose clean-plates and 6 mouth overlays seamlessly.
 * - Otherwise renders an original Clean-Room Vector Mascot Placeholder (6 poses + 6 visemes + blink)
 *   safe for public repo tests, CI, and examples.
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

    function drawPlaceholderMouth(ctx, x, y, viseme, isSketch) {
      ctx.save();
      ctx.translate(x, y);
      const stroke = isSketch ? '#0f172a' : '#1e1b4b';
      const inner = isSketch ? '#cbd5e1' : '#9f1239';
      const tongue = isSketch ? '#94a3b8' : '#fb7185';
      ctx.lineWidth = 4;
      ctx.strokeStyle = stroke;

      if (viseme === 'A') {
        ctx.fillStyle = inner;
        ctx.beginPath(); ctx.ellipse(0, 4, 22, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = tongue;
        ctx.beginPath(); ctx.ellipse(0, 12, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
      } else if (viseme === 'E') {
        ctx.fillStyle = inner;
        ctx.beginPath(); ctx.ellipse(0, 2, 26, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-16, -5, 32, 6);
      } else if (viseme === 'I') {
        ctx.fillStyle = inner;
        ctx.beginPath(); ctx.roundRect(-20, -4, 40, 11, 5); ctx.fill(); ctx.stroke();
      } else if (viseme === 'O') {
        ctx.fillStyle = inner;
        ctx.beginPath(); ctx.ellipse(0, 4, 14, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (viseme === 'U') {
        ctx.fillStyle = inner;
        ctx.beginPath(); ctx.arc(0, 4, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        // REST
        ctx.beginPath();
        ctx.moveTo(-18, 2);
        ctx.quadraticCurveTo(0, 10, 18, 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawMascotRig(ctx, cx, cy, scale, opts) {
      const { pose = 'idle', viseme = 'REST', t = 0, isSketch = false } = opts || {};
      const bobY = Math.sin(t * 3.2) * 5;
      const swayDeg = Math.sin(t * 1.8) * 1.6;
      const blinkCycle = t % 3.6;
      const isBlinking = blinkCycle > 3.44;

      // Use private owner PNG clean-plates if loaded
      const poseImg = window.__MASCOT_IMG_CACHE__['poses:' + pose] || window.__MASCOT_IMG_CACHE__['poses:idle'];
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

      // Clean-Room Vector Mascot Placeholder (6 poses + 6 visemes)
      ctx.save();
      ctx.translate(cx, cy + bobY);
      ctx.rotate((swayDeg * Math.PI) / 180);
      ctx.scale(scale, scale);

      const outline = isSketch ? '#0f172a' : '#1e293b';
      const bodyFill = isSketch ? '#e2e8f0' : '#0ea5e9';
      const accentFill = isSketch ? '#cbd5e1' : '#f59e0b';
      const skinFill = isSketch ? '#ffffff' : '#fde68a';

      // Shadow ellipse on floor
      ctx.fillStyle = isSketch ? 'rgba(15, 23, 42, 0.12)' : 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath(); ctx.ellipse(0, -6, 110, 20, 0, 0, Math.PI * 2); ctx.fill();

      // Torso (hoodie)
      ctx.fillStyle = bodyFill;
      ctx.strokeStyle = outline;
      ctx.lineWidth = 5;
      drawRoundRect(ctx, -82, -210, 164, 195, 56);
      ctx.fill(); ctx.stroke();

      // Collar / badge
      ctx.fillStyle = accentFill;
      ctx.beginPath(); ctx.arc(0, -145, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Articulated Arms by 6 Poses
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const gestureBob = Math.sin(t * 5.0) * 8;
      const poseMap = {
        idle:      { lx: -108, ly: -75,  rx: 108, ry: -75 },
        explain:   { lx: -125, ly: -125 + gestureBob, rx: 135, ry: -140 - gestureBob },
        point_up:  { lx: -108, ly: -80,  rx: 128, ry: -260 + gestureBob * 0.5 },
        excited:   { lx: -135, ly: -235 + gestureBob, rx: 135, ry: -235 - gestureBob },
        thinking:  { lx: -105, ly: -80,  rx: 42,  ry: -215 },
        welcome:   { lx: -145, ly: -165, rx: 145, ry: -165 },
      };
      const arm = poseMap[pose] || poseMap.idle;

      // Left arm
      ctx.strokeStyle = outline; ctx.lineWidth = 22;
      ctx.beginPath(); ctx.moveTo(-76, -170); ctx.quadraticCurveTo(-110, -130, arm.lx, arm.ly); ctx.stroke();
      ctx.strokeStyle = bodyFill; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.moveTo(-76, -170); ctx.quadraticCurveTo(-110, -130, arm.lx, arm.ly); ctx.stroke();
      ctx.fillStyle = skinFill; ctx.strokeStyle = outline; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(arm.lx, arm.ly, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Right arm
      ctx.strokeStyle = outline; ctx.lineWidth = 22;
      ctx.beginPath(); ctx.moveTo(76, -170); ctx.quadraticCurveTo(110, -130, arm.rx, arm.ry); ctx.stroke();
      ctx.strokeStyle = bodyFill; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.moveTo(76, -170); ctx.quadraticCurveTo(110, -130, arm.rx, arm.ry); ctx.stroke();
      ctx.fillStyle = skinFill; ctx.strokeStyle = outline; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(arm.rx, arm.ry, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Head
      ctx.fillStyle = skinFill;
      ctx.strokeStyle = outline;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, -290, 92, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Headphones / Cap Crest (Original mascot placeholder silhouette)
      ctx.fillStyle = accentFill;
      ctx.beginPath();
      ctx.arc(0, -304, 96, Math.PI * 1.08, Math.PI * 1.92);
      ctx.lineWidth = 16;
      ctx.strokeStyle = isSketch ? '#334155' : '#0284c7';
      ctx.stroke();

      // Ear cups
      ctx.fillStyle = accentFill; ctx.strokeStyle = outline; ctx.lineWidth = 4;
      drawRoundRect(ctx, -108, -322, 24, 58, 10); ctx.fill(); ctx.stroke();
      drawRoundRect(ctx, 84, -322, 24, 58, 10); ctx.fill(); ctx.stroke();

      // Eyes (blinking)
      for (const ex of [-32, 32]) {
        if (isBlinking) {
          ctx.strokeStyle = outline; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(ex - 14, -300); ctx.lineTo(ex + 14, -300); ctx.stroke();
        } else {
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = outline; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(ex, -300, 15, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath(); ctx.arc(ex + 2, -298, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(ex + 5, -302, 3, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Eyebrows
      ctx.strokeStyle = outline; ctx.lineWidth = 5;
      const browLift = pose === 'excited' || pose === 'point_up' ? -8 : pose === 'thinking' ? -4 : 0;
      ctx.beginPath(); ctx.moveTo(-48, -326 + browLift); ctx.lineTo(-18, -329 + browLift); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, -329 + (pose === 'thinking' ? 4 : browLift)); ctx.lineTo(48, -326 + browLift); ctx.stroke();

      // Mouth (6 Visemes)
      drawPlaceholderMouth(ctx, 0, -250, viseme, isSketch);

      ctx.restore();
    }
  `;
}
