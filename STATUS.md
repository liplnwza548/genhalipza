# GenhaLipza — สถานะสำหรับรับช่วง

อัปเดต: 15 พฤศจิกายน 2026 (Asia/Bangkok)

## สถานะปัจจุบัน

**Phase 1 Completed & Verified — Ready for Phase 2A (`wonlok-plus`)**

### สิ่งที่สร้างและพิสูจน์ผลแล้วใน Phase 1
1. **Thai Text Engine (`core/thai-text/thai-text.mjs` + Browser Canvas wrapper):**
   - ตัดคำไทยด้วย `Intl.Segmenter('th', { granularity: 'word' })` และ `grapheme` cluster ไม่ฉีกกลางคำและไม่ขึ้นต้นบรรทัดด้วยสระ/วรรณยุกต์
   - ใช้ `wrapThaiLines` วัด font metrics จริงใน Browser เพื่อให้ Gate 3, Gate 4 และ Gate 5 ตรงกัน 100%
2. **Dependency Invalidation, Atomic Resume & Scene Patch (`core/engine/state-manager.mjs`):**
   - Per-scene hash isolation (`computeSceneHashes`), atomic checkpoint writes (`writeJsonAtomic`), single-writer job lock (`acquireJobLock`), และ stale approval invalidation (`invalidateStaleApprovals`)
   - **ผลทดสอบจริงบน `sample-10s`:** แก้เฉพาะหัวข้อซีนที่ 2 → ซีนที่ 1 ใช้ cache เดิม 100% (`cacheHits=150`, `renderedCount=150`, เวลาเรนเดอร์ลดจาก `31.66s` เหลือ `15.69s`) พร้อม Gate 4 SSIM Parity ผ่านทั้ง 2 ซีน (`0.9840` / `0.9819`)
3. **Gate 4 Motion Probe:**
   - สร้าง `gate4_motion_probe.mp4` (2.0s / 60 frames ช่วง transition) สำหรับตรวจการเคลื่อนไหวก่อน render เต็ม
4. **TTS Adapter (`core/audio/tts_adapter.py`):**
   - รองรับ `edge-tts` ไทย Multi-speaker พร้อม `--check` และ fallback กลับ `audio-in` อย่างปลอดภัย
5. **Automated Test Suite (`npm test`):**
   - `tests/phase1.test.mjs` ผ่าน 4/4 tests

## คำสั่งตรวจสอบทั้งหมด

```bash
npm install
npm run validate:schemas
npm run doctor
npm test
npm run smoke
npm run pilot:10s
```

## Next action (Phase 2A)

พัฒนาสไตล์แรก **`wonlok-plus`** (5 Layers + 1 Global Brand Overlay: Base Stylized/Natural Earth Map + Vector Highlight Mask + Neon Pulse/Routes + 2-Line Thai Headline + Phrase/Word-Highlight Subtitles + Brand Badge) ในขอบเขต 30–60s และพิสูจน์ให้ผ่านอย่างน้อย 3 คลิปต่างหัวข้อ พร้อม Philip review
