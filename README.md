# Sound Studio

เว็บแปลงข้อความเป็นเสียงด้วย `edge-tts` ที่ใช้งานได้จากหน้าเว็บเดียว รองรับการพิมพ์ข้อความ เลือกเสียง ปรับ rate / pitch / volume และดาวน์โหลดไฟล์ `.mp3` ได้ทันที

## วิธีใช้งานในเครื่อง

1. ติดตั้งแพ็กเกจ

```bash
python -m pip install -r requirements.txt
```

2. เปิดเว็บเซิร์ฟเวอร์

```bash
uvicorn main:app --reload
```

3. เปิดเบราว์เซอร์ที่

```text
http://127.0.0.1:8000
```

## วิธีใช้หน้าเว็บ

1. พิมพ์ข้อความที่ต้องการแปลงเป็นเสียง
2. เลือกเสียงที่ต้องการจากรายการ
3. ปรับค่า `rate`, `pitch`, และ `volume` ตามต้องการ
4. กดปุ่มสร้างเสียง
5. ฟังตัวอย่าง หรือกดดาวน์โหลดไฟล์ `.mp3`

## ไฟล์สำคัญในโปรเจกต์

- [main.py](main.py) ตัว backend หลักของเว็บ
- [templates/index.html](templates/index.html) หน้าเว็บหลัก
- [static/app.js](static/app.js) logic ฝั่งหน้าเว็บ
- [static/style.css](static/style.css) สไตล์ responsive
- [render.yaml](render.yaml) ค่าพร้อม deploy บน Render
