# GenhaLipza — Private Owner Assets (ของส่วนตัว ห้ามขึ้น repo)

> **กฎเหล็ก:** โฟลเดอร์ `private_assets/` (และ `owner_assets/`) อยู่ใน `.gitignore`
> แล้ว — ไฟล์เสียงโคลนกับภาพมาสคอตตัวจริงของ Philip ต้องอยู่ที่นี่เท่านั้น
> **ห้าม `git add` ห้ามอัปโหลดลง repo สาธารณะเด็ดขาด** ตรวจ `git status`
> ทุกครั้งก่อน commit ว่าไม่มีไฟล์ในนี้หลุดเข้าไป

## โครงที่ pipeline คาดหวัง

```
private_assets/
  voice/
    mvp-mascot-15s-philip.wav        # เสียงโคลน บท 3 เทคนิคประหยัดไฟ (timeline 15.0 วิ)
    wonlok-kra-canal-philip.wav      # เสียงโคลน บทช่องแคบมะละกา/Landbridge (timeline 30.0 วิ)
  poses/
    explain.png       point_right.png   point_left.png
    thinking.png      thumbs_up.png     magnify.png
  mouth_rig/
    A.png   E.png   I.png   O.png   U.png   REST.png
```

- เสียง: `job.audio.sourcePath` ใน `job.json` ชี้มาที่นี่ (เช่น
  `private_assets/voice/mvp-mascot-15s-philip.wav`) pipeline จะ normalize
  เป็น 48kHz mono, เติมความเงียบให้ครบความยาว timeline, แล้วมิกซ์ SFX + BGM
  ที่ duck ใต้เสียงพูดให้เอง
- มาสคอต: `job.privateAssetsDir: "private_assets"` (หรือ env
  `GENHALIPZA_PRIVATE_ASSETS` แบบ absolute path) pipeline อ่าน
  `poses/*.png` กับ `mouth_rig/*.png` แล้วส่งเข้า rig เป็นภาพตัวจริง
  ถ้าไม่มีภาพส่วนตัว rig จะวาดตัวสำรองจากโค้ด — **ตัวสำรองไม่ใช่มาสคอต
  ของ Philip ห้ามนำเสนอว่าเป็นตัวจริง**

## ชื่อท่าที่ rig ใช้ (ดู `core/rig/mascot-rig.mjs`)

ท่าจากบทจะถูกแปลงชื่อก่อน: `welcome`/`idle` → `explain`,
`point_up` → `point_right`, `excited` → `thumbs_up` ที่เหลือใช้ชื่อตรงๆ
(`explain`, `point_right`, `point_left`, `thinking`, `thumbs_up`, `magnify`)
ปากใช้ชื่อ viseme ตรงๆ: `A`, `E`, `I`, `O`, `U`, `REST`

## บทที่ต้องพากย์ (เสียงโคลน VoxCPM2 สร้างบน Colab)

### `mvp-mascot-15s-philip.wav` — timeline 15.0 วิ (3 ประโยค)

1. (0.3–4.7 วิ) "หน้าร้อนนี้มาลดค่าไฟแบบง่ายๆ กันครับ"
2. (5.2–9.7 วิ) "แค่ตั้งแอร์ 26 องศาคู่กับพัดลมก็ประหยัดถึง 15%"
3. (10.2–14.6 วิ) "อย่าลืมล้างแผ่นกรองและถอดปลั๊กที่ไม่ใช้ด้วยนะครับ"

### `wonlok-kra-canal-philip.wav` — timeline 30.0 วิ (6 ประโยค)

1. (0.5–5.0 วิ) "ช่องแคบมะละกาคือเส้นทางเดินเรือที่หนาแน่นที่สุด"
2. (5.2–9.6 วิ) "เรือขนส่งนับแสนลำต้องผ่านจุดนี้ทุกปี"
3. (10.4–15.0 วิ) "ไทยจึงผลักดันโครงการ Landbridge ระนอง-ชุมพร"
4. (15.3–19.6 วิ) "เชื่อมฝั่งอันดามันสู่อ่าวไทยโดยตรง"
5. (20.4–25.0 วิ) "ช่วยย่นระยะทางอ้อมแหลมมลายูกว่าพันกิโลเมตร"
6. (25.3–29.5 วิ) "ปั้นไทยเป็นฮับโลจิสติกส์ใหม่ของภูมิภาค"

**ข้อสำคัญ:** เสียงที่เจนต้องพูดตามบทนี้เป๊ะๆ ถ้าเสียงยาวกว่า timeline
(15.0 / 30.0 วิ) pipeline จะหยุดพร้อมบอกให้ re-time `cues.json` ให้ตรง
เสียงจริงก่อน — ห้ามยืด/หดเสียงเองให้พอดีโดยไม่แก้ cues

## สถานะของที่มีอยู่ (ตรวจ 2026-11-15 — branch `fix/locked-decisions`)

- **เสียงโคลนของ 2 บทนี้: ยังไม่มีเลย** ค้นทั้ง workspace แล้ว มีแค่
  `voices/philip/ref_prompt.wav` (เสียงต้นแบบสั้นๆ ไว้อ้างอิง) กับไฟล์
  ทดสอบเสียงบทอื่น — ใช้แทนบทนี้ไม่ได้ ต้องเจนใหม่บน Colab
- **ภาพท่ามาสคอตตามชื่อที่ rig ต้องการ: ยังไม่มีเลย** ของที่มีอยู่คือ
  ภาพต้นแบบตัวเดียว `master-lipinwza.png` (1448×1086) กับภาพท่า
  `pose-closed/open/point/fullbody/wide.png` (5 ภาพ ชื่อไม่ตรง rig) และ
  แผ่นปาก 3 แผ่น (`patch-smile/thinking/excited-mouth`) — ยังขาดท่า
  6 ท่าตามชื่อ rig และแผ่นปาก 6 แบบ (`A/E/I/O/U/REST`)
  **ต้องเตรียมภาพท่า+แผ่นปากใหม่จากภาพต้นแบบก่อนเรนเดอร์มาสคอตตัวจริง**
- **ตำแหน่งแผ่นปากยังไม่ได้ตรวจจริง:** rig วาดแผ่นปากที่กึ่งกลางภาพท่า
  สูงจากฐาน 62% ของความสูงภาพ — ถ้าภาพท่าที่เตรียมมาใหม่วางปากไม่ตรง
  จุดนี้ ต้องปรับค่าใน `core/rig/mascot-rig.mjs` ตอนตรวจภาพจริง
