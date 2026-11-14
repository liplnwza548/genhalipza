# GenhaLipza — สถานะสำหรับรับช่วง

อัปเดต: 15 พฤศจิกายน 2026 (Asia/Bangkok)

## สถานะปัจจุบัน

**Phase 2 Complete (MVP 4 Styles Verified End-to-End) — Ready for Phase 3 (Style Factory & Multi-Aspect)**

### สรุปผลการพัฒนาและตรวจรับจริงทั้ง 4 สไตล์ใน MVP

1. **`wonlok-plus` (Phase 2A):**
   - Natural Earth GeoJSON Web Mercator map + Country Highlight Mask + Neon Geo Routes + Compare Cards + Word-Highlight Captions + Brand Badge
   - ผ่าน Automated QC ครบทั้ง **3 หัวข้อ (30s / 900 frames / 1080×1920)**: `wonlok-thai-hsr`, `wonlok-suez-route`, `wonlok-kra-canal`
2. **`liplnwza-mascot` (Phase 2B):**
   - 3-Zone Paper-Cutout Card Stage + Clean-Room Vector Mascot Placeholder (6 poses + 6 visemes + blink) + รองรับ Private Owner PNG Overlay ผ่าน `privateAssetsDir` / `GENHALIPZA_PRIVATE_ASSETS` (แยกสิทธิ์ไฟล์จริงออกจาก public repo)
   - Clean-Room Thai Vowel-to-Viseme Estimator (`core/audio/thai_visemes.mjs`)
   - ผ่าน Automated QC (`mvp-mascot-15s`, 450 frames): `-15.93 LUFS`, `TP -10.13 dBTP`, SSIM `0.9880 / 0.9874 / 0.9892`
3. **`stickman-duo` (Phase 2B):**
   - Parametric 2-Speaker Stickman Rig (`core/rig/stickman-rig.mjs`) + Active Speaker Spotlight + Gesture/Expression + Multi-speaker Tone Fixture
   - ผ่าน Automated QC (`mvp-stickman-15s`, 450 frames): `-16.04 LUFS`, `TP -11.66 dBTP`, SSIM `0.9892 / 0.9895 / 0.9879`
4. **`mystery-stage` (Phase 2B):**
   - Procedural Canvas Atmosphere (`core/atmosphere/mystery-fx.mjs`: Fog, Flickering Candle, Flashlight Sweep, Vignette) + Polaroid Evidence Board + Animated Red Thread + Procedural Dark Ambient SFX (`core/audio/audio_prep.mjs`)
   - ผ่าน Automated QC (`mvp-mystery-15s`, 450 frames): `-16.01 LUFS`, `TP -5.31 dBTP`, SSIM `0.9720 / 0.9732 / 0.9718`

## คำสั่งทดสอบและรัน MVP ทั้ง 4 สไตล์

```bash
npm run validate:schemas
npm run doctor
npm test
node core/cli/pipeline.mjs run --job assets/fixtures/wonlok-3-topics/thai-hsr/job.json
node core/cli/pipeline.mjs run --job assets/fixtures/mvp-mascot/job.json
node core/cli/pipeline.mjs run --job assets/fixtures/mvp-stickman/job.json
node core/cli/pipeline.mjs run --job assets/fixtures/mvp-mystery/job.json
```

## Next action (Phase 3 & Phase 4)

- **Phase 3 (Style Factory & Multi-Aspect):** สร้าง Style Token/Archetype Composer สำหรับขยายคลัง Core 33 & Storytelling Presets + รองรับ Multi-Aspect (`16:9`, `1:1`, `4:5`) และเพิ่มระบบ Benchmark (Cold vs Warm)
- **Phase 4 (Multi-Platform Skill Exporter):** สร้าง `lipza export` สำหรับ Antigravity/Gemini, OpenAI Codex (`.codex-plugin`), และ Claude Code
