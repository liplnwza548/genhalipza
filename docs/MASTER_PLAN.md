# GenhaLipza — Master Plan & Architecture Roadmap (Revised v2)

> เอกสารฉบับนี้ปรับปรุงจากแผนตั้งต้นหลังผ่านการรีวิวเชิงวิศวกรรมใน [`CHATGPT_REVIEW_2026-11-15.md`](CHATGPT_REVIEW_2026-11-15.md) เพื่อแยก **เป้าหมาย / สิ่งที่พิสูจน์แล้ว / สิ่งที่ยังไม่ทดสอบ** ให้ชัดเจน และลดความเสี่ยงที่จะค้างกลางทาง

---

## 1. เป้าหมายและหลักการสำคัญ (Core Principles)

| หัวข้อ | ข้อกำหนดที่ล็อกไว้ | เหตุผลและขอบเขต |
| :--- | :--- | :--- |
| **Repo & ลิขสิทธิ์** | Clean-Room 100% บน `liplnwza548/genhalipza` (Public) | Public repo เก็บเฉพาะโค้ด, schema, docs และ **fixture/placeholder ที่เผยแพร่ได้** เท่านั้น ส่วน **Owner Assets** (มาสคอตตัวจริง/เสียงส่วนตัว) และ **Reference ภายนอก (`GenhahaSkills`)** เก็บแยกนอก repo นี้ 100% |
| **เครื่องที่รันหลัก** | **Cloud VM First** (Linux VM เป้าหมายหลัก 1 แห่งก่อน) + รันบน Windows/Mac ได้ | ไม่ติด path ล็อกเครื่องแบบเดิม; พิสูจน์รันจริงบน Linux VM ทีละ environment แทนการเหมารวมว่าพร้อมทุกแพลตฟอร์มทันที |
| **ตัวละครหลัก (Mascot)** | **Parametric Vector/Canvas** ในแกนกลาง + รองรับ **มาสคอต LiplnwZa** แบบปลั๊กอินส่วนตัว | เริ่มพิสูจน์ระบบด้วย vector/map ก่อน แล้วค่อยต่อเข้ากับมาสคอต LiplnwZa (ผ่าน private asset path) ใน Phase 2B |
| **ภาษาและสัดส่วน** | **ภาษาไทย 100%** + **Multi-Aspect** (เริ่ม `9:16` ก่อน แล้วขยาย `16:9`, `1:1`, `4:5`) | ตัดคำไทยไม่ฉีกกลางคำ กันสระ/วรรณยุกต์ขาด; เริ่มพิสูจน์ `9:16` จนนิ่งก่อนขยายสัดส่วนอื่น |
| **AI Agent Target** | แกนกลางเดียว + Manifest/CLI ชัด → Export เป็นสกิลหลายแพลตฟอร์มใน Phase 4 | Antigravity/Gemini, OpenAI Codex (`.codex-plugin`), Claude Code (ทดสอบติดตั้งและรันจริงต่อแพลตฟอร์ม) |

---

## 2. การนำของดีจาก 2 Repo เก่ามาใช้ (Reuse & Rights Audit)

แทนการประเมินแบบเหมารวม (65–70%) เราแยกโมดูลจาก repo เดิมเป็น **Reuse Matrix** ที่ระบุสิทธิ์และสถานะจริงก่อนพอร์ต:

| โมดูล / แนวคิด | ต้นทาง & License | สถานะจริง & สิ่งที่ต้องแก้ | แผนใช้งาน |
| :--- | :--- | :--- | :--- |
| **Audio Mix & Post-Render Gate** (`audio_mix.py`, `post_render_gate.py`) | `liplnwza-motion-kit` (MIT) | แนวคิดวัด MP4 หลัง encode (`-16 LUFS`, `TP <= -1.0 dBTP`) ใช้ได้ แต่ต้องวัดใหม่กับ encoder บน VM เป้าหมาย | พอร์ตเข้า `core/audio/` และ `core/qa/` ใน Phase 0A–0B |
| **Voice Assembly & Cues** (`assemble_voice.py`, `prepare_cues.py`, `mfa_to_cues.py`, `dedup_visemes.py`) | `liplnwza-motion-kit` (MIT) | `prepare_cues.py` ต้องใช้ known script + local model (chunk ≤29s); `mfa_to_cues.py` เป็นตัวแปลงผลไม่ใช่ตัวติดตั้ง MFA; visemes เป็น heuristic | เก็บเป็น optional adapter; Phase 0B เริ่มจาก **Audio-In + cues ที่ตรวจแล้ว** ก่อน |
| **Theme Schema & QC Tests** (`themes/theme.schema.json`, `preflight.py`, `tests/qc.py`) | `liplnwza-motion-kit` (MIT) | โครงสร้าง JSON Schema และแนวคิด Contact Sheet ใช้เป็นฐานได้ดี | ขยายเป็น `style.manifest.schema.json` และ QC gate ใน Phase 0A–1 |
| **Raw Mascot & Voice Assets** (`brand/mascot/`, `assets/mascot/`) | `liplnwza-motion-kit` (`ASSET_RIGHTS.md`) | **`ASSET_RIGHTS.md` จำกัดการเผยแพร่ raw mascot และสิทธิ์เสียง** แม้โค้ดจะเป็น MIT | **ห้ามย้ายเข้า public repo** ใช้ placeholder fixture ใน `genhalipza` และโหลดของจริงจาก private asset path |
| **Deterministic Renderer** (`render60.js` + สูตรใน `benchmark/`) | `motionforge` (ไม่มีไฟล์ LICENSE) | `render60.js` มี absolute path, hardcode URL และ skip frame ตามไฟล์; `MF-002` ระบุ full render/determinism ยังไม่ยืนยัน | นำเฉพาะแนวคิด `renderAt(t)` มาเขียนใหม่แบบ Clean-Room ที่ portable และมี cache key/seed ชัดเจน |

---

## 3. เวิร์กโฟลว์การผลิตแบบ 5 ด่าน (5-Gate AI Director Pipeline)

ทุกด่านใช้ **Compiled Scene & Timeline JSON ชุดเดียวกัน** เป็น Single Source of Truth เพื่อรับประกันว่า Sketch, Storyboard และ Final MP4 ตรงกัน 100%:

```text
[Gate 1: Brief & Facts]
  - รับ "หัวข้อ/ลิงก์" หรือรับ "ไฟล์เสียงพากย์ (Audio-In)" เข้ามา
  - AI ค้นข้อมูลเบื้องต้น + สรุปข้อเท็จจริงและแหล่งอ้างอิง (Facts Sheet)
        │
        ▼ (คุณตรวจข้อเท็จจริง)
[Gate 2: Script, Voice & Cues]
  - AI เสนอบทพูดแบ่งซีน + แนะนำสไตล์
  - กรณี Audio-In (หลักใน Phase 0B): ตรวจบทคู่กับเสียงจริง -> สร้าง Phrase Captions / Cues ที่ตรวจแล้ว
  - กรณี TTS (Phase 1+): เจนเสียงพากย์ให้ฟังก่อน (Edge-TTS / Pro adapter พร้อม Audio-In fallback)
        │
        ▼ (คุณอนุมัติบท & เสียง -> บันทึก approval hash)
[Gate 3: Layout Sketch (Wireframe / Geometry Match)]
  - วาดด้วย Layout Bounds, Text Metrics และ Line Breaks จริงจาก Browser (เปลี่ยนสี/texture เป็นเส้นลวด)
  - แสดง Scene ID, Timecode, Aspect, Revision และสถานะ asset placeholder (Target: ≤5s warm)
        │
        ▼ (คุณอนุมัติการจัดวาง)
[Gate 4: Visual Storyboard (Full-Color Keyframes + Motion Probe)]
  - เรนเดอร์ด้วย Engine/Font/Seed เดียวกับ Final ที่ Frame Index สำคัญ (ข้อความยาวสุด, กลาง transition, จุดชนป้าย)
  - มีทั้ง Contact Sheet, Full-Size PNG (ไว้เช็กสระ/วรรณยุกต์) และ Motion Probe 2–3s สำหรับจุดเสี่ยง (Target: ≤15s warm)
        │
        ▼ (คุณดูภาพสีจริงแล้วสั่ง "Render MP4!")
[Gate 5: Final MP4 & Automated QC]
  - เรนเดอร์ทุกเฟรมแบบ Deterministic (Node + Chromium CDP -> FFmpeg)
  - มิกซ์เสียง + 2-Pass Loudnorm (-16 ± 0.5 LUFS / TP <= -1.0 dBTP วัดจาก MP4 หลัง AAC encode)
  - ออกไฟล์: final.mp4 + subtitles.srt + contact_sheet.jpg + qc_report.json
  - **จบงานเมื่อ:** ผ่าน Automated QC **และ** Philip ตรวจรับภาพ/เสียงจริง
```

### ระบบ State, Invalidation & Resume (`jobs/<slug>/`)
- เก็บสถานะงานใน `pipeline_state.json`, `approvals.json`, `assets.json`, `timeline.json` (เก็บไว้ใน workspace งานส่วนตัว ไม่ commit เสียง/output ลง public repo)
- **Dependency Invalidation:** แก้บท/เสียง → invalidate cues, Gate 3–5 อัตโนมัติ; แก้เฉพาะซีนที่เวลาเท่าเดิม → invalidate เฉพาะซีนนั้น; เปลี่ยน style/font/aspect/seed → invalidate preview และ frames ที่เกี่ยวข้องทั้งหมด
- **Atomic Checkpoint:** ใช้ `build_identity` + `effective_input_hash` เป็น cache key ไม่ข้ามเฟรมแค่เพราะเห็นไฟล์ PNG เก่าค้างอยู่

---

## 4. สถาปัตยกรรมระบบ (Monorepo Structure)

แบ่งหน้าที่ชัดเจนผ่าน **Versioned JSON** (Node.js คุม Timeline/Browser/FFmpeg; Python ทำงาน Audio/QC เป็นก้อนก่อน-หลัง render ไม่ spawn ต่อเฟรม):

```text
genhalipza/
├── README.md
├── STATUS.md
├── docs/
│   ├── MASTER_PLAN.md
│   ├── REVIEW_GUIDE_FOR_CHATGPT.md
│   └── CHATGPT_REVIEW_2026-11-15.md
├── schemas/                  # JSON Schemas: job, timeline, state, approvals, style.manifest
├── core/
│   ├── cli/                  # [Node.js] doctor, render, sketch, storyboard, qc
│   ├── engine/               # [Node.js] Deterministic renderAt(frameIndex / fps), seed, safe-area
│   ├── renderer/             # [Node.js] Headless Chromium CDP frame dumper + FFmpeg muxer
│   ├── thai-text/            # [Browser/Node] วัด font metrics + ตัดคำไทยครั้งเดียวใน Browser เพื่อใช้ร่วมกันทุก Gate
│   ├── audio/                # [Python] Audio-In cues, TTS adapter (Phase 1+), LUFS mix
│   └── qa/                   # [Python+Node] Preflight, Overlap Check, Contact Sheet, Post-Render Gate
├── styles/
│   ├── mvp-4/                # ทยอยสร้างทีละสไตล์ใน Phase 2 (wonlok-plus -> mascot -> stickman -> mystery)
│   ├── core-33/              # [Phase 3] 33 แม่พิมพ์หลัก (สร้างจาก Archetypes ที่พิสูจน์แล้ว)
│   └── story-100/            # [Phase 3] Style Presets (มี thumbnail + sample + acceptance status)
├── assets/
│   ├── fixtures/             # ตัวอย่าง/placeholder ที่เผยแพร่ใน public repo ได้ (เช่น vector map fixture, dummy mascot)
│   └── fonts/                # ฟอนต์ไทย OFL (Prompt, Kanit, Noto Sans Thai ฯลฯ)
├── studio/
│   └── exporter/             # [Phase 4] ตัวแปลง Skill ไปยัง Antigravity, Codex (.codex-plugin), Claude Code
└── jobs/                     # .gitignored (พื้นที่ทำงานต่อคลิปของ user)
```

---

## 5. แผนพัฒนาเป็นระยะแบบมีเกณฑ์ตรวจรับ (Phased Roadmap)

> ไม่ผูกมัดเวลาเป็น "สัปดาห์ที่ 1" จนกว่าจะวัด benchmark จริงบน VM เป้าหมาย — ใช้ **Exit Criteria** เป็นตัวตัดสินการข้าม Phase

### Phase 0A: Contracts + Capability Proof
- ตั้งโครงสร้าง `genhalipza/` + `schemas/` (`job`, `timeline`, `pipeline_state`, `approvals`, `style.manifest` ขั้นต่ำ) + Asset Policy
- สร้างคำสั่ง `doctor` ตรวจ Node, Python, Chromium, FFmpeg, Thai OFL Fonts และ **Capability Smoke Test** (เปิด Chromium วาดข้อความภาษาไทย 1 เฟรม + mux เสียง fixture)
- **Exit Criteria:** รันจาก clean checkout บน Linux VM เป้าหมายได้, รายงาน version/dependency ครบ, ผลิตเฟรมไทย + audio mux fixture สำเร็จ

### Phase 0B: 10-Second Vertical Slice (พิสูจน์ครบ 5 ด่าน)
- สร้างสไตล์นำร่องแบบบาง: **Stylized Vector Map/Route (1–2 ซีน, `9:16`, `30fps`)**
- ใช้ **Audio-In + Cues ที่ตรวจแล้ว + Phrase Captions ภาษาไทย** (ยังไม่เอา Lip-sync / TTS / ดาวเทียมมาขวาง)
- ผ่าน Gate 1 → Gate 5 ครบทุกด่านจนได้ `final.mp4`
- **Definition of Done (DoD):**
  1. `final.mp4` ขนาด `1080×1920`, `30fps`, `300 เฟรม`, H.264/AAC ตรง profile (ตรวจ video duration แยกจาก AAC padding)
  2. ซับไทยไม่ซ้อน ไม่ตัดสระ/วรรณยุกต์, min cue ≥ 0.6s, ไม่ล้น safe area
  3. Gate 4 keyframe ตรงกับเฟรมที่ extract จาก `final.mp4` (ใน tolerance ของ lossy encode)
  4. เสียง `-16 ± 0.5 LUFS` และ `True Peak <= -1.0 dBTP` วัดจาก **MP4 หลัง AAC encode จริง**
  5. **Automated QC ผ่าน + Philip ตรวจดูภาพและฟังเสียงจริงแล้วอนุมัติ**

### Phase 1: Workflow Robustness & Thai Text Engine
- ทำให้ Gate 3 (Sketch) และ Gate 4 (Storyboard + Motion Probe) สมบูรณ์แบบ
- ระบบ **Dependency Invalidation, Atomic Resume และ Scene Patch** (แก้ซีนเดียวไม่ต้องเรนเดอร์ใหม่ทั้งหมด, ทดสอบ stale approval / missing asset / interrupted render)
- สร้าง `thai-text` (ตัดคำไทย + Safe Area) + วัด Benchmark จริง (Cold vs Warm, 20 runs median/p95)
- เพิ่ม TTS Adapter (Edge-TTS ไทย Multi-speaker) โดยคง Audio-In เป็น fallback

### Phase 2: ปั้น MVP 4 สไตล์ทีละตัว (Sequential Rollout)
- **Phase 2A (`wonlok-plus`):** แม่พิมพ์ **5 Layers + 1 Global Brand Overlay** (Base Stylized/Natural Earth Map + Vector Highlight Mask + Neon Pulse/Routes + 2-Line Thai Headline + Phrase/Word-Highlight Subtitles + Brand Badge) — จำกัดขอบเขต 30–60s และพิสูจน์ให้ผ่านอย่างน้อย **3 คลิปต่างหัวข้อ** พร้อม Philip review
- **Phase 2B (เพิ่มทีละสไตล์หลัง `wonlok-plus` นิ่ง):**
  1. `liplnwza-mascot` (ต่อยอดมาสคอต 6 ท่าจาก private asset path + Lip-sync/Visemes + ฉากกระดาษตัด)
  2. `stickman-duo` (Parametric SVG 2 ตัวคุยโต้ตอบ แยกเสียง 2 คนตามบท)
  3. `mystery-stage` (หมอก, ไฟฉาย, แสงเทียน, กระดานสืบสวน + Ambient SFX)

### Phase 3: Style Factory (33 Core + 100+ Presets) & Multi-Aspect
- สกัด **Engine Capabilities → Reusable Archetypes → Style Presets** จากส่วนที่ใช้ซ้ำได้จริงใน Phase 2
- ขยาย `16:9` แล้วตามด้วย `1:1`, `4:5` (ทุกสไตล์ใหม่ต้องมี thumbnail + sample + acceptance status)

### Phase 4: Multi-Platform Skill Exporter
- สร้าง `lipza export` แพ็กสกิลสำหรับ Antigravity/Gemini, OpenAI Codex (`.codex-plugin`), Claude Code
- **Exit Criteria:** ทดลองติดตั้งและรันจริงอย่างน้อย 1 งานต่อแพลตฟอร์ม

