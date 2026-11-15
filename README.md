# GenhaLipza (`genhalipza`)

> **Clean-Room Video Skill Studio & AI Director Pipeline**
> ระบบผลิตวิดีโอเล่าเรื่องและโมชั่นกราฟิกด้วยโค้ด 100% (ภาษาไทยเป็นหลัก, รองรับ Cloud VM + PC, ส่งออกเป็น AI Agent Skills ได้หลายแพลตฟอร์ม)

---

## 🎯 เป้าหมายของโปรเจกต์นี้

`genhalipza` สร้างขึ้นเพื่อรวมจุดแข็งจากงานเดิมของคุณทั้งหมดเข้าเป็นโรงงานผลิตคลิปเดียวที่ใช้งานจริงได้ 100% (ไม่ค้างอยู่ที่ 60–70%) และขยายต่อสู่คลังสไตล์ระดับ 33+100 แบบ:

1. **รวมร่างของดีจาก 2 Repo เดิมของคุณเอง:**
   - จาก [`liplnwza-motion-kit`](https://github.com/liplnwza548/liplnwza-motion-kit): ระบบเสียง/ลิปซิงค์ (`assemble_voice`, `mfa_to_cues`, `dedup_visemes`), มาสคอต **LiplnwZa** (6 ท่าทาง + 6 รูปปาก), การจัดสระภาษาไทย, `themes/theme.schema.json`, และ `post_render_gate.py` (2-pass loudnorm `-16 LUFS` / `TP <= -1.0 dBTP`)
   - จาก [`motionforge`](https://github.com/liplnwza548/motionforge): สูตรฟิสิกส์/การเคลื่อนไหว (`Spine Kinematics`, `Gerstner Waves`, `Particle Engine`), เทคนิค Visual Polish, และแนวทาง Render แบบ Frame-by-Frame ด้วย HTML5 Canvas + Chromium + FFmpeg
2. **กติกา Clean-Room & Public Repo Safe 100%:**
   - Repo นี้เป็น **Public** จึงเก็บเฉพาะโค้ด, สเปก, แม่พิมพ์ และสไตล์ที่เราออกแบบและเขียนขึ้นใหม่เองทั้งหมด (ไม่นำไฟล์, โค้ด, หรือเทมเพลตของสกิลที่มีลิขสิทธิ์ภายนอกมาอัปโหลดลง Repo นี้)
3. **เวิร์กโฟลว์กำกับงาน 5 ด่าน (5-Gate AI Director):**
   - รองรับทั้งกรณีที่ผู้ใช้ส่ง **หัวข้ออย่างเดียว** หรือส่ง **ไฟล์เสียงพากย์ของตัวเอง** เข้ามา
   - **ค้นข้อมูล & เขียนบท → ส่งเสียงพากย์เช็ก → วาดภาพสเก็ตช์โครงร่าง → สร้างสตอรี่บอร์ดภาพสีจริง → สั่งเรนเดอร์ MP4 + QC อัตโนมัติ**
4. **ชุดเปิด (MVP 4 สไตล์แรก) ก่อนขยายสู่ 33 Core + 100+ Storytelling Styles:**
   - `wonlok-plus` — สไตล์แนววนโลก (แผนที่/ดาวเทียม + เส้นแสงนีออน + พาดหัวเด่น + ซับไฮไลต์) ปิดช่องว่างให้ได้ 100%
   - `liplnwza-mascot` — มาสคอต LiplnwZa 6 ท่าปากขยับ + ฉากกระดาษตัด/การ์ดขยับ (ต่อยอดจาก AoT Layout)
   - `stickman-duo` — ตัวละครลายเส้นคุยโต้ตอบ (รองรับหลายเสียงพากย์)
   - `mystery-stage` — เล่าเรื่องลึกลับ/สืบสวน/สยองขวัญ (กระดานสืบสวน, ไฟฉาย, แสงเทียน, หมอก)

---

## 📚 เอกสารแผนงานใน Repo นี้

- **[`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md)** — แผนแม่บทฉบับสมบูรณ์ (สถาปัตยกรรม, การดึงโมดูลเก่ามาใช้จริง, เวิร์กโฟลว์ 5 ด่าน, Cloud VM + PC Setup, MVP 4 สไตล์ และแผนขยาย 33 + 100+ สไตล์)
- **[`docs/REVIEW_GUIDE_FOR_CHATGPT.md`](docs/REVIEW_GUIDE_FOR_CHATGPT.md)** — คู่มือและชุดคำถามสำหรับส่งให้ ChatGPT ช่วยรีวิวและจับจุดเสี่ยงของแผนนี้
- **[`docs/CHATGPT_REVIEW_2026-11-15.md`](docs/CHATGPT_REVIEW_2026-11-15.md)** — ผลรีวิวเชิงวิศวกรรมจากแผนและโค้ดต้นทาง: ตอบครบ 5 ข้อ พร้อมความเสี่ยง เกณฑ์ตรวจรับ และลำดับพัฒนาที่เสนอ
- **[`docs/OVERHAUL_BLUEPRINT.md`](docs/OVERHAUL_BLUEPRINT.md)** — พิมพ์เขียวการยกเครื่องภาพและเสียง (Sprint 1–4) แบบ Clean-Room 100%
- **[`docs/PRIVATE_ASSETS.md`](docs/PRIVATE_ASSETS.md)** — วิธีวางไฟล์ส่วนตัวของ Philip (เสียงโคลน + ภาพมาสคอตตัวจริง) ที่ห้ามขึ้น repo สาธารณะ
- **[`STATUS.md`](STATUS.md)** — สรุปสถานะ ข้อค้นพบ เกณฑ์ตรวจรับ และลำดับงานสำหรับรับช่วง

---

## 🚦 สถานะปัจจุบัน (อัปเดต 15 พ.ย. 2026)

- **Phase:** `Sprint 1 Complete` — ผ่าน Phase 0A → 0B → 1 → 2A → 2B แล้ว MVP 4 สไตล์ (`wonlok-plus`, `liplnwza-mascot`, `stickman-duo`, `mystery-stage`) ตรวจ QC ผ่าน; Sprint 1 ยกระดับ `liplnwza-mascot` + `wonlok-plus` (เสียงไทย + SFX/BGM + ซับ 4 แบบ + Visual Polish) ดูรายละเอียดใน [`STATUS.md`](STATUS.md)
- **งานที่ค้าง:** แก้ 4 อย่างให้ตรงคำตัดสินของ Philip (branch `fix/locked-decisions`, ยังไม่ได้ push) — เสียงโคลนผ่าน Audio-In, มาสคอตตัวจริง, ฟอนต์หลัก Prompt, และ README ฉบับนี้

### 🔒 คำตัดสินที่ล็อกไว้ (Philip, 15 พ.ย. 2026 — ห้ามเปลี่ยนถ้า Philip ไม่ได้สั่ง)

1. **เสียงพากย์ = เสียงของ Philip เอง** (เสียงโคลน VoxCPM2 สร้างบน Colab) ผ่าน Audio-In เท่านั้น — ห้ามใช้เสียงฟรี edge-tts/gTTS เป็นเสียงของคลิป (ใช้ได้แค่ตอนทดสอบ) — ElevenLabs ยังไม่ตัดสินใจ ห้ามสมัคร/ติดตั้ง
2. **มาสคอต = ตัวจริงของ Philip** (ภาพต้นแบบ master lock) ผ่านโฟลเดอร์ส่วนตัว `private_assets/` เท่านั้น ห้ามอัปโหลดภาพตัวจริงลง repo สาธารณะ — ตัวที่วาดจากโค้ดเป็นแค่ตัวสำรองตอนทดสอบ
3. **สไตล์ wonlok เก็บไว้** — ที่ปิดไปคือโปรเจกต์ก๊อปคลิปวนโลกแบบเหมือนเป๊ะๆ ไม่ใช่สไตล์แผนที่ (ห้ามใช้ภาพ/เสียง/โลโก้ของวนโลก ห้ามวาดเส้นแบ่งประเทศที่ไม่มีจริง ห้ามแต่งข้อมูลแม่น้ำเอง)
4. **ตัวหนังสือซับ = Prompt เป็นหลัก** (Kanit เป็นตัวเลือกเสริมได้)
5. **เพลงพื้นหลัง (BGM) กับเสียงเอฟเฟกต์ (SFX) ใส่ได้**
- **Target Execution Environment:** Cloud Agent VMs (Antigravity / Gemini Task / ChatGPT Work) + Local Windows/Mac fallback
