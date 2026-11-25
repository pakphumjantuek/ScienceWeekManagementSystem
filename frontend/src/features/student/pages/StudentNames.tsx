// // src/features/Student/components/StudentNames.tsx
// import { skipToken } from "@reduxjs/toolkit/query";
// import { useGetAllStudentQuery } from "../StudentApi";
// import type { Student } from "../type";

// type Props = {
//   teamID?: number;
//   maxLines?: number; // อยากบีบให้แสดงไม่เกินกี่บรรทัด (optional)
//   separator?: string; // ตัวคั่นชื่อ (default:", ")
// };

// export default function StudentNames({
//   teamID,
//   maxLines = 2,
//   separator = ", ",
// }: Props) {
//   const { data, isLoading, isError } = useGetAllStudentQuery(
//     teamID ?? skipToken,
//     {
//       // ลด re-render: ดึงเฉพาะที่ต้องใช้
//       selectFromResult: ({ data, isLoading, isError }) => ({
//         isLoading,
//         isError,
//         data: (data ?? [])
//           .map((s: Student) =>
//             `${(s.firstName ?? "").trim()} ${(s.lastName ?? "").trim()}`.trim()
//           )
//           .filter(Boolean),
//       }),
//     }
//   );

//   if (!teamID) return <span className="text-slate-400">-</span>;
//   if (isLoading) return <span className="text-slate-400">กำลังโหลด…</span>;
//   if (isError) return <span className="text-rose-600">ดึงรายชื่อไม่ได้</span>;

//   const text = (data ?? []).join(separator);
//   if (!text) return <span className="text-slate-400 italic">ไม่มีสมาชิก</span>;

//   // บีบจำนวนบรรทัด (tailwind line-clamp ถ้ามีปลั๊กอิน)
//   return (
//     <span className={`block ${maxLines ? `line-clamp-${maxLines}` : ""}`}>
//       {text}
//     </span>
//   );
// }
