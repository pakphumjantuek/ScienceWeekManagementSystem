# ระบบบริหารงานแข่งขัน Science Week (Science Week Management System)

ระบบเว็บสำหรับบริหารงานวิทยาศาสตร์และการแข่งขันทางวิชาการ ตั้งแต่เปิดรับสมัครทีม จัดสายการแข่งขัน บันทึกผลแบบเรียลไทม์ ไปจนถึงออกเกียรติบัตรและรายงานสรุป

<!-- TODO: ใส่ภาพหน้าจอ 3–4 ภาพที่นี่ (ซ่อนข้อมูลจริงของผู้ใช้ก่อน) เช่น
![หน้าหลัก](docs/screenshots/home.png)
-->

## ระบบนี้ทำอะไรได้

| กลุ่มงาน | สิ่งที่ทำได้ |
|---|---|
| **ปีและรายการแข่งขัน** | จัดการปีการแข่งขัน รายการแข่ง ระดับชั้น ประเภทการแข่ง และประเภทรางวัล |
| **ทีมและผู้เข้าแข่งขัน** | ลงทะเบียนทีม ผู้ควบคุมทีม นักเรียน โรงเรียน โครงงานของทีม และเช็กอินรายบุคคล |
| **สายการแข่งขัน** | สร้างสายแข่งแบบแพ้คัดออก จับสลาก เลื่อนรอบถัดไป บันทึกผล และ **ย้อนกลับไปยังขั้นตอนก่อนหน้าได้จากบันทึกการจับสลาก** |
| **อัปเดตผลสด** | แสดงผลการแข่งขันแบบเรียลไทม์ด้วย SignalR โดยไม่ต้องรีเฟรชหน้า |
| **เอกสาร** | ออกเกียรติบัตรทีม/รายบุคคลเป็น PDF (ใส่โลโก้และลายเซ็นได้) ใบลงชื่อ และรายงานสรุปเป็นเอกสาร Word |
| **การอบรม** | จัดการหัวข้ออบรม รับลงทะเบียน ใบลงชื่อ และเกียรติบัตรผู้เข้าอบรม |
| **เนื้อหาเว็บไซต์** | ข่าวประชาสัมพันธ์ แบนเนอร์หน้าแรก คู่มือผู้ใช้/ผู้ดูแล และหน้ารายงานสาธารณะ |
| **ผู้ใช้และตรวจสอบ** | จัดการผู้ใช้และบทบาท (admin / user) ระงับบัญชี และบันทึกประวัติการใช้งาน (Audit Log) |

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|---|---|
| **Backend** | ASP.NET Core Web API (.NET 8), Entity Framework Core 8, SQL Server, ASP.NET Core Identity, JWT, SignalR, AutoMapper, QuestPDF, OpenXML, ImageSharp, Swagger |
| **Frontend** | React 19, TypeScript 5.8, Vite 7, Redux Toolkit, MUI 7, Tailwind CSS 4, React Router 7, Recharts |

## จุดเด่นทางเทคนิค

- **ผลการแข่งขันอัปเดตสด** ผ่าน SignalR Hub (`/matchHub`) แยกกลุ่มตามระดับการแข่งขัน
- **สายการแข่งขันที่ย้อนกลับได้** เก็บบันทึกการจับสลาก (`MatchDrawLog`) เพื่อกลับไปยังรอบก่อนหน้าเมื่อกรอกผลผิด
- **สร้างเอกสารอัตโนมัติ** เกียรติบัตรเป็น PDF (QuestPDF + ImageSharp) พร้อมเลขที่เอกสารที่รันอัตโนมัติ และรายงานเป็น Word
- **ป้องกันการใช้งานเกินปกติ** มี Rate Limiting แยกตามประเภท (ล็อกอิน, งานสำคัญ, อัปโหลด) และระบบระงับบัญชี
- **ตรวจสอบย้อนหลังได้** บันทึก Audit Log ของการกระทำสำคัญ
- **โครงสร้างแบบแยกส่วน** Controller → Service → DbContext ใช้ DTO และ AutoMapper แยกจาก Entity
- **ฐานข้อมูลที่ดูแลด้วย Migration** กว่า 20 Model และกว่า 60 Migration ตลอดการพัฒนา

## โครงสร้างโปรเจกต์

```
ScienceWeekManagementSystem/
├── backend/
│   ├── ProjectScientDay2568/         Web API (Controllers, Services, Models, Hubs, Migrations)
│   └── ProjectScientDay2568.Tests/   xUnit tests
└── frontend/                         React + TypeScript (Vite)
```

## วิธีรันบนเครื่อง

**สิ่งที่ต้องมี:** .NET 8 SDK, Node.js, SQL Server (หรือ SQL Server Express) และเครื่องมือ `dotnet-ef` (`dotnet tool install --global dotnet-ef`)

### 1) Backend

```powershell
cd backend\ProjectScientDay2568

dotnet user-secrets init

# เชื่อมต่อฐานข้อมูล (ไม่เก็บไว้ในโค้ด)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=.\SQLEXPRESS;Database=ProjectScientDay;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"

# คีย์สำหรับลงนาม JWT (ตั้งเป็นข้อความยาวและเดายาก)
dotnet user-secrets set "ApiSettings:Secret" "ข้อความลับยาวอย่างน้อย 32 ตัวอักษร"

# สร้างตารางในฐานข้อมูล
dotnet ef database update

dotnet run
```

เมื่อรันแบบ Development จะมี Swagger ให้ลองเรียก API (พอร์ตตั้งไว้ใน `Properties/launchSettings.json` เช่น `https://localhost:7023`)

**สร้างผู้ดูแลระบบคนแรก:** ส่งคำขอ `POST /api/auth/register` พร้อม `"role": "admin"` ทำได้เฉพาะตอนที่ระบบยังไม่มีแอดมินเลย หลังจากนั้นการสร้างแอดมินเพิ่มต้องทำโดยผู้ดูแลระบบที่ล็อกอินอยู่ ผู้สมัครทั่วไปจะได้บทบาท `user` เสมอ

### 2) Frontend

```powershell
cd frontend
copy .env.example .env
```

แก้ `.env` ให้ `VITE_API_BASE_URL` และ `VITE_API_BASE_URLS` ชี้ไปที่ API ของคุณ แล้วรัน:

```powershell
npm install
npm run dev
```

เปิด `http://localhost:5173` (backend อนุญาต CORS จากพอร์ตนี้ไว้แล้ว)

### 3) รันเทสต์

```powershell
cd backend
dotnet test ProjectScientDay2568.Tests
```

## ผู้พัฒนา

**ภาคภูมิ จันทร์ทึก** · นักพัฒนาเว็บแอปพลิเคชัน

- GitHub: [github.com/pakphumjantuek](https://github.com/pakphumjantuek)
- อีเมล: _(ใส่อีเมลที่ต้องการให้ติดต่อ)_

> โปรเจกต์นี้พัฒนาเพื่อการเรียนรู้และแสดงผลงาน ข้อมูลตัวอย่างทั้งหมดไม่ใช่ข้อมูลจริงของผู้ใช้
