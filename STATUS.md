# GenhaLipza — สถานะสำหรับรับช่วง

อัปเดต: 15 พฤศจิกายน 2026 (Asia/Bangkok)

## สถานะปัจจุบัน

**Architecture Review Completed — Plan Revision Pending**

รีวิวแผนตามคำถามทั้ง 5 ข้อแล้ว พร้อมตรวจ source files ที่เกี่ยวข้องใน repo เดิม ข้อเสนอคือให้พิสูจน์คลิป 10 วินาทีหนึ่งสไตล์ให้ครบ 5 ด่านก่อนขยาย ยังไม่ได้เริ่มพัฒนา Phase 0 หรือรับรอง production

- [ผลรีวิวฉบับหลัก](docs/CHATGPT_REVIEW_2026-11-15.md)
- [แผนต้นฉบับ](docs/MASTER_PLAN.md)
- [โจทย์ที่ใช้รีวิว](docs/REVIEW_GUIDE_FOR_CHATGPT.md)

Baseline ที่รีวิว: `05565541b1a7457c21ff3ec17e99d0680e26457d` มีเอกสาร 3 ไฟล์ ยังไม่มี implementation ใน revision นั้น รายงานและ README ถูกเพิ่ม/อัปเดตใน `3bbde5b2669afa6e4abedec1181359b0fcb87b86` และ `cc1aa68eb6e27809f1d5223695fe7b8207fde8ec` ตามประวัติโครงการ สรุปนี้ยึดรายงานฉบับหลัก ไม่ตั้งแผนพัฒนาคู่ขนาน

## ข้อสรุปจากการรีวิว

| ประเด็น | ผลตรวจและสิ่งที่ต้องทำ |
| --- | --- |
| Node + Python | ใช้ได้ในเชิงออกแบบ ให้ Node คุม timeline/render และเรียก Python เฉพาะงานเสียง/QC ผ่านข้อมูลที่มีสัญญาชัด |
| Reuse 65–70% | ยังยืนยันไม่ได้ renderer เดิมมี absolute paths/URL เก่า ต้องทำ reuse matrix และ smoke test รายเส้นทาง |
| Doctor | ตรวจ prerequisites ไม่ได้พิสูจน์ว่าเปิด browser วาดไทยและผลิต MP4 สำเร็จ |
| Raw mascot / เสียง | ตรวจสิทธิ์แยกรายไฟล์จาก license โค้ด เก็บของจริงส่วนตัวและใช้ fixture ที่เผยแพร่ได้ใน public repo |
| Thai alignment | โค้ดเดิมต้องมี model/บท/ข้อมูลตั้งต้น; viseme แบบ heuristic ไม่ใช่หลักฐานว่าปากตรงเสียง |
| Preview 3/15 วินาที | ยังไม่มี benchmark ของระบบใหม่ ต้องระบุ VM, resolution, จำนวนภาพและ warm/cold |
| Gate / cache / resume | ผูกการอนุมัติกับ artifact version และ dependencies; แก้งานแล้วห้ามใช้ approval หรือ frame เก่าที่ไม่ตรงต่อ |
| คุณภาพ 100% / 100+ styles | แปลงเป็นเกณฑ์ตรวจรับและตัวอย่างคลิปจริงก่อนขยาย จำนวน preset ไม่ใช่หลักฐานคุณภาพ |

แหล่งอ้างอิงแบบ pin commit และวิธีจัดการแต่ละความเสี่ยงอยู่ในรายงาน ไม่ใช่การตรวจสิทธิ์หรือ runtime ของสอง repo เดิมครบทั้งระบบ

## ลำดับงานที่รายงานเสนอ

| ระยะ | งานหลัก | หลักฐานก่อนเดินต่อ |
| --- | --- | --- |
| Pre-work | ปรับแผนให้แยกเป้าหมาย/ข้อพิสูจน์/สิ่งยังไม่ทดสอบ; reuse/rights matrix; เลือก Linux VM หลัก | ขอบเขตและทรัพยากรตั้งต้นชัด ไม่มี asset ที่ยังไม่อนุญาตลง public |
| Phase 0A | Contracts + capability proof: doctor, dependencies, job/timeline/state, font fixture | วาดไทยหนึ่งเฟรมและ mux เสียงได้บน VM เป้าหมาย พร้อม versions/logs |
| Phase 0B | คลิป 10s, vector map/route 1–2 ซีน, 9:16, 30fps, Audio-In + cues ตรวจแล้ว, ครบ G1–G5 | 1080×1920/300 เฟรม, H.264/AAC, QC และ Philip ตรวจภาพ/เสียง |
| Phase 1 | Thai wrapping, Gate 3/4, invalidation, resume/scene patch และ benchmark | Preview ตรง final; restart/แก้ซีนแล้วไม่ใช้ของเก่า; มีตัวเลขเวลาจริง |
| Phase 2 | wonlok-plus จำกัดขอบเขต 30–60s แล้วเพิ่ม mascot → stickman-duo → mystery-stage ทีละตัว | คลิปต่างหัวข้ออย่างน้อย 3 คลิปสำหรับสไตล์แรก และ sample/owner review ของแต่ละสไตล์ |
| Phase 3–4 | Factory/presets, aspects เพิ่ม และ platform exporter | Fixtures/compatibility และทดลองติดตั้ง+รันจริงตามแพลตฟอร์ม |

นี่เป็นข้อเสนอจากรีวิว ยังไม่ได้แทนที่ข้อกำหนดที่ Philip ล็อกไว้ใน Master Plan โดยอัตโนมัติ การเพิ่มมาสคอต/ลิปซิงค์อยู่ภายหลัง proof แรกตามลำดับในรายงานฉบับหลัก

## เกณฑ์ตรวจรับที่ต้องระบุก่อนเริ่ม Phase 0B

- Clean checkout บน VM เป้าหมายรันตามคู่มือได้ มี versions/logs/artifact hashes
- Final video ตรงขนาด/fps/frame count/codec; ตรวจ video duration แยกจาก AAC padding และ decode ไม่มี error
- ซับไทยไม่ซ้อน ไม่ตัดสระ/วรรณยุกต์; profile เริ่มต้นเสนอ min cue 0.6s; ข้อความไม่ล้นและอ่านทัน
- Gate 4 กับ final แสดง layout เดียวกันที่ frame index เดียวกัน; การเทียบ H.264 ใช้ tolerance สำหรับ lossy encode
- คงข้อเสนอ audio profile ของแผนนี้: final -16±0.5 LUFS / TP≤-1 dBTP วัดจาก MP4 หลัง encode ไม่ดึงค่าโปรเจกต์อื่นมาแทนเอง
- ทดสอบ stale approval, missing asset, interrupted render/resume, font change, scene patch และ low-disk ตามขอบเขตที่ตกลง
- Automated QC และการตรวจรับโดย Philip เป็นคนละผล ต้องมีทั้งสองส่วน

ตัวเลขข้างต้นเป็นเกณฑ์ที่เสนอ ไม่ใช่ผลทดสอบที่รันผ่านแล้ว ดูรายละเอียดและข้อจำกัดในรายงาน

## ขอบเขตการตรวจและงานรอบนี้

อ่านแผนทั้ง 3 ไฟล์ และตรวจรายการไฟล์/โค้ด/สิทธิ์ที่เกี่ยวข้องใน motion-kit และ motionforge พร้อมเอกสารทางการของเครื่องมือ ผลสำคัญในรายงานสอดคล้องกับการตรวจไฟล์ต้นทางรอบนี้

ยังไม่ได้ติดตั้ง dependencies, รัน engine/tests, benchmark VM, ฟังเสียงหรือดู MP4 จึงยังไม่มี production acceptance; MASTER_PLAN และ REVIEW_GUIDE เดิมคงไว้เป็นต้นฉบับ

งานเพิ่มในรอบสรุปนี้คือ STATUS.md และลิงก์จาก README โดยยึดรายงาน CHATGPT_REVIEW_2026-11-15.md ที่มีอยู่แล้วเป็นฉบับหลัก

## Next action

ปรับ MASTER_PLAN ตามข้อเสนอที่ Philip เลือก แล้วเตรียม reuse/rights matrix และ Phase 0A บน VM หลักหนึ่งแห่ง ผู้ลงมือควรอ่านรายงานก่อนประเมินเวลา และประเมิน Phase 0B จากผล frame smoke จริง
