# GenhaLipza — สถานะสำหรับรับช่วง

อัปเดต: 15 พฤศจิกายน 2026 (Asia/Bangkok)

## สถานะปัจจุบัน

**Phase 0A Completed & Verified on Linux Cloud VM — Ready for Phase 0B (10s Vertical Slice)**

1. ปรับ [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md) เป็น **Revised v2** ตามผลรีวิวใน [`docs/CHATGPT_REVIEW_2026-11-15.md`](docs/CHATGPT_REVIEW_2026-11-15.md) แล้ว
2. วางโครงสร้างพื้นฐาน, Asset Policy (`schemas/ASSET_POLICY.md`), และ JSON Schemas ทั้ง 5 ตัว (`job`, `timeline`, `pipeline_state`, `approvals`, `style.manifest`) ครบถ้วน พร้อมตรวจ compile ผ่าน Ajv
3. ดาวน์โหลดฟอนต์ไทยลิขสิทธิ์ OFL (`Prompt-Regular.ttf`, `Prompt-Bold.ttf`, `NotoSansThai.ttf`) เข้า `assets/fonts/` พร้อมไฟล์ใบอนุญาต (เนื่องจาก VM ไม่มีฟอนต์ไทยติดตั้งใน OS)
4. รัน `npm run doctor` ผ่าน **7/7 checks** และรัน `npm run smoke` ผ่านจริงบน Debian 12 Cloud VM:
   - Headless Chromium (`/usr/bin/chromium`) โหลดฟอนต์ไทยผ่าน Data URI (`promptLoaded: true`, `notoLoaded: true`) และเรนเดอร์เฟรม `1080×1920` ใน `~1.0s`
   - ตรวจภาพ `smoke_frame.png` แล้ว สระบน/สระล่าง/วรรณยุกต์ไทยคมชัดไม่ขาด
   - FFmpeg mux + 2-pass loudnorm ออก `smoke_test.mp4` (`H.264 / AAC 48kHz / 30fps / 60 frames`, `measuredLufs: -16.05`, `measuredTruePeakDbtp: -12.24`, `decodeErrors: ""`)

## คำสั่งตรวจสอบที่รันได้ทันทีหลัง Clean Checkout

```bash
npm install
npm run validate:schemas
npm run doctor
npm run smoke
```

## Next action (Phase 0B)

สร้าง **10-Second Vertical Slice (`9:16`, `30fps`, `300 frames`)** สไตล์แผนที่เวกเตอร์ 1–2 ซีน ด้วย **Audio-In + Cues ที่ตรวจแล้ว + Phrase Captions ภาษาไทย** ให้ผ่านครบ Gate 1 → Gate 5 พร้อม Automated QC และการตรวจรับภาพ/เสียงจริงจาก Philip
