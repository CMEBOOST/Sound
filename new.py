import asyncio
import edge_tts

# กำหนดข้อความ
TEXT = "ฮ่า ๆ ๆ! เต่าเอ๋ย เดินแบบนั้นเมื่อไหร่จะถึงเส้นชัยกันล่ะ!"

# กำหนดเสียงภาษาไทย
VOICE_MALE = "th-TH-NiwatNeural"       # เสียงผู้ชาย (นิวัฒน์)
VOICE_FEMALE = "th-TH-PremwadeeNeural" # เสียงผู้หญิง (เปรมวดี)

OUTPUT_FILE = "hello_boost.mp3"

async def main():
    print(f"กำลังสร้างไฟล์เสียงด้วยเสียง: {VOICE_MALE}")
    
    # สร้างออบเจ็กต์ Communicate โดยส่งข้อความและชื่อเสียงเข้าไป
    communicate = edge_tts.Communicate(TEXT, VOICE_FEMALE)
    
    # สั่งให้บันทึกไฟล์ (ต้องมี await เพราะเป็น async)
    await communicate.save(OUTPUT_FILE)
    
    print(f"บันทึกไฟล์ {OUTPUT_FILE} เรียบร้อยแล้ว!")

# คำสั่งรันฟังก์ชัน async
if __name__ == "__main__":
    asyncio.run(main())