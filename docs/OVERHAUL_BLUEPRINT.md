# GenhaLipza — Clean-Room Overhaul & 33-Style Architecture Blueprint

> อัปเดต: 15 พฤศจิกายน 2026 (Asia/Bangkok)
> เอกสารพิมพ์เขียวสำหรับยกเครื่องภาพและเสียงของ `genhalipza` ให้ทัดเทียมหรือเหนือกว่ามาตรฐานช่องจริง โดยยึดกติกา **Clean-Room 100%** และผสานของดีจาก `liplnwza-motion-kit` (แนวคิดระบบเสียง/ซับ/ลิปซิงค์) + `motionforge` (ฟิสิกส์/แสงเงา/Visual Polish)

---

## 1. ข้อตกลงการออกแบบที่ล็อกร่วมกัน (Locked Decisions)

1. **Public Repo Clean-Room 100%:** ไม่นำไฟล์ โค้ด หรือเทมเพลตของชุดสกิลภายนอก (`GenhahaSkills`) และไม่นำไฟล์ภาพมาสคอต/เสียงส่วนตัวของ Philip อัปโหลดลง `liplnwza548/genhalipza`
2. **ตัวละครมาสคอตแบบ Dual-Mode:**
   - **Built-in Clean-Room Rig:** วาดตัวละคร SVG/Canvas แบบมีมิติ (ทรงผม, เสื้อฮู้ด, แสงเงา, กระพริบตา, ปากขยับต่อเนื่อง 6 Visemes, 6 ท่าทาง) เพื่อใช้เป็นตัวเริ่มต้นที่ดูดีทันที
   - **Private Character Plug-in:** ช่องเสียบภาพ PNG 6 ท่า + ปาก/Clean-Plate จากโฟลเดอร์ส่วนตัวภายนอก (`privateAssetsDir` / `GENHALIPZA_PRIVATE_ASSETS`)
3. **ระบบซับไตเติลหลากหลายตามอารมณ์คลิป (4 Subtitle Presets + Kanit/Prompt/Noto Sans Thai):**
   - `pop-chips`: เม็ดสีเด้งเข้าจังหวะ (`0.6x -> 1.08x -> 1.0x`, เอียงสลับ ±2°)
   - `bold-karaoke`: ตัวอักษรขาวขอบดำหนา ไฮไลต์คำที่กำลังพูดด้วยสีทอง/สีเน้น
   - `clean-pill`: แถบแคปซูลโปร่งแสงอ่านง่ายพร้อมไฮไลต์คำ
   - `cinema-minimal`: ซับสารคดี/สืบสวนเรียบคม
4. **ระบบเสียงจริง + เอฟเฟกต์เสียง (Real Audio Pipeline):**
   - รองรับคู่กันระหว่าง **Edge-TTS ไทย (ฟรี: `th-TH-NiwatNeural`, `th-TH-PremwadeeNeural`)** และ **Audio-In (ไฟล์เสียงพากย์จริง)**
   - มีตัวสังเคราะห์/มิกซ์ **SFX (`whoosh`, `pop`, `boom`, `ding`) + BGM** พร้อมระบบ 2-pass Loudnorm (`-16 LUFS`, `True Peak <= -1.0 dBTP`)
5. **แหล่งภาพประกอบ & แผนที่:** วาดโค้ด SVG/Canvas คุณภาพสูงเป็นแกนหลัก (รันออฟไลน์ได้) + เปิดช่องเสียบภาพประกอบ (AI Image / ภาพส่วนตัว) และแผนที่ความละเอียดสูง/ดาวเทียมสาธารณะที่ระบุที่มาถูกต้องได้
6. **สัดส่วนเริ่มต้น:** โฟกัส `9:16` (`1080×1920`, 30fps) ให้สวยคมระดับ Production ก่อนขยายสู่ `16:9`, `1:1`, `4:5`

---

## 2. โครงสร้าง 5 แกนหลัก + 1 ชั้นเอฟเฟกต์ร่วม (ครอบคลุม 33 แนวคลิป)

แทนการเขียนสกิลแยก 33 ชุดแบบกระจัดกระจาย GenhaLipza รวมศูนย์เป็น **5 Core Archetype Engines + 1 Shared MotionForge Polish Layer**:

| แกนหลัก (Core Engine) | จุดเด่นของระบบภาพ & การเคลื่อนไหว | แนวคลิปในคลัง 33 แบบที่รองรับ |
| :--- | :--- | :--- |
| **1. Geo & 3D World** | แผนที่เวกเตอร์ละเอียด/ภาพดาวเทียมสาธารณะ + กล้องแพน-ซูมตามจุดเคลื่อนที่ + เส้นทางเรืองแสง + ระบบกันป้ายชื่อชนกัน (`Label Collision Solver`) + เมืองจำลอง 3D (Three.js/Canvas) | `wonlok-plus`, แผนที่เส้นทาง, เส้นทาง 3D, แผนที่เล่าเรื่อง, คลิปภาคสนาม |
| **2. Presenter & Card Stage** | เวที 3 โซน (ภาพ/ไดอะแกรมด้านบน + ซับกลาง/ล่าง + พิธีกร/มาสคอต) + มาสคอต 6 ท่าปากขยับต่อเนื่อง + กล่องมือถือ/การ์ด/ตัวนับเด้ง + สวิตช์ธีมกระดาษครีม/สว่าง/เข้ม | `liplnwza-mascot` (AoT & Modern), พิธีกรอธิบาย, สติกเกอร์, กระดาษตัด, บทเรียน, พอดแคสต์ |
| **3. Acting Character Duo** | ตัวละครเต็มตัวมีทรงผม/เสื้อผ้า/พร็อพ/สีหน้า 10 อารมณ์ + ฉากหลังสลับได้ + กล้องซูมแพนเข้าหาผู้พูด + ซับขอบดำหนาใต้เท้า | `stickman-duo` โฉมใหม่, ลายเส้นหมึก, การ์ตูน Rubberhose, หนังตะลุง |
| **4. Cinema Story Stage** | ฉากสภาพแวดล้อมเต็มจอแบ่งมิติหน้า-กลาง-หลัง (Parallax) + แสง/เงา/หมอก/ไฟฉาย/แสงเทียน + แคปซูลป้ายชื่อมีมิติ | `mystery-stage` โฉมใหม่, สืบสวนวิทยาศาสตร์, เรื่องสยองขวัญ, เรื่องหักมุม |
| **5. Editorial & Data Motion** | คอลลาจกระดาษ/หนังสือพิมพ์ + ปากกาไฮไลต์ขีดเขียน + กราฟข้อมูลเคลื่อนไหว + การ์ดคำเด้ง | Vox Collage, Kinetic Cards, กราฟการเงิน/เทรด, Telestrator, Brand Promo |
| **+ Shared MotionForge Polish** | พอร์ตจาก `motionforge`: Subsurface Glow, Chromatic Bloom, Motion Blur ตามความเร็ว, Film/Paper Grain แบบ Deterministic + Surface Style Filters | สวมทับทุกแกนได้: Chalkboard, Sketchbook, Pen Plotter, Pixelworld, ASCII 3D, Risograph, Woodcut, Ukiyo-e, Stop Motion |

---

## 3. แผนลงมือ Overhaul รอบที่ 1 (Sprint 1: ยกเครื่อง 2 สไตล์เรือธง + ระบบเสียงจริง)

### Milestone 1.1: Shared Craft Foundations (`Polish`, `Fonts`, `Subtitles`, `Real Audio`)
- **ฟอนต์ไทยครบชุด:** เพิ่ม `Kanit-Bold.ttf`, `Kanit-ExtraBold.ttf`, `Kanit-SemiBold.ttf` (OFL) คู่กับ `Prompt` และ `Noto Sans Thai`
- **4 Subtitle Renderers (`core/engine/subtitles.mjs`):** `pop-chips` (สปริง 0.13s + สีสลับ/ตามบทบาทคำ), `bold-karaoke`, `clean-pill`, `cinema-minimal` + ตรวจระยะห่างจากขอบจอและตัวละครอัตโนมัติ
- **MotionForge Polish (`core/engine/polish.mjs`):** พอร์ต Film/Paper Grain แบบ Deterministic (`mulberry32` + frame seed), Bloom/Glow, Motion Blur/Trail, Vignette
- **Real Voice & Mix Engine (`core/audio/`):**
  - เปิดใช้งาน `edge-tts` ไทย (ชาย/หญิง) พร้อมสร้าง Word/Syllable Timings จากเสียงจริง (และรองรับ Audio-In 100%)
  - เพิ่มตัวสร้าง SFX สังเคราะห์คุณภาพสะอาด (`whoosh`, `pop`, `ding`, `boom`) + Ambient/BGM bed ที่ duck อัตโนมัติใต้เสียงพูด -> จบที่ `-16 LUFS`

### Milestone 1.2: Overhaul `liplnwza-mascot` โฉมใหม่
- ยกระดับตัวละคร Built-in SVG/Canvas Rig ให้ดูเป็นตัวละครมีเสน่ห์ (สัดส่วน, ทรงผม, เสื้อฮู้ด, แสงเงา, แขนขยับธรรมชาติ 6 ท่า, ปากขยับเนียน 6 รูปปาก) + รองรับ Plug-in PNG ส่วนตัว
- รองรับ **2 โหมดหน้าตา** ในสไตล์เดียว:
  - *AoT Paper Mode* (พื้นครีม `#FFF6E8` ลายจุด + กรอบภาพบนมีแถบหัวเรื่อง + ซับเม็ดสีเด้ง `pop-chips` + มาสคอตล่าง)
  - *Studio Dark Mode* (พื้นหลังลึกมีเกรน + การ์ด/ไดอะแกรมมีมิติ + ซับ `bold-karaoke` หรือ `clean-pill`)
- แผงภาพด้านบนรองรับ: ภาพประกอบจากโค้ด/ไฟล์ภาพส่วนตัว, กล่องข้อความพิมพ์ดีด, กล่องเปรียบเทียบ, ตัวเลขใหญ่เด้ง
- **เกณฑ์ตรวจรับ:** เรนเดอร์คลิปทดสอบ 15–20 วิด้วยเสียงพูดไทยจริง + SFX/BGM -> เปิดดูเฟรมจริงทุกจุดสำคัญ + ผ่าน QC 100%

### Milestone 1.3: Overhaul `wonlok-plus` แผนที่โฉมใหม่
- ยกระดับแผนที่ฐาน: เติมพื้นผิวมหาสมุทร/ภูมิประเทศ/เส้นกริด/แสงเงาชายฝั่ง และรองรับ **Satellite Tile / High-res GeoJSON** แบบระบุที่มาถูกต้อง
- **ระบบกันป้ายชื่อชนกัน (Smart Label Placement):** คำนวณ Bounding Box ของหมุด ป้ายเมือง ป้ายระยะทาง และการ์ดเปรียบเทียบไม่ให้ทับซ้อนกันเด็ดขาด (แก้ปัญหา `ชุมพร`/`ระนอง` และ `แหลมกู๊ดโฮป` ที่เคยชนในรอบก่อน)
- กล้องแพน/ซูมตามหัวลูกศรที่วิ่งบนเส้นทางเรืองแสง + ตัวนับระยะทาง/เวลาแบบเรียลไทม์ (`ราว ... กม.`) + ซับ `bold-karaoke` หรือ `clean-pill`
- **เกณฑ์ตรวจรับ:** รันทดสอบคลิปแผนที่ 20–30 วิด้วยเสียงพูดไทยจริง + SFX -> ตรวจเฟรมทุกช่วงเปลี่ยนซีน ป้ายไม่ชน ตัวอักษรไทยคมชัด ผ่าน QC 100%

---

## 4. ขั้นตอนถัดไปหลัง Sprint 1 ผ่านตา Philip
1. **Sprint 2:** ยกเครื่อง **`stickman-duo`** (Acting Character Duo) + **`mystery-stage`** (Cinema Story Stage)
2. **Sprint 3:** เพิ่ม **Editorial & Data Motion** + ตัวกรองพื้นผิวจาก MotionForge (ขยายจาก 5 แกนสู่ 33+ สไตล์ พร้อม `16:9 / 1:1 / 4:5`)
3. **Sprint 4:** ตัว Export สกิลหลายแพลตฟอร์ม (`Antigravity`, `OpenAI Codex .codex-plugin`, `Claude Code`)
