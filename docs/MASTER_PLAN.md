# GenhaLipza — Master Plan & Architecture Roadmap

> เอกสารฉบับนี้รวบรวมผลการออกแบบระบบทั้งหมดจากการสัมภาษณ์และตรวจโค้ดเดิมใน `liplnwza-motion-kit` และ `motionforge` เพื่อใช้รีวิวและเริ่มลงมือพัฒนา `genhalipza` อย่างเป็นระบบ

---

## 1. เป้าหมายและหลักการสำคัญ (Core Principles)

| หัวข้อ | ข้อกำหนดที่ล็อกไว้ | เหตุผล |
| :--- | :--- | :--- |
| **Repo & ลิขสิทธิ์** | Clean-Room 100% บน `liplnwza548/genhalipza` (Public) | สามารถใช้เอง เผยแพร่ หรือต่อยอดเป็นสินค้าได้โดยไม่ติดลิขสิทธิ์โค้ด/เทมเพลตภายนอก (33 สกิลอ้างอิงเดิมเก็บแยกส่วนตัวนอก Repo นี้) |
| **เครื่องที่รันหลัก** | **Cloud VM First** (Gemini Task / ChatGPT Work / Antigravity VM) + รันบน Windows/Mac ได้ | สั่งงานจากที่ไหนก็ได้โดยไม่ติด path เฉพาะเครื่อง (แก้ปัญหา path ล็อกเครื่องเดิมใน `motionforge`) |
| **ตัวละครหลัก (Mascot)** | ใช้ **มาสคอต LiplnwZa เดิม** (6 ท่าทาง + 6 รูปปาก) เป็นสไตล์เรือธงประจำช่อง + เพิ่ม **Parametric SVG Rig** สำหรับสไตล์เล่าเรื่องใหม่ | ได้เอกลักษณ์ช่องเดิมทันที และมี Rig ใหม่ที่เปลี่ยนทรงผม/ชุด/ท่าทางได้เป็นร้อยแบบสำหรับสไตล์อื่น |
| **ภาษาและสัดส่วน** | **ภาษาไทย 100%** + **Multi-Aspect** (`9:16`, `16:9`, `1:1`, `4:5`) | จัดตัดคำไทยไม่ฉีกกลางคำ กันสระ/วรรณยุกต์ขาด และใช้สคริปต์เดียวออกได้ทั้ง TikTok/Reels และ YouTube |
| **AI Agent Target** | แกนกลางเดียว → Export เป็นสกิลได้หลายแพลตฟอร์ม (Antigravity/Gemini, OpenAI Codex, Claude Code) | สร้างและแก้ที่เดียว แต่ส่งออกไปใช้งานได้ทุก Agent |

---

## 2. การนำของดีจาก 2 Repo เก่ามาใช้จริง (Reuse Audit)

จากการตรวจโค้ดใน Repo เดิมทั้งสองตัว พบโมดูลที่นำมาประกอบเข้ากับ `genhalipza` ได้ทันทีประมาณ **65–70%**:

### 2.1 จาก `liplnwza548/liplnwza-motion-kit` (v0.2.1 · MIT)
- **ระบบเสียงและ Lip-sync:**
  - `renderer/assemble_voice.py` — ประกอบไฟล์เสียงพากย์เป็นท่อนๆ
  - `renderer/prepare_cues.py`, `renderer/mfa_to_cues.py`, `renderer/dedup_visemes.py` — ถอดจังหวะคำ (`words.json`) และรูปปาก (`visemes.json`) สำหรับมาสคอต
  - `renderer/audio_mix.py` & `renderer/post_render_gate.py` — 2-pass loudnorm (`-16 LUFS`, `True Peak <= -1.0 dBTP` พร้อมเทคนิคตั้ง `TP=-2.0` และ `AAC 192k` เพื่อกัน overshoot)
- **มาสคอตและ Layout:**
  - `brand/mascot/poses/` (6 ท่า) และ `brand/mascot/faces/` + `assets/mascot/mouth_rig/`
  - `layouts/aot/SPEC.md` (3-zone layout ที่พิสูจน์แล้ว: กรอบภาพบน / แถบคำกลาง / มาสคอตล่าง)
- **ระบบ Theme Schema & QC:**
  - `themes/theme.schema.json` (ใช้เป็นฐานขยายเป็น `style.manifest.schema.json`)
  - `renderer/preflight.py`, `tests/qc.py`, `tests/test_*.py` (Contact Sheet, QC check, Unit tests)
  - `skills/liplnwza-motion/SKILL.md` + `agents/openai.yaml`
- **ส่วนที่เปลี่ยนใหม่:** เปลี่ยนจากตัววาด Python/Pillow ไปเป็น **HTML5 Canvas + SVG + GSAP ผ่าน Headless Chromium** เพื่อให้ขยับลื่นและแตกเป็น 100+ สไตล์ได้ง่าย

### 2.2 จาก `liplnwza548/motionforge`
- **สูตรความสมจริง (Prompt Vault & Math):**
  - สูตรใน `docs/FLASH-VS-OPUS-BENCHMARK.md` และ `benchmark/`: Spine Kinematics (กระดูกสันหลังพริ้ว), Gerstner Waves, Particle Engine, Telemetry Linkage, และกฎ *"Draw organs in the spine's local frame"*
- **วิธีคิด Frame-by-Frame Renderer:**
  - `render60.js` (แนวคิดควบคุมเวลา `t` แบบ Deterministic เพื่อเรนเดอร์ทีละเฟรมด้วย Chromium + FFmpeg)
- **ส่วนที่แก้ใหม่:** ลบการ hardcode path เครื่อง Windows/เฉพาะกิจออกทั้งหมด ทำให้เป็น Portable Engine ที่รันบน Linux Cloud VM ได้ทันทีใน 1 คำสั่ง (`doctor` check ผ่านครบ)

---

## 3. เวิร์กโฟลว์การผลิตแบบ 5 ด่าน (5-Gate AI Director Pipeline)

ออกแบบให้ตรงตามวิธีการทำงานที่คุณต้องการจริง — **ตรวจได้ทุกจังหวะก่อนเสียเวลาเรนเดอร์ยาว**:

```text
[Gate 1: รับโจทย์ & ค้นข้อมูล]
  - รับ "หัวข้อ/ลิงก์" หรือรับ "ไฟล์เสียงพากย์ของคุณ" เข้ามา
  - AI ค้นข้อมูลเบื้องต้น + สรุปข้อเท็จจริงและแหล่งอ้างอิง (Facts Sheet)
        │
        ▼ (คุณตรวจข้อเท็จจริง)
[Gate 2: บทพูด & เสียงพากย์ + สไตล์]
  - AI เสนอบทพูดแบ่งซีน + แนะนำสไตล์/จำนวนตัวละคร
  - ถ้าคุณไม่ได้ส่งเสียงมา → AI เจนเสียงพากย์ตัวอย่างให้ฟัง (Edge-TTS ไทย หรือ Pro TTS)
  - ถ้าคุณส่งเสียงมาเอง → AI วิเคราะห์ความยาวและสร้างจังหวะคำ/รูปปาก (words + visemes)
        │
        ▼ (คุณอนุมัติบท & เสียง)
[Gate 3: ภาพสเก็ตช์โครงร่าง (Layout Sketch)]
  - AI สร้าง "ภาพสเก็ตช์ลายเส้นขาว-ดำ/Wireframe" ของทุกซีนใน 1 แผ่น (ใช้เวลา < 3 วินาที)
  - เช็กว่าวางหัวข้อตรงไหน ตัวละครอยู่ตรงไหน ข้อความ/ป้ายไม่บังกัน
        │
        ▼ (คุณอนุมัติการจัดวาง)
[Gate 4: สตอรี่บอร์ดภาพสีจริง (Visual Storyboard Sheet)]
  - AI เรนเดอร์เฉพาะ "เฟรมสำคัญของทุกซีน" ด้วยเอนจินจริง (เช่น 8–12 ภาพ ใช้เวลา < 15 วินาที)
  - รัน Overlap & Safe-Area Lint อัตโนมัติ พร้อมแสดง Timecode ของแต่ละซีน
        │
        ▼ (คุณดูภาพสีจริงแล้วสั่ง "Render MP4!")
[Gate 5: เรนเดอร์ MP4 + ตรวจคุณภาพอัตโนมัติ (Render & QC)]
  - เรนเดอร์เฟรมทั้งหมดด้วย Headless Chromium + FFmpeg (รองรับ Multi-Aspect)
  - มิกซ์เสียงพูด + Procedural SFX/Ambient + 2-Pass Loudnorm (-16 LUFS / TP <= -1.0 dBTP)
  - ออกไฟล์: final.mp4 + subtitles.srt + contact_sheet.jpg + qc_report.json
```

---

## 4. สถาปัตยกรรมระบบ (Monorepo Structure)

แบ่งหน้าที่ระหว่าง **Node.js (วาดภาพ & เรนเดอร์เว็บ)** กับ **Python (เสียง, ลิปซิงค์, ตัดคำ, QC)**:

```text
genhalipza/
├── README.md
├── docs/
│   ├── MASTER_PLAN.md
│   └── REVIEW_GUIDE_FOR_CHATGPT.md
├── core/
│   ├── engine/               # [Node.js] Deterministic clock (renderAt(t)), GSAP, Multi-Aspect safe-area
│   ├── renderer/             # [Node.js] Headless Chromium CDP frame dumper + FFmpeg muxer
│   ├── sketcher/             # [Node.js] ตัววาด Layout Sketch (Gate 3) & Storyboard Sheet (Gate 4)
│   ├── rig/                  # [JS/SVG] LiplnwZa Clean-Plate Adapter + Parametric SVG Character Rig
│   ├── atmosphere/           # [JS/Canvas] หมอก, ฝน, แสงเทียน, ไฟฉาย, Paper Grain, Glow, Caustics
│   ├── audio/                # [Python] นำเข้าจาก liplnwza-motion-kit (Edge-TTS Multi-speaker, alignment, LUFS mix, procedural SFX)
│   ├── thai-text/            # [JS+Python] ตัดคำไทย (Intl.Segmenter / PyThaiNLP) + ซับไฮไลต์ + กันสระขาด
│   └── qa/                   # [Python+Node] Preflight, Overlap Check, Contact Sheet, Post-Render Gate
├── styles/
│   ├── mvp-4/                # 4 สไตล์ชุดเปิด (Wonlok-Plus, LiplnwZa Mascot, Stickman Duo, Mystery Stage)
│   ├── core-33/              # 33 แม่พิมพ์หลัก (Clean-Room)
│   └── story-100/            # Style Matrix 100+ แบบ (สร้างจาก Config + Custom Rig/Atmosphere)
├── assets/
│   ├── mascot-liplnwza/      # มาสคอต LiplnwZa เดิม (6 ท่า + 6 ปาก + profiles.json)
│   └── fonts/                # ฟอนต์ไทย OFL (Kanit, Prompt, Sarabun, Noto Sans Thai, Sriracha ฯลฯ)
├── studio/
│   └── exporter/             # ตัวแปลง Skill ไปยัง Antigravity, Codex (.codex-plugin), Claude Code
└── jobs/                     # พื้นที่ทำงานต่อคลิป (brief -> script -> sketch -> storyboard -> final.mp4)
```

---

## 5. แผนพัฒนาเป็นระยะ (Phased Roadmap)

### Phase 0: วางฐาน Cloud-Ready & เชื่อมของเก่า (สัปดาห์ที่ 1)
- ตั้งโครงสร้าง `genhalipza/` + สคริปต์ `doctor` เช็ก Chromium, FFmpeg, Python, Node, Thai Fonts ให้รันได้ 100% บน Cloud VM
- พอร์ตระบบเสียง + `post_render_gate.py` (`-16 LUFS`) + `mascot-liplnwza` จาก `liplnwza-motion-kit` เข้ามา
- พอร์ต Core Deterministic CDP Renderer (แก้ path ให้เป็น Relative/Temp-safe 100%)
- **เป้าหมาย:** เรนเดอร์คลิปทดสอบ 10 วินาที ที่มีเสียงไทย + ซับไทย + มาสคอตปากขยับ ได้ในคำสั่งเดียว

### Phase 1: ระบบ 5-Gate (Sketch + Storyboard + Thai Text Engine)
- สร้าง **Gate 3 (Layout Sketch Generator)** และ **Gate 4 (Storyboard Sheet Generator)**
- สร้าง `thai-text` (ตัดคำไทยไม่ขาดกลางคำ + ไฮไลต์คำตามเสียงพากย์ + Safe Area สำหรับ `9:16` และ `16:9`)
- รองรับทั้ง **รับไฟล์เสียงจากผู้ใช้ (Audio-In)** และ **AI พากย์ให้ (TTS Multi-speaker)**

### Phase 2: ปั้น MVP 4 สไตล์ชุดเปิดให้ใช้จริงได้ระดับ 100%
1. **`wonlok-plus`:** แม่พิมพ์ 5 ชั้น (Base Map/Image + Vector Highlight Mask + Neon Pulse/Routes + 2-Line Thai Headline + Word-Highlight Subtitles + Persistent Brand Badge) — ปิดช่องว่าง 30% ที่เคยขาดให้จบสวยอัตโนมัติ
2. **`liplnwza-mascot`:** มาสคอต 6 ท่าปากขยับ + ฉากกระดาษตัด/การ์ดขยับ (รองรับทั้ง 9:16 และ 16:9)
3. **`stickman-duo`:** ตัวละครลายเส้น Parametric SVG 2 ตัวคุยโต้ตอบ (แยกเสียงพากย์ 2 คน + ท่าทาง/สีหน้าตามบท)
4. **`mystery-stage`:** เวทีสืบสวน/สยองขวัญ (หมอก, ไฟฉาย, แสงเทียน, กระดานเชื่อมโยงด้ายแดง + Procedural Ambient SFX)

### Phase 3: ขยายสู่ 33 Core Archetypes + 100+ Storytelling Style Factory
- สร้าง Style Manifest & Token Composer (`Character Rig` × `Art Medium` × `Atmosphere` × `Stage` × `Voice Cast`)
- ทยอยสร้างแม่พิมพ์ให้ครบ 33 ประเภทหลัก (Explainer, Print/Retro, Geo/3D, Storytelling)
- ขยายคลัง 100+ สไตล์ใหม่เป็น Batch (Batch ละ 15–20 สไตล์ เน้นหมวด Storytelling & Character เป็นหลัก)

### Phase 4: Multi-Platform Skill Exporter
- สร้าง `lipza export` เพื่อแพ็ก 1 สไตล์ หรือทั้ง Studio ออกเป็น Skill สำหรับ:
  - Antigravity / Gemini (`SKILL.md` + `scripts/`)
  - OpenAI Codex (`.codex-plugin/plugin.json` + `skills/`)
  - Claude Code (`.claude/skills/`)
