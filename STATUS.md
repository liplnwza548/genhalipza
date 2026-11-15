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

## แก้ให้ตรงคำตัดสินของ Philip (branch `fix/locked-decisions` — ยังไม่ได้ push)

หลัง Sprint 1 Philip ตัดสินล็อก 5 ข้อ (ดู [`README.md`](README.md)) งานแก้ 4 อย่างนี้
ทำบน branch `fix/locked-decisions` ของเครื่องบีน ยังไม่ได้ push ขึ้น GitHub:

1. **เสียง → เสียงโคลนผ่าน Audio-In:** `mvp-mascot` กับ `wonlok-kra-canal`
   เปลี่ยนจาก `mode: tts` เป็น `mode: audio-in` ชี้
   `private_assets/voice/<job>-philip.wav` (โฟลเดอร์ส่วนตัว, gitignored)
   pipeline จะหยุดพร้อมบอกชัดถ้าไฟล์เสียงยังไม่มี — ห้ามเรนเดอร์ด้วยเสียง
   ปลอมแทนเสียง Philip เด็ดขาด เสียงฟรี edge-tts/gTTS เหลือแค่ตัวสำรอง
   ตอนทดสอบ (ดู `core/audio/tts_adapter.py`)
2. **มาสคอต → ตัวจริงเป็นตัวหลัก:** `mvp-mascot` ตั้ง `privateAssetsDir`
   เป็น `private_assets` แล้ว ตัวที่วาดจากโค้ด (`core/rig/mascot-rig.mjs`)
   เหลือแค่ตัวสำรองตอนไม่มีภาพส่วนตัว วิธีเตรียมภาพดูที่
   [`docs/PRIVATE_ASSETS.md`](docs/PRIVATE_ASSETS.md)
3. **ฟอนต์ → Prompt เป็นหลักทุกจุด:** font stack ทุก preset ใน
   `core/engine/subtitles.mjs`, `core/engine/html-template.mjs`,
   `core/engine/styles/*.mjs`, `core/rig/mascot-rig.mjs` ขึ้นต้นด้วย
   `"Prompt"` แล้ว Kanit เหลือแค่ตัวเลือกเสริม
4. **README ตรงกับของจริงแล้ว:** สถานะ Sprint 1 + ลิงก์
   `docs/OVERHAUL_BLUEPRINT.md` + คำตัดสินล็อก 5 ข้อ

### ⛔ สิ่งที่ยังขาด — เรนเดอร์ 2 คลิปนี้ยังทำไม่ได้จนกว่าจะมีของพวกนี้

- **เสียงโคลนของ 2 บทนี้ (ต้องเจนใหม่บน Colab):**
  `private_assets/voice/mvp-mascot-15s-philip.wav` (บท 3 ประโยค, 15.0 วิ)
  กับ `private_assets/voice/wonlok-kra-canal-philip.wav` (บท 6 ประโยค,
  30.0 วิ) — บททั้งหมดอยู่ใน [`docs/PRIVATE_ASSETS.md`](docs/PRIVATE_ASSETS.md)
- **ภาพท่ามาสคอต 6 ท่า + แผ่นปาก 6 แบบ** ตามชื่อที่ rig ต้องการ
  (`poses/{explain,point_right,point_left,thinking,thumbs_up,magnify}.png`,
  `mouth_rig/{A,E,I,O,U,REST}.png`) — ของที่มีอยู่ตอนนี้ไม่ตรงชื่อ
  และยังไม่มีแผ่นปากครบ

## Next action (Sprint 2)

- **Sprint 2:** ยกระดับ **`stickman-duo`** (2 ตัวละครโต้ตอบ + Speech Bubble + Expression) และ **`mystery-stage`** (Moody Atmosphere + Polaroid Board + Dark BGM + Sound Design) ตาม [`docs/OVERHAUL_BLUEPRINT.md`](docs/OVERHAUL_BLUEPRINT.md)
- **ก่อน Sprint 2:** ต้องมีเสียงโคลน 2 ไฟล์ + ภาพท่า/แผ่นปากมาสคอตก่อน
  แล้วเรนเดอร์ `mvp-mascot-15s` กับ `wonlok-kra-canal` ด้วยของจริงให้
  Philip ฟัง/ดู แล้วค่อย push branch `fix/locked-decisions` ขึ้น `main`
  เมื่อ Philip อนุมัติ
