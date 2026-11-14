# GenhaLipza — สถานะสำหรับรับช่วง

อัปเดต: 15 พฤศจิกายน 2026 (Asia/Bangkok)

## สถานะปัจจุบัน

**Phase 2A (`wonlok-plus`) Automated Verification Passed (3/3 Topics @ 30s) — Ready for Owner Review & Phase 2B**

### สิ่งที่สร้างและพิสูจน์ผลแล้วใน Phase 2A (`wonlok-plus`)
1. **Natural Earth GeoJSON Vector Engine (`assets/maps/ne_110m_countries.geojson` + `core/engine/html-template.mjs`):**
   - Web Mercator projection + dateline-safe routing, Country Highlight Mask (`ADM0_A3`/`ISO_A3`), Smooth Camera Keyframes (`camFrom` → `camTo`), Neon Routes & Pulse Markers, Compare Cards, 2-Line Thai Headline, Word-Highlight Subtitles, และ Persistent Brand Badge
   - Style Manifest: [`styles/mvp-4/wonlok-plus/manifest.json`](styles/mvp-4/wonlok-plus/manifest.json) (recipes: `locate`, `trace-route`, `compare`)
2. **ผลทดสอบ 3 คลิปต่างหัวข้อ (30s / 900 frames / 1080×1920 / 30fps):**
   - **`wonlok-thai-hsr`** (ไทย: รถไฟความเร็วสูง กรุงเทพฯ–นครราชสีมา): Automated QC `passed: true`, `-15.99 LUFS`, `TP -10.17 dBTP`, SSIM `0.9808 / 0.9838 / 0.9830`
   - **`wonlok-suez-route`** (โลก: คลองสุเอซ–รอตเทอร์ดัม vs แหลมกู๊ดโฮป): Automated QC `passed: true`, `-15.99 LUFS`, `TP -10.17 dBTP`, SSIM `0.9740 / 0.9756 / 0.9764`
   - **`wonlok-kra-canal`** (ภูมิภาค: ช่องแคบมะละกา & Landbridge ระนอง–ชุมพร): Automated QC `passed: true`, `-15.99 LUFS`, `TP -10.17 dBTP`, SSIM `0.9793 / 0.9821 / 0.9805`

## คำสั่งรันซ้ำ (3 หัวข้อ `wonlok-plus`)

```bash
node core/cli/pipeline.mjs run --job assets/fixtures/wonlok-3-topics/thai-hsr/job.json
node core/cli/pipeline.mjs run --job assets/fixtures/wonlok-3-topics/suez-route/job.json
node core/cli/pipeline.mjs run --job assets/fixtures/wonlok-3-topics/kra-canal/job.json
```

## Next action (Phase 2B)

1. ให้ Philip ตรวจรับภาพ/เสียงจริงของ 3 คลิป `wonlok-plus` ใน `jobs/wonlok-*/`
2. เริ่ม **Phase 2B** เพิ่มอีก 3 สไตล์ทีละตัว:
   - `liplnwza-mascot` (ต่อยอดมาสคอต 6 ท่าจาก private asset path + placeholder fixture ใน public repo)
   - `stickman-duo` (Parametric SVG 2 ตัวคุยโต้ตอบ)
   - `mystery-stage` (หมอก, ไฟฉาย, แสงเทียน, กระดานสืบสวน)
