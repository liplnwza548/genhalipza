# GenhaLipza — สถานะสำหรับรับช่วง

อัปเดต: 15 พฤศจิกายน 2026 (Asia/Bangkok)

## สถานะปัจจุบัน

**Sprint 1 Overhaul Complete (`liplnwza-mascot` + `wonlok-plus` Clean-Room 100%) — Ready for Owner Review & Sprint 2**

### สรุปผลการยกระดับคุณภาพใน Sprint 1 (Clean-Room 100%)

1. **ระบบเสียงพูดไทยจริง + SFX + Ducked BGM:**
   - [`core/audio/tts_adapter.py`](core/audio/tts_adapter.py): สังเคราะห์เสียงพูดไทยทีละบรรทัด (`edge-tts` primary + `gTTS` fallback + `Audio-In`) พร้อม re-time `cues.json` และคำนวณ Word Timings อัตโนมัติ
   - [`core/audio/audio_mixer.py`](core/audio/audio_mixer.py): สังเคราะห์ SFX (`whoosh`, `pop`, `ding`, `boom`) และ BGM bed (`calm`, `warm`, `playful`, `dark`) ด้วย NumPy + speech ducking อัตโนมัติ ก่อนทำ 2-pass `-16 LUFS`
2. **ฟอนต์ & ซับไตเติลหลากหลายสไตล์ + MotionForge Visual Polish:**
   - เพิ่มฟอนต์ OFL `Kanit` (`Regular`, `SemiBold`, `Bold`, `ExtraBold`) ใน `assets/fonts/`
   - [`core/engine/subtitles.mjs`](core/engine/subtitles.mjs): รองรับ 4 สไตล์ (`pop-chips`, `bold-karaoke`, `clean-pill`, `cinema-minimal`)
   - [`core/engine/polish.mjs`](core/engine/polish.mjs): เพิ่ม Bloom, Vignette และ Temporal Grain แบบ deterministic
3. **2 สไตล์หลักของ Sprint 1 (`9:16` 1080×1920) ผ่าน Automated QC:**
   - **`liplnwza-mascot` (`mvp-mascot-15s`, 397 frames / 13.217s):**
     - เวที 3 โซน AoT-style Paper (`#FFF6E8` + dot grid + Mac header) + Cel-Shaded Mascot ใหม่ ([`core/rig/mascot-rig.mjs`](core/rig/mascot-rig.mjs)) + ซับ `pop-chips` + เสียงไทย `gtts` + BGM `playful`
     - **QC:** `-16.16 LUFS`, `TP -1.78 dBTP`, SSIM `0.9894 / 0.9863 / 0.9884`
   - **`wonlok-plus` (`wonlok-kra-canal`, 698 frames / 23.273s):**
     - แผนที่ Neo-Geo + Coastal Glow + Live Telemetry Pill + Smart Label Collision Solver + ซับ `bold-karaoke` + เสียงไทย `gtts` + BGM `calm`
     - **QC:** `-16.16 LUFS`, `TP -1.96 dBTP`, SSIM `0.9790 / 0.9790 / 0.9792` (ผ่านครบทุกข้อ)

## คำสั่งทดสอบและรัน Sprint 1

```bash
npm run validate:schemas
npm run doctor
npm test
node core/cli/pipeline.mjs run --job assets/fixtures/mvp-mascot/job.json
node core/cli/pipeline.mjs run --job assets/fixtures/wonlok-3-topics/kra-canal/job.json
```

## Next action (Sprint 2)

- **Sprint 2:** ยกระดับ **`stickman-duo`** (2 ตัวละครโต้ตอบ + Speech Bubble + Expression) และ **`mystery-stage`** (Moody Atmosphere + Polaroid Board + Dark BGM + Sound Design) ตาม [`docs/OVERHAUL_BLUEPRINT.md`](docs/OVERHAUL_BLUEPRINT.md)
