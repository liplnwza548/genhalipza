/**
 * Browser-side Parametric Stickman Rig for 2-Speaker Dialogue (`stickman-duo`).
 * Deterministic kinematics driven by time `t`, active speaker state, expression, and viseme.
 */
export function getStickmanRigScript() {
  return `
    function drawStickmanCharacter(ctx, cx, baseY, scale, opts) {
      const {
        facing = 1,
        color = '#38bdf8',
        headFill = '#0f172a',
        isSpeaking = false,
        expression = 'neutral',
        gesture = 'idle',
        viseme = 'REST',
        t = 0,
        isSketch = false,
        name = '',
      } = opts || {};

      ctx.save();
      ctx.translate(cx, baseY);
      ctx.scale(scale, scale);

      const activeColor = isSketch ? '#0f172a' : (isSpeaking ? color : '#64748b');
      const alpha = isSpeaking || isSketch ? 1.0 : 0.72;
      ctx.globalAlpha = alpha;

      // Floor shadow
      ctx.fillStyle = isSketch ? 'rgba(15, 23, 42, 0.1)' : 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath(); ctx.ellipse(0, 0, 68, 14, 0, 0, Math.PI * 2); ctx.fill();

      // Spine kinematics (breathing + lean forward when speaking)
      const breathe = Math.sin(t * 2.8) * 3;
      const talkBob = isSpeaking ? Math.abs(Math.sin(t * 9.0)) * 5 : 0;
      const lean = (isSpeaking ? 10 : -4) * facing;

      const hip = { x: 0, y: -125 + breathe * 0.4 };
      const shoulder = { x: lean, y: -255 - talkBob + breathe };
      const head = { x: shoulder.x + lean * 0.35, y: shoulder.y - 68 };

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 11;

      if (!isSketch && isSpeaking) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
      }

      // Legs
      ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(-28, -58); ctx.lineTo(-34, -4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(28, -58); ctx.lineTo(34, -4); ctx.stroke();

      // Spine
      ctx.beginPath();
      ctx.moveTo(hip.x, hip.y);
      ctx.quadraticCurveTo(lean * 0.4, (hip.y + shoulder.y) / 2, shoulder.x, shoulder.y);
      ctx.stroke();

      // Articulated Arms
      const gWave = Math.sin(t * 6.5) * 18;
      let lElbow = { x: shoulder.x - 42, y: shoulder.y + 52 };
      let lHand = { x: shoulder.x - 32, y: shoulder.y + 108 };
      let rElbow = { x: shoulder.x + 42, y: shoulder.y + 52 };
      let rHand = { x: shoulder.x + 32, y: shoulder.y + 108 };

      if (isSpeaking) {
        if (gesture === 'point') {
          rElbow = { x: shoulder.x + 48 * facing, y: shoulder.y + 16 };
          rHand = { x: shoulder.x + 110 * facing, y: shoulder.y - 16 + gWave * 0.4 };
        } else if (gesture === 'excited') {
          lElbow = { x: shoulder.x - 52, y: shoulder.y - 12 };
          lHand = { x: shoulder.x - 74, y: shoulder.y - 65 + gWave * 0.5 };
          rElbow = { x: shoulder.x + 52, y: shoulder.y - 12 };
          rHand = { x: shoulder.x + 74, y: shoulder.y - 65 - gWave * 0.5 };
        } else if (gesture === 'think') {
          rElbow = { x: shoulder.x + 46 * facing, y: shoulder.y + 30 };
          rHand = { x: head.x + 18 * facing, y: head.y + 38 };
        } else {
          // Default animated explain
          rElbow = { x: shoulder.x + 48 * facing, y: shoulder.y + 38 };
          rHand = { x: shoulder.x + 78 * facing, y: shoulder.y + 10 + gWave };
        }
      } else {
        // Subtle listening nod
        head.y += Math.sin(t * 2.2) * 3;
      }

      ctx.beginPath(); ctx.moveTo(shoulder.x, shoulder.y); ctx.lineTo(lElbow.x, lElbow.y); ctx.lineTo(lHand.x, lHand.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(shoulder.x, shoulder.y); ctx.lineTo(rElbow.x, rElbow.y); ctx.lineTo(rHand.x, rHand.y); ctx.stroke();

      // Head circle
      ctx.fillStyle = isSketch ? '#ffffff' : headFill;
      ctx.beginPath(); ctx.arc(head.x, head.y, 48, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;

      // Eyes
      const eyeOffset = 8 * facing;
      const ex1 = head.x - 14 + eyeOffset;
      const ex2 = head.x + 14 + eyeOffset;
      const ey = head.y - 6;
      ctx.fillStyle = activeColor;
      if (expression === 'surprised') {
        ctx.beginPath(); ctx.arc(ex1, ey, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2, ey, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(ex1, ey, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2, ey, 4.5, 0, Math.PI * 2); ctx.fill();
      }

      // Expressive Mouth
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 4;
      const mx = head.x + eyeOffset;
      const my = head.y + 18;
      if (isSpeaking && viseme !== 'REST') {
        const openH = viseme === 'A' || viseme === 'O' ? 11 : 6;
        const openW = viseme === 'E' || viseme === 'I' ? 14 : 9;
        ctx.fillStyle = isSketch ? '#cbd5e1' : '#f43f5e';
        ctx.beginPath(); ctx.ellipse(mx, my, openW, openH, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (expression === 'agree' || expression === 'excited') {
        ctx.beginPath(); ctx.arc(mx, my - 4, 12, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(mx - 10, my); ctx.lineTo(mx + 10, my); ctx.stroke();
      }

      // Nameplate badge below character
      if (name) {
        ctx.globalAlpha = 1;
        ctx.font = '700 26px "Prompt"';
        const nw = ctx.measureText(name).width + 30;
        drawRoundRect(ctx, -nw / 2, 16, nw, 42, 21);
        ctx.fillStyle = isSketch ? '#ffffff' : (isSpeaking ? color : 'rgba(15, 23, 42, 0.85)');
        ctx.fill();
        ctx.strokeStyle = isSketch ? '#0f172a' : color;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = isSketch ? '#0f172a' : (isSpeaking ? '#0f172a' : '#e2e8f0');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, 0, 38);
      }

      ctx.restore();
    }
  `;
}
