# คู่มือส่งต่อให้ ChatGPT ช่วยรีวิวแผน (`genhalipza`)

> คุณสามารถส่งลิงก์ Repo `https://github.com/liplnwza548/genhalipza` พร้อมคัดลอก Prompt ด้านล่างไปให้ ChatGPT ช่วยตรวจสอบและวิจารณ์แผนได้อย่างตรงจุดครับ

---

## 📋 Prompt สำหรับก๊อปปี้ไปถาม ChatGPT

```text
ช่วยอ่านแผนโปรเจกต์ใน GitHub repo https://github.com/liplnwza548/genhalipza
(ดู README.md และ docs/MASTER_PLAN.md) แล้วช่วยรีวิวเชิงวิศวกรรมและการใช้งานจริงให้หน่อย:

บริบทของฉัน:
- ฉันมี repo เก่า 2 ตัวคือ liplnwza548/liplnwza-motion-kit และ liplnwza548/motionforge
- ฉันต้องการสร้างระบบใหม่ที่ใช้งานได้จริง 100% (ไม่ค้างที่ 60-70% เหมือนตอนทำแนว Wonlok)
- เน้นรันบน Cloud Agent VMs เป็นหลัก (Gemini / ChatGPT / Antigravity) และสลับมารันบนคอมได้ถ้าต้องการความเร็ว
- อยากได้ระบบตรวจงาน 5 ด่าน (Brief/Facts -> Script/Voice -> Layout Sketch -> Visual Storyboard -> Final MP4)
- ต้องการปั้น 4 สไตล์แรกให้จบสวย 100% ก่อนขยายไป 33 + 100+ สไตล์

ช่วยตอบ 5 ข้อนี้แบบตรงไปตรงมา:
1. สถาปัตยกรรม Node.js (Canvas/SVG/Chromium) + Python (Audio/Visemes/LUFS QC) มีจุดไหนที่ซับซ้อนเกินจำเป็นสำหรับ Cloud VM ไหม และควรลดความซับซ้อนตรงไหน?
2. สำหรับ Gate 3 (Layout Sketch) และ Gate 4 (Visual Storyboard) ควรออกแบบทางเทคนิคยังไงให้เรนเดอร์เสร็จภายใน 5-15 วินาที และสะท้อนภาพจริงที่จะได้ใน MP4?
3. มีจุดเสี่ยงอะไรบ้างในการทำสไตล์ wonlok-plus ให้ได้คุณภาพ 100% แบบอัตโนมัติ (เช่น การดึง/สร้างภาพแผนที่, เส้นแสง, การตัดคำไทย)?
4. มีคำแนะนำอะไรเพิ่มเติมเกี่ยวกับ Schema ของ 100+ Style Factory เพื่อไม่ให้โค้ดบานปลายเมื่อสไตล์เพิ่มขึ้น?
5. แผน Phase 0 -> Phase 4 ควรปรับลำดับหรือลด/เพิ่มอะไรก่อนลงมือเขียนโค้ด Phase 0?
```

---

## ✅ ประเด็นสำคัญที่อยากให้ผู้รีวิวช่วยเช็กเป็นพิเศษ

1. **ความเร็วบน Cloud VM (Headless Chromium vs Parallel Workers):**
   - คลิป 60 วินาที @ 30fps = 1,800 เฟรม หากยิงผ่าน CDP ทีละเฟรมบน Cloud VM อาจใช้เวลาหลายนาที → ควรวางระบบ Multi-tab / Worker Pool หรือรองรับ 24–25fps เป็นตัวเลือกหรือไม่?
2. **การสร้าง Audio Alignment เมื่อผู้ใช้ส่งเสียงพากย์เอง:**
   - ใน `liplnwza-motion-kit` เดิมใช้ `mfa_to_cues.py` / `prepare_cues.py` — บน Cloud VM ควรพึ่ง Whisper / Faster-Whisper (ขนาดเล็ก) หรือ Forced Aligner ตัวไหนที่เบาและแม่นภาษาไทย?
3. **การแยก State ของงาน 5 ด่าน (`jobs/<slug>/`):**
   - ควรมีไฟล์สถานะ (เช่น `pipeline_state.json` + `approval.json`) เพื่อให้หยุดที่ Gate 3 หรือ Gate 4 แล้วกลับมาสั่งแก้เฉพาะซีนที่ 3 ได้โดยไม่ต้องเรนเดอร์ใหม่ทั้งคลิป
4. **การจัดการ Maps/Satellite Assets สำหรับ `wonlok-plus`:**
   - หากไม่พึ่ง API เสียเงิน หรือหลีกเลี่ยงปัญหา Rate limit / Terms of Service ของภาพดาวเทียม จะใช้วิธี Vector GeoJSON + Procedural Terrain/Satellite Style Canvas หรือ Open Data (OSM/Natural Earth) อย่างไรให้สวยระดับ Wonlok?
