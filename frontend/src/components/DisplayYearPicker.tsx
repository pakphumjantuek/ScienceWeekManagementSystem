import { HiOutlineCalendar } from "react-icons/hi";
import Swal from "sweetalert2";
import { useGetAllYearQuery } from "../features/Year/YearApi";
import { useGetSystemSettingsQuery, useSetDisplayYearMutation } from "../features/setting/systemSettingsApi";
import { showError } from "../utils/confirmDelete";

/**
 * ปีที่แสดงบนหน้าเว็บ (หน้าแรก / กิจกรรมการอบรม) บนแถบหัวของแอดมิน
 * - แอดมิน: เปลี่ยนได้เลย (ถามยืนยันก่อน)
 * - เจ้าหน้าที่: ดูอย่างเดียว
 */
const DisplayYearPicker = ({ editable }: { editable: boolean }) => {
  const { data: settings, isLoading } = useGetSystemSettingsQuery();
  const { data: years = [] } = useGetAllYearQuery();
  const [setDisplayYear, { isLoading: saving }] = useSetDisplayYearMutation();

  if (isLoading) return null;

  const sorted = [...years].sort((a, b) => b.yearNumber - a.yearNumber);
  const currentId = settings?.homeDisplayYearId;
  const current = sorted.find((y) => y.yearID === currentId);
  // แสดงเป็น "พ.ศ. 2569" สั้น ๆ (ชื่อปีเต็มยาวเกินไปสำหรับแถบหัว)
  const labelOf = (y: (typeof sorted)[number]) => `พ.ศ. ${y.yearNumber}`;
  // มีปีที่ใหม่กว่าปีที่ใช้อยู่ = อาจลืมเปลี่ยน
  const newer = current && sorted[0] && sorted[0].yearNumber > current.yearNumber ? sorted[0] : undefined;

  const tone = !current
    ? "border-rose-300 bg-rose-50 text-rose-700"
    : newer
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : "border-emerald-300 bg-emerald-50 text-emerald-800";
  const hint = !current
    ? "ยังไม่ได้เลือกปีที่แสดงบนหน้าเว็บ"
    : newer
      ? `มีปี ${labelOf(newer)} แล้ว แต่หน้าเว็บยังแสดงปี ${labelOf(current)}`
      : "ปีที่แสดงบนหน้าแรกและหน้ากิจกรรมการอบรม";

  const handleChange = async (value: string) => {
    const target = sorted.find((y) => String(y.yearID) === value);
    if (!target) return;
    const r = await Swal.fire({
      title: `เปลี่ยนเป็นปี ${labelOf(target)}?`,
      text: "หน้าแรกและหน้ากิจกรรมการอบรมจะแสดงข้อมูลของปีนี้ทันที",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "เปลี่ยนปี",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#059669",
    });
    if (!r.isConfirmed) return;
    try {
      await setDisplayYear(target.yearID!).unwrap();
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || "เปลี่ยนปีไม่สำเร็จ");
    }
  };

  return (
    <label
      title={hint}
      className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm font-semibold transition ${tone} ${
        editable ? "cursor-pointer hover:shadow-sm" : ""
      }`}
    >
      <HiOutlineCalendar className="h-5 w-5 flex-shrink-0" />
      <span className="hidden flex-col leading-tight lg:flex">
        <span className="text-[11px] font-medium opacity-80">ปีที่แสดงบนเว็บ</span>
        {!editable && <span>{current ? labelOf(current) : "ยังไม่ได้เลือก"}</span>}
      </span>
      {editable ? (
        <select
          value={currentId ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          disabled={saving}
          aria-label="ปีที่แสดงบนหน้าเว็บ"
          className="cursor-pointer bg-transparent py-1 pr-1 font-bold outline-none disabled:opacity-60"
        >
          {!current && <option value="">— เลือกปี —</option>}
          {sorted.map((y) => (
            <option key={y.yearID} value={y.yearID} title={y.yearName}>
              {labelOf(y)}
            </option>
          ))}
        </select>
      ) : (
        <span className="lg:hidden">{current ? labelOf(current) : "—"}</span>
      )}
      {newer && <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-amber-500" aria-hidden />}
    </label>
  );
};

export default DisplayYearPicker;
