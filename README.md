# Sound Studio

เว็บ TTS ด้วย `edge-tts` สำหรับพิมพ์ข้อความ เลือกเสียง ปรับค่าเสียง แล้วดาวน์โหลดไฟล์ mp3 ได้จากหน้าเว็บเดียว

## รันในเครื่อง

```bash
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

เปิด `http://127.0.0.1:8000`

## โครงสร้าง API

- `GET /` หน้าเว็บหลัก
- `GET /api/voices` รายการเสียงจาก edge-tts
- `POST /api/tts` สร้างไฟล์เสียง mp3
- `GET /downloads/{filename}` ดาวน์โหลดไฟล์ที่สร้างแล้ว

## อัปขึ้น GitHub

ถ้าต้องการใช้รีโมตที่ให้มา:

```bash
git remote add origin https://github.com/CMEBOOST/Sound.git
git add .
git commit -m "Build responsive edge-tts web app"
git push -u origin main
```

## ดีพลอยฟรี

ตัวอย่างที่ง่ายสุดคือ Render เพราะโปรเจกต์มี `render.yaml` ให้แล้ว

1. สร้างเว็บใหม่บน Render จาก GitHub repo นี้
2. ให้ใช้ค่าใน `render.yaml`
3. Deploy แล้วเปิด URL ที่ Render สร้างให้

ถ้าต้องการ ผมช่วยจัดเวอร์ชันสำหรับ Vercel, Railway, Fly.io หรือ GitHub Pages แบบแยกหน้า frontend ให้ได้ แต่แบบนี้ backend Python จะเหมาะกับ Render มากกว่า
