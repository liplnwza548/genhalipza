# GenhaLipza — สถานะสำหรับรับช่วง

อัปเดต: 15 พฤศจิกายน 2026 (Asia/Bangkok)

## สถานะปัจจุบัน

**Phase 0B Automated Pipeline & QC Passed — Ready for Owner Visual/Audio Review (`accepted-by-owner` pending)**

### ผลพิสูจน์ Phase 0B (`npm run pilot:10s`) บน Linux Cloud VM
- **Job:** `assets/fixtures/sample-10s/job.json` (`1080×1920`, `9:16`, `30fps`, `300 frames`, `10.0s`)
- **Single Source of Truth:** Gate 3, Gate 4 และ Gate 5 ใช้ `timeline.json` และ Chromium Canvas Renderer ตัวเดียวกัน
- **เวลาที่วัดได้จริง (Warm single-tab browser reuse):**
  - Gate 3 (`gate3_sketch.png`, 2 scenes): **478 ms**
  - Gate 4 (`gate4_storyboard.png` + Full-Size PNGs, 2 keyframes): **379 ms**
  - Gate 5 (`final.mp4`, 300 frames): **30.25 s** (~9.9 fps)
- **Automated QC (`qc_report.json`):** `passed: true`
  - Video: `h264`, `1080×1920`, `30/1 fps`, `300 frames`, `videoDurationSec: 10`, `decodeErrors: ""`
  - Audio (วัดจาก `final.mp4` หลัง AAC encode): `aac`, `48000 Hz`, **`-15.96 LUFS`**, **`True Peak -10.1 dBTP`**
  - Thai Phrase Captions: 4 cues (non-overlapping, min cue ≥ 0.6s, no broken tone marks)
  - Gate 4 vs Final MP4 Frame Parity (SSIM): `scene-1` frame 45 = **`0.983981`**, `scene-2` frame 195 = **`0.982178`** (`>= 0.95`)

## คำสั่งรันซ้ำจาก Clean Checkout

```bash
npm install
npm run validate:schemas
npm run doctor
npm run smoke
npm run pilot:10s
```

## Next action (Phase 1)

1. ให้ Philip ตรวจรับภาพ/เสียงจริงของ `jobs/sample-10s/final.mp4`
2. เริ่ม **Phase 1**:
   - สร้างระบบ **Dependency Invalidation, Atomic Resume & Scene Patch** (แก้ซีนเดียวไม่ต้องเรนเดอร์ใหม่ทั้งหมด)
   - สร้าง **Thai Text Engine** (ตัดคำไทย + Safe Area + Bounding-box collision lint)
   - เพิ่ม **Gate 4 Motion Probe (2–3s)** และ **TTS Adapter** (Edge-TTS ไทย Multi-speaker พร้อม Audio-In fallback)
