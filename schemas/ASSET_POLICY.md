# Asset & Rights Policy (Public Repo Clean-Room Boundary)

`liplnwza548/genhalipza` เป็น **Public Repository** จึงต้องแยกสิทธิ์ของโค้ดออกจากสิทธิ์ของไฟล์สื่อ (Assets) อย่างเด็ดขาด:

1. **สิ่งที่อนุญาตให้เก็บใน Public Repo (`assets/`):**
   - ฟอนต์ลิขสิทธิ์เปิด (OFL 1.1 / Apache 2.0) พร้อมไฟล์ใบอนุญาต (`OFL.txt`)
   - Fixture / Placeholder / Vector ตัวอย่างที่สร้างขึ้นเองหรือเป็น Public Domain ที่ตรวจสอบแล้วว่าเผยแพร่ได้
2. **สิ่งที่ห้ามนำเข้า Public Repo เด็ดขาด:**
   - ไฟล์ดิบของมาสคอต `LiplnwZa` และไฟล์เสียงส่วนตัวจาก `liplnwza-motion-kit` (อ้างอิง `ASSET_RIGHTS.md`)
   - โค้ด ไฟล์ หรือเทมเพลตใดๆ จากโฟลเดอร์อ้างอิงส่วนตัว (`GenhahaSkills`)
   - ไฟล์เสียงพากย์จริงของงานลูกค้า/ช่อง และ `jobs/` outputs (ถูก block ด้วย `.gitignore`)
3. **วิธีใช้งาน Owner Assets ตอนรันจริง:**
   - ระบุ `privateAssetsDir` ใน `job.json` หรือ environment variable `GENHALIPZA_PRIVATE_ASSETS` ชี้ไปยังโฟลเดอร์ส่วนตัวนอก repo
