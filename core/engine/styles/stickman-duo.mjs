/**
 * Style Renderer: `stickman-duo` (2-Speaker Articulated Stickman Dialogue)
 * Recipes: `duo-intro`, `duo-debate`, `duo-takeaway`
 */
export function getStickmanStyleScript() {
  return `
    function renderStickmanDuoScene(ctx, timeline, scene, p, t, W, H, isSketch) {
      // 1. Studio Stage Backdrop
      if (isSketch) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);
      } else {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#090d16');
        bg.addColorStop(0.65, '#111827');
        bg.addColorStop(1, '#1e293b');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Floor stage horizon
        ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
        ctx.fillRect(0, 1230, W, H - 1230);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, 1230); ctx.lineTo(W, 1230); ctx.stroke();
      }

      // 2. Active Caption & Active Speaker Detection
      const activeCap = (scene.captions || []).find((c) => t >= c.startSec && t <= c.endSec);
      const activeSpeaker = activeCap?.speaker || scene.params?.defaultSpeaker || 'A';
      const visemes = scene.params?.visemes || timeline.visemes || [];
      const activeVis = visemes.find((v) => t >= v.startSec && t <= v.endSec);
      const visemeCode = activeVis ? activeVis.viseme : 'REST';

      // 3. Top Topic Whiteboard / Context Panel (y: 475..725)
      const boardX = 110;
      const boardY = 475;
      const boardW = 860;
      const boardH = 250;
      drawRoundRect(ctx, boardX, boardY, boardW, boardH, 24);
      ctx.fillStyle = isSketch ? '#ffffff' : 'rgba(15, 23, 42, 0.85)';
      ctx.fill();
      ctx.strokeStyle = isSketch ? '#0f172a' : (activeSpeaker === 'A' ? '#38bdf8' : '#fb7185');
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.fillStyle = isSketch ? '#0f172a' : '#f8fafc';
      ctx.font = '700 38px "Prompt"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(scene.params?.boardTitle || 'ประเด็นสนทนา', 540, boardY + 62);

      const points = scene.params?.boardPoints || [];
      points.slice(0, 2).forEach((pt, idx) => {
        ctx.fillStyle = isSketch ? '#334155' : '#cbd5e1';
        ctx.font = '600 32px "Noto Sans Thai"';
        ctx.fillText('• ' + pt, 540, boardY + 132 + idx * 54);
      });

      // 4. Stage Spotlight on Active Speaker
      if (!isSketch) {
        const spotX = activeSpeaker === 'A' ? 305 : 775;
        const spotColor = activeSpeaker === 'A' ? 'rgba(56, 189, 248, 0.16)' : 'rgba(251, 113, 133, 0.16)';
        const sg = ctx.createRadialGradient(spotX, 980, 40, spotX, 1080, 390);
        sg.addColorStop(0, spotColor);
        sg.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, 700, W, 620);
      }

      // 5. Two Stickman Characters (A on Left, B on Right)
      const speakerAName = scene.params?.speakerAName || 'คุณลิป (ผู้เล่า)';
      const speakerBName = scene.params?.speakerBName || 'คุณซ่า (ผู้ถาม)';

      drawStickmanCharacter(ctx, 305, 1265, 1.15, {
        facing: 1,
        color: '#38bdf8',
        headFill: '#0f172a',
        isSpeaking: activeSpeaker === 'A' && Boolean(activeCap),
        expression: activeCap?.speaker === 'A' ? (activeCap.expression || 'explain') : 'neutral',
        gesture: activeCap?.speaker === 'A' ? (activeCap.gesture || 'explain') : 'idle',
        viseme: activeSpeaker === 'A' ? visemeCode : 'REST',
        t,
        isSketch,
        name: speakerAName,
      });

      drawStickmanCharacter(ctx, 775, 1265, 1.15, {
        facing: -1,
        color: '#fb7185',
        headFill: '#0f172a',
        isSpeaking: activeSpeaker === 'B' && Boolean(activeCap),
        expression: activeCap?.speaker === 'B' ? (activeCap.expression || 'question') : 'agree',
        gesture: activeCap?.speaker === 'B' ? (activeCap.gesture || 'point') : 'idle',
        viseme: activeSpeaker === 'B' ? visemeCode : 'REST',
        t,
        isSketch,
        name: speakerBName,
      });

      // 6. Active Speaker Bubble Badge
      if (activeCap) {
        const bx = activeSpeaker === 'A' ? 305 : 775;
        const badgeLbl = activeSpeaker === 'A' ? 'กำลังอธิบาย...' : 'ถามต่อ...';
        ctx.font = '700 24px "Noto Sans Thai"';
        const bw = ctx.measureText(badgeLbl).width + 34;
        drawRoundRect(ctx, bx - bw / 2, 770, bw, 46, 23);
        ctx.fillStyle = isSketch ? '#ffffff' : (activeSpeaker === 'A' ? '#0284c7' : '#e11d48');
        ctx.fill();
        if (isSketch) { ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke(); }
        ctx.fillStyle = isSketch ? '#0f172a' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeLbl, bx, 794);
      }
    }
  `;
}
