# 💻 Science Week Frontend Project (ProjectScientDay2568)

ระบบ Frontend Web Application สำหรับงานสัปดาห์วิทยาศาสตร์ คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏกาญจนบุรี  
พัฒนาด้วย **React 19**, **TypeScript**, **Vite**, **TailwindCSS 4**, **Redux Toolkit / RTK Query**, **React Router v7**, **Material UI**, **Framer Motion** และ **SignalR**

---

## 📁 โครงสร้างโฟลเดอร์แบบละเอียด (Folder Structure)

```text
frontend/
├── public/                                # ไฟล์ Static Public (Icons, Logos, Static Assets)
├── src/                                   # ซอร์สโค้ดหลักของแอปพลิเคชัน
│   ├── Apis/                              # [API Layer - RTK Query]
│   │   ├── ApiCookies/                    # RTK Query Base Queries สำหรับ Cookie Auth
│   │   │   └── baseQuerys.ts              # BaseQuery Custom Fetching
│   │   ├── Export.ts                      # RTK Query Slices สำหรับเรียก Endpoint Export PDF/Excel
│   │   ├── baseQuery.ts                   # BaseQuery Configuration สำหรับ Bearer Token / JWT
│   │   └── index.ts                       # Export Central API Slices
│   │
│   ├── assets/                            # ไฟล์ Media/SVG ภายในโปรเจกต์
│   │   └── react.svg
│   │
│   ├── Common/                            # [Constants & Static Data]
│   │   └── SD.ts                          # Static Details (คำนำหน้าชื่อ, สถานะทีม, Enums)
│   │
│   ├── components/                        # [Reusable UI Components]
│   │   ├── admin/                         # คอมโพเนนต์เฉพาะ Admin
│   │   │   └── AdminCrudTable.tsx         # ตารางแสดงและจัดการข้อมูล CRUD อเนกประสงค์
│   │   ├── modals/                        # ระบบ Modal ส่วนกลาง
│   │   │   ├── GlobalModal.tsx            # คอมโพเนนต์ Render Modal หลัก
│   │   │   └── ModalContext.tsx           # React Context จัดการสถานะเปิด-ปิด Modal
│   │   ├── CascadingSchoolPicker.tsx      # ตัวเลือกระดับโรงเรียนแบบดรอปดาวน์ต่อเนื่อง (จังหวัด > อำเภอ > ตำบล)
│   │   ├── Footer.tsx                     # แถบด้านล่างเว็บไซต์ (Footer Component)
│   │   ├── Loading.tsx                    # คอมโพเนนต์แสดงสถานะกำลังโหลด
│   │   ├── Navbar.tsx                     # แถบเมนูด้านบนสำหรับผู้ใช้ทั่วไป
│   │   ├── NavMenu.tsx                    # แถบเมนู Side Navigation สำหรับ Admin
│   │   ├── StaffNavMenu.tsx               # แถบเมนู Side Navigation สำหรับ Staff
│   │   ├── NotFound.tsx                   # หน้า 404 Page Not Found
│   │   ├── SchoolSearchField.tsx          # ช่องค้นหาชื่อโรงเรียนแบบ Auto-complete
│   │   ├── ScrollToTop.tsx                # ออโต้สโครลขึ้นบนสุดเมื่อเปลี่ยนหน้า
│   │   ├── useFilteredData.tsx            # Custom Hook กรองข้อมูลค้นหา
│   │   └── index.ts                       # Export Components
│   │
│   ├── features/                          # [Feature Modules & Pages] (23 ฟีเจอร์หลัก)
│   │   ├── Auth/                          # ระบบเข้าสู่ระบบ/สมัครสมาชิก/รีเซ็ตรหัสผ่าน
│   │   │   └── Pages/ (Login, Register, ResetPassword)
│   │   ├── AuthCookie/                    # หน้า Authentication รูปแบบ Cookie
│   │   │   └── page/ (Homes, LoginPage, RegisterPage, Secure)
│   │   ├── Competition/                   # จัดการรายการการแข่งขันหลัก
│   │   ├── CompetitionLevel/              # จัดการระดับการแข่งขันย่อย และผลแข่งขัน
│   │   ├── CompetitionType/               # จัดการประเภทการแข่งขัน (ประกวดโครงงาน/ตอบปัญหา ฯลฯ)
│   │   ├── CompetitionYear/               # จัดการการแข่งขันประจำปี
│   │   ├── EducationLevel/                # จัดการระดับการศึกษา (ประถม/ม.ต้น/ม.ปลาย)
│   │   ├── HomeConfig/                    # จัดการหน้าแรกและกำหนดการ
│   │   │   └── page/ (HomePage, EventSchedulePage, HomeBannersPage)
│   │   ├── Match/                         # ระบบสายการแข่งขัน ผลแข่งสด (Real-time Bracket)
│   │   │   └── pages/ (MatchTabs, MatchTabsRov, MatchUserList, MatchResultList)
│   │   ├── News/                          # ข่าวประชาสัมพันธ์และกิจกรรม
│   │   │   └── pages/ (NewsList, NewsFormPage, NewListUser, NewListDetail)
│   │   ├── PublicReport/                  # รายงานและสถิติผู้สมัครแบบเปิดเผยสาธารณะ
│   │   │   └── pages/ (PublicReportYearsPage, PublicReportCompetitionSummaryPage ฯลฯ)
│   │   ├── Report/                        # รายงานสรุปผลสถิติสำหรับแอดมิน (Report Dashboard)
│   │   ├── RewardType/                    # จัดการประเภทรางวัล
│   │   ├── Role/                          # จัดการสิทธิ์การใช้งาน (Roles)
│   │   ├── School/                        # จัดการข้อมูลโรงเรียน/สถานศึกษา
│   │   ├── Staff/                         # ฟังก์ชันเฉพาะสำหรับ Staff กรรมการสนาม
│   │   ├── Team/                          # สมัครแข่งขัน จัดการทีม ตรวจสอบสถานะทีม
│   │   │   └── pages/ (TeamRegisterList, TeamFormPage, TeamPlayersPage, TeamStatus, TeamRovList)
│   │   ├── TeamProject/                   # อัปโหลด/ดูไฟล์เอกสารโครงงาน PDF
│   │   ├── UserAdmin/                     # จัดการข้อมูลผู้ใช้งานระบบสำหรับ Admin
│   │   ├── Year/                          # จัดการปีการแข่งขัน คัดลอกข้อมูลปี
│   │   │   └── pages/ (YearList, YearFormPage, YearUserList, YearResults)
│   │   ├── setting/                       # ตั้งค่าระบบ ธีมสี การอัปโหลดพื้นหลังเกียรติบัตร
│   │   │   ├── pages/ (SystemSettingsPage, UploadBackgroundYear)
│   │   │   └── systemSettingsApi.ts
│   │   ├── student/                       # จัดการข้อมูลนักเรียนผู้เข้าร่วมแข่งขัน
│   │   ├── training/                      # ระบบการอบรม/เวิร์กช็อปสาขาวิชา
│   │   │   └── pages/ (TrainingTopicsListPage, MyRegistrationsPage, AdminTrainingTopicsPage ฯลฯ)
│   │   └── index.ts                       # Export Central Features
│   │
│   ├── HOC/                               # [Higher-Order Components] ป้องกันการเข้าถึงหน้าตามสิทธิ์
│   │   ├── withAuth.tsx                   # ป้องกันหน้าสำหรับผู้ลงทะเบียน
│   │   ├── withAdminAuth.tsx              # ป้องกันหน้าเฉพาะ Administrator
│   │   └── withStaffAuth.tsx              # ป้องกันหน้าเฉพาะ Staff
│   │
│   ├── Interface/                         # [TypeScript Interfaces]
│   │   ├── apiResponse.ts                 # โครงสร้าง API Response Standard
│   │   └── index.ts
│   │
│   ├── Pages/                             # [General Pages]
│   │   ├── AccessDenied.tsx               # หน้าแจ้งเตือนไม่มีสิทธิ์เข้าถึง (403)
│   │   ├── Homepage.tsx                   # หน้าหลักสำรอง
│   │   └── index.ts
│   │
│   ├── Redux/                             # [State Management]
│   │   ├── store.ts                       # Redux Store Central Config (รวม RTK Query Reducers)
│   │   └── userAuthSlice.ts               # Redux Slice เก็บข้อมูล User Session & JWT Tokens
│   │
│   ├── utils/                             # [Utility Functions] ฟังก์ชันช่วยเหลือทั่วไป
│   │
│   ├── App.tsx                            # [App Root & Router Config] จัดการ Routing, Guards & Layout
│   ├── App.css                            # Styling สไตล์เฉพาะ App
│   ├── config.ts                          # Configuration ตั้งค่า API Base URL
│   ├── index.css                          # Global CSS (TailwindCSS Directive Config)
│   ├── main.tsx                           # จุดเริ่มต้น React (ReactDOM Render, Provider Wrappers)
│   └── vite-env.d.ts                      # Vite TypeScript Types Declaration
│
├── .env                                   # ไฟล์เก็บตัวแปรขอบเขตสภาพแวดล้อม (Environment Variables)
├── eslint.config.js                       # ตั้งค่า Code Quality Tool (ESLint)
├── index.html                             # ไฟล์ HTML เริ่มต้นของ Single Page Application (SPA)
├── package.json                           # ไฟล์ระบุ Dependencies และ Scripts ของโปรเจกต์
├── tailwind.config.js                     # การตั้งค่า Custom Theme / CSS Utility ของ TailwindCSS
├── tsconfig.json / tsconfig.app.json      # การตั้งค่า TypeScript Compiler
└── vite.config.ts                         # การตั้งค่าการ Build และ Plugins ของ Vite
```

---

## 🌟 คุณสมบัติและฟังก์ชันการทำงานหลัก (Key Features)

### 1. 👥 ระบบสำหรับผู้สมัครและบุคคลทั่วไป (Public & User Portal)
- **หน้าหลัก & กำหนดการ (Homepage & Schedule):** แสดงข้อมูลงานสัปดาห์วิทยาศาสตร์ สไลด์แบนเนอร์ ข่าวประชาสัมพันธ์ ข้อมูลปีการแข่งขันปัจจุบัน และกำหนดการกิจกรรม
- **สมัครเข้าแข่งขัน (Team & Individual Registration):**
  - สมัครแข่งขันตามรายการและระดับการศึกษา (ประถม/ม.ต้น/ม.ปลาย)
  - ค้นหาและเลือกโรงเรียนอย่างสะดวกด้วย **Cascading School Picker** (จังหวัด > อำเภอ > ตำบล)
  - เพิ่ม/จัดการข้อมูลนักเรียนผู้เข้าแข่งขัน (ตัวจริง/ตัวสำรอง) และครูผู้ดูแล
  - รองรับการสมัครแข่งเกม E-Sports (เช่น ROV) พร้อมฟิลด์ระบุชื่อในเกม (In-game Name)
- **จัดการเอกสารโครงงาน (Project File Upload):** อัปโหลดและตรวจสอบไฟล์เอกสารโครงงานรูปแบบ PDF
- **ตรวจสอบสถานะและผลการแข่งขัน (Match Bracket & Results):**
  - ตารางสายการแข่งขัน Real-time Tournament Bracket
  - ตรวจสอบผลการประกวดและคะแนนแข่งขัน
- **อบรม & เวิร์กช็อปสาขาวิชา (Training & Workshops):**
  - ค้นหาและสมัครเข้าร่วมโครงการอบรมของแต่ละสาขาวิชา (คอมพิวเตอร์, ฟิสิกส์, เคมี, ชีววิทยา ฯลฯ)
  - ดูประวัติการลงทะเบียนอบรมของตนเอง (`My Registrations`)
- **รายงานสถิติสาธารณะ (Public Applicants Report):** ดูยอดผู้สมัคร สรุปสถิติตามโรงเรียนและตามระดับการศึกษาแบบเรียลไทม์

### 2. 🛡️ ระบบสำหรับผู้ดูแลระบบ (Admin Portal - `/admin`)
- **Dashboard & Reports:** แดชบอร์ดแสดงกราฟและสถิติยอดผู้สมัคร แยกรอบการแข่งขัน และส่งออกรายงาน (Export Excel / PDF / ZIP)
- **จัดการโครงสร้างการแข่งขัน (Competition Management):**
  - จัดการปีการแข่งขัน (`Year Management`) และระบบ **Clone ปีการแข่งขัน** เพื่อคัดลอกรายการแข่งขันจากปีเก่ามาปีใหม่ได้สะดวก
  - จัดการรายการแข่งขัน (`Competitions`), ประเภทการแข่งขัน (`Competition Types`), ระดับการแข่งขัน (`Competition Levels`), ระดับการศึกษา (`Education Levels`) และประเภทรางวัล (`Reward Types`)
- **จัดการทีมและอนุมัติ (Team Management & Approval):**
  - ตรวจสอบรายชื่อทีม ค้นหา ตรวจสอบเอกสาร PDF ของทีม และเปลี่ยนสถานะทีม (`Approved`, `Pending`, `Rejected`)
  - ตรวจสอบและพิมพ์รายชื่อนักเรียน/ครูที่ปรึกษา
- **ระบบจับคู่แข่งขัน (Tournament Match Bracket Engine):**
  - จัดสายการแข่งขัน สุ่มจับคู่แข่งขัน บันทึกผลการแข่งขันแต่ละรอบ ทั้งแบบแมตช์ทั่วไปและสายแข่ง ROV
- **จัดการเกียรติบัตร (Certificate Configuration):**
  - ตั้งค่าแม่แบบเกียรติบัตรประจำปี, เลขรันเริ่มต้น, ลายเซ็นผู้ลงนาม (อธิการบดี / คณบดี), โลโก้ และอัปโหลดภาพพื้นหลังใบประกาศนียบัตร
- **ตั้งค่าระบบ & หน้าเว็บ (System & Homepage Customization):**
  - ปรับแต่งข้อความ Hero Title, สวิตช์เปิด-ปิดเมนูต่างๆ, อัปโหลดสไลด์แบนเนอร์ และเลือกธีมสีระบบ (เช่น `emerald`)
- **จัดการอบรม & สาขาวิชา (Training Topics & Branches):**
  - เพิ่ม/แก้ไขหัวข้ออบรม กำหนดจำนวนผู้สมัครสูงสุด สถานที่ เวลา และตรวจสอบรายชื่อผู้ลงทะเบียนอบรม
- **จัดการผู้ใช้และสิทธิ์ (User & Role Management):**
  - เพิ่ม/แก้ไข/ลบ ผู้ใช้งานระบบ และการกำหนดสิทธิ์ผู้ใช้งาน (`Admin`, `Staff`, `User`)

### 3. 👔 ระบบสำหรับกรรมการ/เจ้าหน้าที่สนาม (Staff Portal - `/staff`)
- **เช็คอินเข้างาน (Fast Check-in):** สแกน/เช็คอินผู้เข้าแข่งขันและทีมงานในวันจัดกิจกรรม
- **บันทึกผลแข่งสด (Match Score Input):** อัปเดตผลการแข่งขันและทีมชนะเลิศรายสนามแบบ Real-time

---

## 🛠️ เทคโนโลยีและไลบรารีที่ใช้ (Tech Stack & Libraries)

| หมวดหมู่ | เทคโนโลยี / 라이브러리 |
|---|---|
| **Core Framework** | React 19, TypeScript, Vite 7 |
| **Routing** | React Router v7 (`react-router-dom`) |
| **State Management & Data Fetching** | Redux Toolkit (`@reduxjs/toolkit`), React Redux, RTK Query |
| **UI Components & Styling** | TailwindCSS 4 (`@tailwindcss/vite`), Material UI (`@mui/material`), Emotion |
| **Animations & Icons** | Framer Motion, Lucide React (`lucide-react`), React Icons |
| **Real-time Communication** | SignalR Core Client (`@microsoft/signalr`) |
| **Forms & Validation** | Formik, Yup |
| **Notification & Alerts** | SweetAlert2, React Toastify (`react-toastify`) |
| **Data Export & Charts** | Recharts, SheetJS (`xlsx`) |

---

## ⚙️ การติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. กำหนดตัวแปร Environment (`.env`)
สร้างหรือแก้ไขไฟล์ `.env` ในโฟลเดอร์ `frontend`:
```env
VITE_API_BASE_URL=https://localhost:7001/api
```

### 3. รันโปรเจกต์ในโหมดพัฒนา (Development Mode)
```bash
npm run dev
```
แอปพลิเคชันจะเปิดทำงานที่ `http://localhost:5173` (หรือตามพอร์ตที่ Vite กำหนด)

---

## 📜 คำสั่ง Scripts ที่สำคัญ

- `npm run dev` : เริ่มรัน Dev Server ด้วย Vite
- `npm run build` : ตรวจสอบความถูกต้องของ TypeScript (`tsc -b`) แล้วทำการ Build สำหรับ Production
- `npm run preview` : ทดสอบเปิดเล่นไฟล์ Build Production ในเครื่องท้องถิ่น
- `npm run lint` : ตรวจสอบคุณภาพโค้ดด้วย ESLint
