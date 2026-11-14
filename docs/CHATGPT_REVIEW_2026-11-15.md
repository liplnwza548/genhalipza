# GenhaLipza — รีวิวแผนโดย Sol / ChatGPT

วันที่: 15 พฤศจิกายน 2026 (Asia/Bangkok)  
สถานะ: **ควรปรับแผนก่อนเริ่มพัฒนาเต็มขอบเขต; เริ่ม Phase 0 แบบจำกัดเพื่อพิสูจน์ระบบได้**  
ประเภทงาน: ตรวจเอกสารและอ่านโค้ดต้นทางบางส่วน ไม่ใช่รับรองระบบที่รันจริง  
Baseline: [genhalipza@05565541b1a7457c21ff3ec17e99d0680e26457d](https://github.com/liplnwza548/genhalipza/tree/05565541b1a7457c21ff3ec17e99d0680e26457d)

## สรุปสำหรับ Philip

แนวคิด “ดูและอนุมัติงานทีละ 5 ด่าน” เหมาะกับการใช้งานจริง แต่แผนรวมงานยากหลายระบบพร้อมกัน: renderer ใหม่, ไทย, เสียง, ลิปซิงค์, แผนที่, 4 สไตล์, หลายอัตราส่วน และ exporter หลายแพลตฟอร์ม นี่ทำให้เสี่ยงกลับไปค้างที่งานเกือบเสร็จอีกครั้ง

**ข้อเสนอหลัก:** พิสูจน์งานหนึ่งเส้นทางให้จบก่อน: เสียงที่มีอยู่แล้ว + ซับไทยระดับวลี + แผนที่เวกเตอร์ง่าย + 9:16 + ครบ 5 ด่าน + MP4 ที่ตรวจจริง จากนั้นเพิ่มมาสคอตและสไตล์ที่เหลือทีละตัว ยังคงเป้าหมาย 4 สไตล์ก่อนขยาย แต่ไม่พัฒนาทั้ง 4 พร้อมกัน

คำว่า “100%” ควรหมายถึงผ่านรายการตรวจรับที่กำหนด ไม่ใช่รับประกันว่า AI จะสร้างคลิปสวยและถูกต้องทุกหัวข้อโดยอัตโนมัติ ยังต้องให้ Philip ดูภาพ ฟังเสียง และอนุมัติงานจริง

| ประเด็น | ผลตรวจ |
| --- | --- |
| แนวทาง 5 ด่าน | ควรเก็บไว้ และใช้ artifact/timeline เดียวกันทุกด่าน |
| Node + Python | ใช้ได้ แต่แบ่งงานผ่านไฟล์ JSON และเรียก Python เป็นงานก้อน |
| ของเก่าใช้ได้ทันที 65–70% | ยังไม่มีวิธีคำนวณหรือหลักฐาน integration รองรับ |
| Gate 3 <3 วินาที / Gate 4 <15 วินาที | เป็นเป้าหมายที่ยังไม่วัด ต้องแยก warm/cold และระบุเครื่อง |
| ระบบพร้อม Cloud VM ทุกแพลตฟอร์ม | ยังไม่พิสูจน์ ต้องมี capability check และทดสอบทีละ environment |
| Clean-room / นำ asset เดิมเข้า public | ต้องแยกสิทธิ์โค้ดออกจากสิทธิ์ asset; มีข้อจำกัดจริงในต้นทาง |
| เริ่มทำ 33 + 100+ สไตล์ | เก็บเป็น backlog จน 4 สไตล์แรกผ่านงานจริง |

ข้อเสนอในรายงานนี้ยังไม่ใช่การอนุมัติเปลี่ยนข้อกำหนดที่ล็อกไว้ และยังไม่ได้แก้ MASTER_PLAN หรือเริ่มเขียน engine

## ขอบเขตและหลักฐานที่อ่าน

### Repo ใหม่

ใน baseline พบเพียง README และเอกสาร 2 ไฟล์ ยังไม่มี implementation, dependency lockfile, tests หรือผล benchmark ของ genhalipza

- [README.md](https://github.com/liplnwza548/genhalipza/blob/05565541b1a7457c21ff3ec17e99d0680e26457d/README.md)
- [MASTER_PLAN.md](https://github.com/liplnwza548/genhalipza/blob/05565541b1a7457c21ff3ec17e99d0680e26457d/docs/MASTER_PLAN.md)
- [REVIEW_GUIDE_FOR_CHATGPT.md](https://github.com/liplnwza548/genhalipza/blob/05565541b1a7457c21ff3ec17e99d0680e26457d/docs/REVIEW_GUIDE_FOR_CHATGPT.md)

### Repo ต้นทางที่ตรวจเฉพาะส่วนเกี่ยวข้อง

- liplnwza-motion-kit: `d308d8998256d060ecea076d787768c733ca1d06`
- motionforge: `eb2da1262f0d227635a513b4d69b3f78403eb4ab`

อ่าน tree ของทั้งสอง repo และไฟล์ LICENSE, ASSET_RIGHTS, prepare_cues, mfa_to_cues, post_render_gate, README/renderer/readiness ที่อ้างด้านล่าง ไม่ได้ audit ทุกไฟล์หรือรันชุดทดสอบของสอง repo นี้

## ข้อค้นพบตามความสำคัญ

| ระดับ | ข้อค้นพบและหลักฐาน | ผลกระทบ / สิ่งที่ควรทำ |
| --- | --- | --- |
| สูง | MASTER_PLAN §1–2 ระบุ clean-room และการพอร์ต mascot; แต่ [ASSET_RIGHTS.md บรรทัด 3–10](https://github.com/liplnwza548/liplnwza-motion-kit/blob/d308d8998256d060ecea076d787768c733ca1d06/assets/ASSET_RIGHTS.md#L3-L10) จำกัดการเผยแพร่ raw mascot และสิทธิ์เสียง | เก็บ owner assets นอก public repo ใช้ placeholder ในตัวอย่าง; บันทึกสิทธิ์แยกรายไฟล์ก่อนย้ายของจริงเข้า repo |
| สูง | MASTER_PLAN §2 ประเมิน reuse 65–70%; แต่ [MF-002 readiness](https://github.com/liplnwza548/motionforge/blob/eb2da1262f0d227635a513b4d69b3f78403eb4ab/docs/MF-002-readiness.md#L7) ระบุ full render/audio และ determinism ยังไม่ยืนยัน | เปลี่ยนเป็นรายการ candidate modules พร้อมสถานะ tested/adapt/rewrite; อย่าใช้เปอร์เซ็นต์นี้ประมาณเวลาจนมี integration proof |
| สูง | [render60.js](https://github.com/liplnwza548/motionforge/blob/eb2da1262f0d227635a513b4d69b3f78403eb4ab/s06-60s/render60.js) ใช้ absolute paths, URL s06-60s-v3 และ skip frame ตามการมีไฟล์ | ย้ายแนวคิดมาใช้ได้ แต่ต้องแก้ portable config และ cache identity; การพบ PNG เดิมไม่ได้แปลว่าเป็นเฟรมของ revision ปัจจุบัน |
| สูง | MASTER_PLAN §3 มีขั้นตอนอนุมัติ แต่ยังไม่มี schema/revision/invalidation contract | หลังแก้บทหรือเสียง ต้องทำให้การอนุมัติภาพ/วิดีโอที่อิงของเก่าใช้ต่อไม่ได้; กำหนด contract ก่อน render ยาว |
| สูง | Gate 4 ดูเพียง 8–12 เฟรม และ overlap lint | ภาพนิ่งไม่พิสูจน์จังหวะ ซับ ลิปซิงค์ การเคลื่อนที่หรือการชนกันระหว่างเฟรม; เพิ่ม motion probe สั้นเฉพาะจุดเสี่ยง |
| สูง | MASTER_PLAN Phase 0 รวมย้ายเสียง มาสคอต renderer และ lip-sync ในสัปดาห์เดียว | ยังไม่มี benchmark และ dependency proof พอสำหรับคำมั่นเวลา; แยก proof 10s ออกจาก lip-sync/alignment/TTS |
| กลาง | [prepare_cues.py](https://github.com/liplnwza548/liplnwza-motion-kit/blob/d308d8998256d060ecea076d787768c733ca1d06/renderer/prepare_cues.py#L1-L3) ต้องใช้ known script, local model และ chunks ไม่เกิน 29s; visemes เป็นกฎประมาณ | รับเสียงอย่างเดียวไม่ได้ทำให้มี timings ที่เชื่อถือได้ทันที ต้องมี transcript ที่ตรวจแล้วและวิธีแก้เวลา |
| กลาง | MASTER_PLAN §4 ใช้ JS+Python ตัดคำ และวาง GSAP/rig/effects พร้อมกัน | ให้มีตัวสร้าง layout และ token timestamps ที่เป็นเจ้าของข้อมูลเพียงตัวเดียว; ลดการคำนวณซ้ำข้ามภาษา |
| กลาง | คำว่า Cloud VM First + doctor ผ่าน ถูกวางใกล้คำว่าใช้ได้ทันที | doctor พิสูจน์ prerequisites; ต้องมี render smoke test และ full-path proof เพิ่ม โดยไม่สมมติว่าทุก agent มี shell/network/browser เหมือนกัน |
| ต่ำ | MASTER_PLAN Phase 2 เรียก wonlok-plus ว่า “5 ชั้น” แต่แจกแจง 6 องค์ประกอบ | แก้จำนวนชั้นหรือระบุ brand badge เป็น overlay กลาง เพื่อให้ schema กับ spec ตรงกัน |

### Reuse และ clean-room ที่ควรแยกให้ชัด

[LICENSE ของ motion-kit](https://github.com/liplnwza548/liplnwza-motion-kit/blob/d308d8998256d060ecea076d787768c733ca1d06/LICENSE) เป็น MIT แต่ไม่ใช่หลักฐานว่าทุก asset ใน repo อนุญาตเผยแพร่ได้เหมือนโค้ด ส่วน [README ของ motionforge](https://github.com/liplnwza548/motionforge/blob/eb2da1262f0d227635a513b4d69b3f78403eb4ab/README.md) ระบุว่ายังไม่มี license file; อย่าเพิ่ม license หรือเหมารวมสิทธิ์ให้มันเอง

การอ่านโค้ดเก่าแล้วพอร์ตเข้ามาควรบันทึกว่าเป็น reuse/adaptation ตามจริง การเขียนใหม่หรือเปลี่ยนชื่อไม่ได้พิสูจน์ clean-room โดยตัวมันเอง ข้อเสนอคือเก็บ `source repo + commit + path + license/permission + change summary` ต่อโมดูล และแยก third-party reference ที่ห้ามนำเข้ามาออกจากโค้ดของ Philip

## 1. Node.js + Python ซับซ้อนเกินไปไหม?

**สองภาษาไม่ใช่ปัญหาหลัก; การมีหลายทางทำงานและข้อมูลซ้ำกันต่างหากที่แพง**

คง Node สำหรับ orchestration, scene/layout, Chromium capture และเรียก FFmpeg; คง Python สำหรับ audio/alignment/QC ที่มีของเดิมใช้ได้ การแลกข้อมูลผ่าน versioned JSON ง่ายกว่าตั้ง HTTP services หรือ RPC หลายตัวใน MVP

| ส่วน | ขอบเขตเริ่มต้นที่เสนอ |
| --- | --- |
| Scene renderer | Canvas 2D เป็นหลัก; นำ SVG มาเป็น asset ตามจำเป็น ไม่สร้าง renderer คู่ขนานหลายชุด |
| Animation | `renderAt(frameIndex / fps)` หรือ seek timeline ที่หยุดไว้; ไม่พึ่ง wall clock |
| Python | ทำงานก่อน/หลัง render เป็นครั้งๆ ไม่ spawn ต่อเฟรม |
| FFmpeg | เครื่องมือกลางสำหรับ decode/mix/encode/probe; ไม่สร้าง audio engine ใหม่ |
| Thai layout | สร้าง line breaks และ measured bounds ครั้งเดียวใน browser; เก็บผลไว้ใช้ทุกด่าน |
| Alignment/TTS | optional adapters; เริ่มจากไฟล์เสียงและ cue ที่ตรวจแล้ว |
| Worker pool/GPU | ยังไม่เป็น dependency บังคับ เริ่ม worker เดียวและวัดก่อน |

Determinism ต้องครอบคลุม random seed, particles, assets, fonts, viewport, frame rate และ browser version ด้วย ไม่ใช่มี `renderAt(t)` แล้วถือว่าจบ สำหรับระบบจำลองที่มี state ให้มี precompute/checkpoint หรือวิธี replay ที่ให้ผลตรงกันก่อนเปิด random seek/parallel chunks

[Playwright Clock](https://playwright.dev/docs/clock) ควบคุม timers ได้ แต่ไม่ได้รับรองความเหมือนของภาพข้ามเครื่อง ข้อเสนอ renderer นี้ต้องพิสูจน์ด้วยการเรนเดอร์เวลาเดียวกันทั้งแบบ seek ตรงและแบบไล่เฟรม

## 2. Gate 3 / Gate 4 ให้เร็วและตรง MP4

ใช้ **compiled scene/timeline ชุดเดียว** เป็นแหล่งข้อมูลของ sketch, storyboard และ MP4 อย่าให้ AI วาด storyboard อีกชุดโดยไม่มีความสัมพันธ์กับ scene จริง

### Gate 3 — Sketch

- ใช้ layout boxes, text จริง, line breaks จริง, camera bounds และ reserved subtitle area
- เปลี่ยนสี/texture เป็นเส้นลวดหรือ placeholder แต่คง geometry และ text metrics
- label scene ID, timecode, aspect และ revision; overlay debug ต้องอยู่ใน preview เท่านั้น
- สำหรับ asset ที่ยังไม่มี ต้องแสดงสถานะ placeholder ให้เห็น และทำให้ Gate 4 ต้องรอตัวจริงก่อนอนุมัติ

### Gate 4 — สีจริง

- โหลด font และ decode asset ทั้งหมดจนพร้อมก่อนจับภาพ; ตรวจ missing font/glyph และ failed asset
- ใช้ engine, dimensions, text shaping, seed, projection และ timings เดียวกับ final
- render ณ frame index ที่แน่นอนแล้วค่อยย่อเป็น contact sheet; ห้ามเปลี่ยน viewport จนเกิด text reflow
- เลือกเฟรมตามเหตุการณ์ เช่น ข้อความยาวสุด กลาง transition จุดเส้นทางชนป้าย และ peak effect ไม่ใช่ midpoint ซีนอย่างเดียว
- มี PNG เต็มขนาดให้เปิดดู เพราะ contact sheet ไม่พอตรวจวรรณยุกต์และซับ
- เพิ่ม motion probe 2–3 วินาทีสำหรับ transition/route/lip-sync; แยกเวลาสร้าง probe ออกจาก SLA ภาพนิ่ง
- หลัง encode final ให้ extract เฟรมเวลาเดียวกับ storyboard แล้วเทียบโดยยอมรับความต่างจาก lossy codec ภายใน tolerance ที่กำหนดภายหลัง

### เป้าหมายเวลาที่เสนอ — ยังไม่ใช่ผล benchmark

| งาน | เงื่อนไขการวัด | เป้าหมายเริ่มต้น |
| --- | --- | --- |
| Gate 3: 8–12 ซีน | browser อุ่น, fonts/assets พร้อม, สร้าง sheet เสร็จ | ≤5s; <3s เป็น stretch target |
| Gate 4: 8–12 keyframes | renderer/asset cache พร้อม, final layout ตรงกัน, รวม capture+compose+write | ≤15s |
| Cold start | รวม browser launch, font load, local asset load | รายงานแยก ยังไม่รับปากตัวเลข |
| ติดตั้ง/download model หรือ assets | network/bootstrap | แยกจาก render benchmark และต้องรายงานเวลารอด้วย |

เก็บ CPU quota, RAM, disk space, browser/FFmpeg versions, resolution, scene complexity, peak RSS และผลซ้ำอย่างน้อย 20 รอบเพื่อดู median/p95 โดยอย่าเรียก p95 จากตัวอย่างเล็กว่าเป็น SLA ที่พิสูจน์แล้ว

ถ้าไม่ถึงเป้า ให้ profile ก่อน ลด blur/glow radius, cache static map/background, ลด capture round trips แล้วค่อยลอง 1/2/4 workers ตาม RAM จริง แต่ละ worker ต้องมี page/state แยกและประกอบเฟรมตามเลขลำดับ ห้ามคาดว่าการเพิ่ม tab จะเร็วขึ้นเป็นเส้นตรง

24/25fps ลดจำนวนเฟรมได้ แต่เปลี่ยนจังหวะการเคลื่อนไหว จึงเป็น output profile ทางเลือก ไม่ใช่วิธีปกปิดปัญหาความเร็วของ 30fps

## 3. ความเสี่ยงของ wonlok-plus และภาษาไทย

**ทำคลิปแผนที่ที่มีคุณภาพสม่ำเสมอในขอบเขตจำกัดได้; ทำทุกหัวข้อให้งามเท่าต้นแบบอัตโนมัติ 100% ยังไม่มีหลักฐานรองรับ**

| ความเสี่ยง | วิธีจัดการใน pilot |
| --- | --- |
| ไม่มีภาพดาวเทียมฟรีที่สิทธิ์และความละเอียดตรงงาน | เริ่ม Natural Earth vector/raster ที่เหมาะกับระดับประเทศ; ไม่สัญญาว่า procedural texture คือภาพดาวเทียมจริง |
| แผนที่ผิดตำแหน่ง/ยุค | เก็บ dataset version, projection, coordinate order, source date; แยกภูมิศาสตร์ปัจจุบันจากพรมแดนประวัติศาสตร์ |
| ซูมเกินรายละเอียดข้อมูล | กำหนดช่วง zoom; หยุดหรือเปลี่ยน asset ถ้า source ไม่ละเอียดพอ |
| เส้นทางผิด/ข้ามเส้นวันที่ | คำนวณเส้นทางในพิกัดภูมิศาสตร์ก่อน project; ตรวจ dateline, clipping และ marker anchors |
| Glow บดบังเนื้อหา | วาด base route คมก่อน composited glow; จำกัด effect budget และสงวนพื้นที่ป้าย |
| ป้ายชื่อชนกัน | ใช้ label priority, reserved zones และตำแหน่งสำรอง; ตรวจช่วงเคลื่อนไหวด้วย |
| คำไทย/วรรณยุกต์ขาด | แบ่งคำก่อน layout, รักษา grapheme clusters, ใช้ font metrics จริงและเผื่อ ascender/descender |
| ไฮไลต์คำไม่ตรงเสียง | แยก text tokenization ออกจาก alignment; เริ่มซับระดับวลีและเปิด word highlight เมื่อ timings ผ่านตรวจ |
| เรื่อง/จังหวะไม่น่าดู | ใช้ shot recipes ที่มีข้อจำกัด และให้ Philip ตรวจก่อน final; QC เชิงตัวเลขไม่ตัดสิน storytelling แทนคน |

Natural Earth ระบุข้อมูลเป็น public domain แต่ไม่ได้รับประกันความถูกต้องทุกกรณี ([terms](https://www.naturalearthdata.com/about/terms-of-use/)) ส่วนข้อมูล OSM กับบริการ tile เป็นคนละเงื่อนไข: อย่าใช้ standard tile server เป็นแหล่ง bulk download สำหรับ factory ([tile policy](https://operations.osmfoundation.org/policies/tiles/)) หากใช้ OSM ให้ตรวจข้อกำหนด attribution และเงื่อนไขของ dataset/service ที่เลือกด้วย

แนะนำให้ pilot ใช้ stylized map + route + marker + headline + phrase captions ก่อนเพิ่ม satellite, terrain 3D หรือเมืองละเอียด

### Audio-In / Thai alignment ที่คู่มือถามเพิ่มเติม

- ถ้ามีแค่เสียง: สร้าง transcript ร่าง แล้วให้ตรวจแก้ก่อน align; การบังคับ transcript ผิดให้ตรงเสียงไม่ได้พิสูจน์ว่าผู้พูดพูดตามบท
- ถ้ามีเสียงและบทที่ตรวจแล้ว: ทดลองของเดิมกับชุดเสียงไทยจริงก่อนเพิ่ม framework ใหม่
- `prepare_cues.py` เดิมใช้ CPU int8/local model, ต้องมี segments/chips, จำกัด chunk ≤29s และระบุชัดว่า visemes เป็นค่าประมาณ
- `mfa_to_cues.py` เป็นตัวแปลงผล MFA ไม่ใช่ตัวติดตั้ง/รัน acoustic aligner; การมีไฟล์นี้ไม่ได้แปลว่า MFA พร้อมบน Cloud VM
- [WhisperX alignment.py](https://github.com/m-bain/whisperX/blob/main/whisperx/alignment.py) ที่ตรวจวันที่นี้ไม่มี `th` ใน default alignment model maps จึงไม่ควรอ้างว่าเลือกภาษาไทยแล้วได้ forced alignment พร้อมใช้ ต้องเลือกและพิสูจน์ model เพิ่มเอง
- ไม่เพิ่ม diarization ตอนเริ่ม; บทสองคนที่เราสร้างเองรู้ speaker อยู่แล้ว ไม่จำเป็นต้องเดาผู้พูดจากเสียง
- เก็บวิธี align, model version, voice/script hash, corrected cues และสถานะตรวจไว้; ถ้าเวลาไม่ผ่านให้กลับไปใช้ phrase captions หรือแก้ cue ไม่สร้างความมั่นใจปลอมด้วย interpolation
- เลือกวิธีจากคุณภาพบนชุดเสียงไทยที่มีคำยาว ตัวเลข ชื่ออังกฤษ และช่วงเงียบ พร้อมวัดเวลารัน/RAM; ยังไม่มีผลเทียบที่จะประกาศว่า aligner ใดเบาและแม่นที่สุดสำหรับงานนี้

TTS ออนไลน์ควรเป็น adapter ที่ตรวจ availability และอนุมัติ provider ตามงาน มี Audio-In เป็น fallback สำหรับข้อจำกัด network; ห้ามถือว่าบริการฟรีหนึ่งตัวเป็น dependency ที่พร้อมเสมอ

## 4. Schema สำหรับ 100+ Style Factory

อย่าสร้าง 100 renderer แยกกัน แยก **engine capabilities → reusable archetypes → style presets → episode data** จำนวน config ไม่เท่ากับจำนวนสไตล์ที่ผ่านตรวจรับ

| Contract | ฟิลด์/หน้าที่ขั้นต่ำที่เสนอ |
| --- | --- |
| style manifest | schemaVersion, id, version, engine compatibility, archetype, supported aspects, capabilities |
| Design tokens | palette, typography/font hashes, spacing, stroke, effect limits, safe-area profile |
| Scene recipes | slot IDs/types, allowed transitions, maximum text/labels/characters, supported camera operations |
| Job/timeline | stable scene ID, explicit frame ranges, caption tracks, speaker/asset references, seed |
| Asset manifest | id, source, content hash, license/permission, redistribution scope, attribution |
| Acceptance | golden sample jobs, expected outputs, lint rules, complexity budget |
| Build identity | engine/style version, lockfile/browser/font/asset hashes, aspect, resolution, fps, seed |

ตัวอย่าง manifest แบบย่อเพื่อสื่อ contract เท่านั้น ยังไม่ใช่ schema ที่ implement แล้ว:

```json
{
  "schemaVersion": 1,
  "id": "map-route",
  "version": "0.1.0",
  "archetype": "geo-route",
  "supportedAspects": ["9:16"],
  "capabilities": ["vector-map", "route", "thai-phrase-captions"],
  "limits": {"maxLabels": 5, "maxCaptionLines": 2},
  "render": {"fps": 30, "seedRequired": true},
  "tokens": {"fontFamily": "Prompt", "palette": "night-map"},
  "recipes": ["locate", "trace-route", "compare"],
  "acceptanceJobs": ["thai-map-10s"]
}
```

ตัวเลข limit เป็นข้อเสนอ ต้องพิสูจน์กับภาพจริง ใช้ schema validate ก่อน compile, ปฏิเสธ unknown/unsupported combinations พร้อมข้อความที่แก้ได้ ไม่ให้ AI ใส่ arbitrary JavaScript ใน config แล้วกลายเป็นช่องทางรันโค้ด

ไม่ต้องทำ inheritance หลายชั้นหรือ Cartesian product ทุกชุด สไตล์ใหม่ต้องมี thumbnail, motion sample, compatibility และ acceptance status ของตัวเอง ธีมสีใหม่อาจเป็น preset ของสไตล์เดิมโดยไม่ต้องนับเป็น renderer ใหม่

### State / Approval / Resume

ใช้ `jobs/<slug>/` เป็น workspace ส่วนตัว; public repo เก็บเพียง fixture ที่ตรวจสิทธิ์แล้ว ตั้ง ignore ตั้งแต่แรก ไม่ commit เสียงส่วนตัว/outputs ทั้งโฟลเดอร์

เริ่มด้วย `pipeline_state.json`, `approvals.json`, `assets.json`, `timeline.json` และ artifact directories ตาม gate ก็พอ ยังไม่จำเป็นต้องตั้ง database/server

- แต่ละ gate มี status, input hash, artifact hash และ revision ที่ Philip ตรวจจริง
- approval ต้องบันทึกผู้อนุมัติ เวลา scope และ hash ของ artifact/input dependencies; AI บันทึกคำอนุมัติที่ได้รับได้ แต่ห้ามสร้างการอนุมัติแทน Philip
- เปลี่ยนเสียง/บท → cues/timeline และงาน downstream กลับเป็น stale; เปลี่ยนภาพเฉพาะซีนโดยเวลาเท่าเดิม → สร้างภาพซีนและ approval ที่เกี่ยวข้องใหม่
- ถ้าเวลาซีนเปลี่ยน ต้อง invalidate captions, transitions และซีนถัดไปที่เวลา absolute เลื่อนตาม
- เปลี่ยน style/font/engine/aspect/seed → invalidate preview และ frames ที่เกี่ยวข้องทั้งหมด
- Cache key ต้องรวม effective inputs และ dependencies ไม่ใช่ scene ID หรือชื่อ PNG อย่างเดียว
- เก็บ checkpoints แบบ atomic และล็อกหนึ่ง writer ต่อ job; ไม่ให้ retry ไปเขียนทับ revision ที่อนุมัติแล้ว
- เก็บ encoded chunks หรือ frame ranges พร้อม build identity เพื่อแก้เฉพาะซีน; หลังเปลี่ยนภาพยังต้อง remux และ QC final ส่วนเสียงที่เปลี่ยนต้องมิกซ์/วัดทั้ง track ใหม่
- ตรวจเส้นทางไฟล์ให้อยู่ใน job/assets roots และใช้ subprocess arguments แบบแยกค่า ไม่ต่อ shell command จากข้อความในโจทย์

hash ช่วยตรวจว่างานเปลี่ยน ไม่ได้พิสูจน์ตัวบุคคล สำหรับระบบใช้คนเดียวเริ่มด้วยบันทึกคำอนุมัติจาก session ที่เชื่อถือได้และประวัติ revision ก็เพียงพอ ไม่จำเป็นต้องสร้างระบบลายเซ็นซับซ้อนตั้งแต่แรก

## 5. ลำดับ Phase ที่แนะนำ

รักษา 5 gates และเป้าหมาย 4 styles แต่ลดสิ่งที่ต้องทำพร้อมกัน ใช้ exit criteria แทนคำมั่น “สัปดาห์ที่ 1” จนกว่าจะวัดจริง

| ระยะ | ทำอะไร | เกณฑ์ออกจากระยะ |
| --- | --- | --- |
| Phase 0A: Contracts + capability proof | เลือก Linux VM หนึ่งแบบ; doctor, locked dependencies, job/timeline/state schema, asset policy, font fixture | render ไทยหนึ่งเฟรมและ mux ไฟล์เสียง fixture ได้; รายงาน dependency ที่ไม่มี ไม่อ้างรองรับทุกแพลตฟอร์ม |
| Phase 0B: 10s vertical slice | map route 1–2 ซีน, 9:16, 30fps, Audio-In + cue ที่ตรวจแล้ว, ทำครบ G1–G5 แบบบาง | 1080×1920/300 เฟรม, H.264/AAC, ไม่มี glyph ตก/ซับชน, MP4 QC ผ่าน, Philip ตรวจภาพ/เสียง |
| Phase 1: Workflow robustness | Gate 3/4 ใช้ scene จริง, Thai wrapping, dependency invalidation, resume/scene patch และ benchmark warm/cold | restart แล้วงานต่อได้, แก้ซีนเดียวไม่ reuse ของเก่า, preview เทียบ final ได้, มีตัวเลขเวลาจริง |
| Phase 2A: wonlok-plus จำกัดขอบเขต | พิสูจน์ 30–60s กับ vector map; เพิ่ม word highlight เฉพาะเมื่อ timings ดีพอ | งานต่างหัวข้ออย่างน้อย 3 คลิปผ่าน checklist เดียวกัน โดยมี owner review |
| Phase 2B: อีก 3 สไตล์ทีละตัว | mascot → stickman-duo → mystery-stage เป็นลำดับตั้งต้น; เพิ่ม optional lip-sync/multivoice/effects เมื่อสไตล์นั้นต้องใช้ | แต่ละสไตล์มี sample จริงและรันซ้ำได้; assets ถูกสิทธิ์; ยังไม่ขยายจำนวนสไตล์ก่อนครบ 4 |
| Phase 3: Factory | สร้าง archetypes/presets จากส่วนที่ใช้ซ้ำจริง; เพิ่ม 16:9 แล้ว aspects อื่นเมื่อมี sample | registry + compatibility + fixture ต่อสไตล์; วัดเวลาต่อคลิป/จำนวนรอบแก้ ไม่ใช่นับไฟล์ config |
| Phase 4: Platform packaging | exporter บางๆ และ adapter ตาม runtime แต่ละแพลตฟอร์ม | ทดลองติดตั้งและรันจริงอย่างน้อยหนึ่งงานต่อแพลตฟอร์ม; ไม่รับประกันจากชื่อ package structure |

ย้าย **manifest เวอร์ชันเล็ก** มาอยู่ Phase 0 และทำ smoke packaging หนึ่งแพลตฟอร์มช่วงต้นเพื่อไม่ให้ CLI contract ผิดทาง แต่เลื่อน factory/exporter เต็มชุดไว้ท้าย การ “ส่งออก skill” หมายถึงคำแนะนำและ entrypoint ไม่ได้ทำให้ Gemini Apps, Cloud Agent และ local coding agent มี runtime/สิทธิ์เหมือนกัน ต้องตรวจ format ที่รองรับในเวลาลงมือจริง

### Definition of Done ที่ควรตกลงก่อน Phase 0B

รายการต่อไปนี้เป็นข้อเสนอใหม่ ไม่ใช่ผลทดสอบหรือค่าอนุมัติที่มีอยู่แล้ว:

1. มีตัวอย่าง 10s ที่ clean checkout บน VM เป้าหมายรันตามคู่มือได้ พร้อม versions/logs และ artifact hashes
2. final.mp4 มีจำนวนเฟรม/ขนาด/codec ตรง profile; duration ของ video stream ตรวจแยกจาก AAC padding
3. ซับไทยไม่ overlap; min cue 0.6s สำหรับ profile เริ่มต้น; ไม่แบ่งวรรณยุกต์; ถ้าอ่านไม่ทันต้องปรับบท/การแบ่ง cue ไม่ยืดจนชนซีน
4. Gate 4 กับเฟรมที่ extract จาก MP4 แสดง layout เดียวกัน ณ frame เดียวกัน; ดูคลิปจริงเพิ่มเติมเพื่อเช็กการเคลื่อนที่
5. baseline แผนนี้คง final -16 LUFS ±0.5 และ true peak ≤-1 dBTP; ค่ามิกซ์เผื่อ headroom ไม่ใช่เกณฑ์ผ่าน ต้องวัด MP4 หลัง AAC encode จริง
6. หากจะใช้ audio profile อื่นให้ระบุใน job และอนุมัติก่อน; ไม่เปลี่ยน -16 ตามค่าโปรเจกต์อื่นโดยอัตโนมัติ
7. ทดสอบ stale approval, asset หาย, process ตายแล้ว resume, เปลี่ยนฟอนต์, scene patch และ low-disk แบบที่ตรวจได้จริง
8. Philip ตรวจภาพ เสียง และจังหวะผ่านก่อนปักสถานะ accepted; automated QC ผ่านอย่างเดียวไม่พอ

ของเดิม [post_render_gate.py](https://github.com/liplnwza548/liplnwza-motion-kit/blob/d308d8998256d060ecea076d787768c733ca1d06/renderer/post_render_gate.py) มีแนวคิดวัด finished MP4 ที่ควรเก็บไว้ แต่ค่าชดเชย AAC/peak ที่เคยสำเร็จไม่ใช่หลักประกันทุกเสียงและทุก encoder ต้องวัดใหม่ และตรวจ normalization mode ที่เกิดขึ้นจริงตาม [FFmpeg loudnorm](https://ffmpeg.org/ffmpeg-filters.html#loudnorm)

## งานถัดไปที่แนะนำ

1. ปรับ MASTER_PLAN ให้แยก “เป้าหมาย / ข้อพิสูจน์แล้ว / ยังไม่ทดสอบ” และแนบ exit criteria ข้างต้น
2. ทำ reuse matrix รายโมดูล พร้อม source commit, license/permission, interface, dependencies และตัวอย่างที่พิสูจน์ได้
3. ตกลง scope 10s vertical slice: vector map, 9:16, Audio-In, phrase captions; เก็บมาสคอตจริงนอก public repo
4. เริ่ม Phase 0A แล้วค่อยประเมินเวลา Phase 0B จากข้อมูลจริง
5. ยังไม่สั่งทำ 33/100+ styles หรือ exporter เต็มชุดในงานถัดไป

## การตรวจยืนยันและข้อจำกัดของรีวิวนี้

**ดำเนินการแล้ว:** อ่านไฟล์แผนทั้ง 3 ไฟล์, ตรวจ tree repo ต้นทาง, อ่านโค้ด/สิทธิ์/บันทึก readiness ที่ระบุ และตรวจเอกสารผู้พัฒนาของ Playwright, FFmpeg, WhisperX, Natural Earth และ OSMF วันที่รีวิว

**ยังไม่ได้ทำ:** ติดตั้ง dependencies, รัน engine/tests ของ repo เก่า, benchmark Cloud VM, ฟังเสียงตัวอย่าง, ตรวจ MP4 หรือพิสูจน์คุณภาพ 4 styles รายงานนี้จึงเป็น **architecture review พร้อมแผนพิสูจน์** ไม่ใช่ production acceptance

**สิ่งที่เปลี่ยนในงานรีวิว:** เพิ่มรายงานนี้และลิงก์จาก README เท่านั้น แผนเดิมและโค้ดต้นทางไม่ถูกแก้ และยังไม่มีการย้าย asset/ผลิตวิดีโอ

## แหล่งอ้างอิงภายนอก

- [Playwright Clock](https://playwright.dev/docs/clock) — time control ไม่เท่ากับรับประกัน pixel determinism
- [FFmpeg loudnorm](https://ffmpeg.org/ffmpeg-filters.html#loudnorm) — measurement options และ linear/dynamic fallback
- [WhisperX alignment implementation](https://github.com/m-bain/whisperX/blob/main/whisperx/alignment.py) — default alignment languages; ตรวจ ณ วันที่รายงาน ลิงก์ main อาจเปลี่ยนภายหลัง
- [Natural Earth Terms of Use](https://www.naturalearthdata.com/about/terms-of-use/) — เงื่อนไขข้อมูลและข้อจำกัดความถูกต้อง
- [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) — นโยบาย standard tile service
