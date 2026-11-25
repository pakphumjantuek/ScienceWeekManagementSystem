import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { th } from "react-day-picker/locale";
import { format } from "date-fns";
import { CalendarDays, Clock, X } from "lucide-react";
import "react-day-picker/style.css";

// ===== ค่าที่รับ/ส่ง: วันที่ "yyyy-MM-dd", เวลา "HH:mm" (รูปแบบเดียวกับ <input type="date|time">) =====

const pad = (n: number) => String(n).padStart(2, "0");
const toDate = (v?: string) => {
  if (!v) return undefined;
  const [y, m, d] = v.substring(0, 10).split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};
const toValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/** "2026-11-15" → "15 พ.ย. 2569" */
export const formatThaiShort = (v?: string) => {
  const d = toDate(v);
  return d ? `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}` : "";
};

const triggerClass = (invalid?: boolean, open?: boolean) =>
  `flex w-full items-center gap-2 rounded-xl border bg-white px-4 py-3 text-left text-base outline-none transition cursor-pointer ${
    invalid
      ? "border-rose-400 focus-visible:ring-4 focus-visible:ring-rose-500/10"
      : open
        ? "border-blue-500 ring-4 ring-blue-500/10"
        : "border-slate-300 hover:border-slate-400 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
  }`;

// ปิดเมื่อคลิกข้างนอก / กด Esc
const useDismiss = (open: boolean, close: () => void, popRef?: React.RefObject<HTMLDivElement | null>) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || popRef?.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, popRef]);
  return ref;
};

/**
 * วางตำแหน่ง popup แบบ fixed ติดกับช่อง: เปิดลงล่างถ้าพื้นที่พอ ไม่พอเปิดขึ้นบน
 * และไม่ให้ล้นขอบจอซ้าย/ขวา (อยู่ใน portal จึงไม่ถูกกล่อง/แถบบันทึกด้านล่างบัง)
 */
const usePopoverPosition = (open: boolean, anchorRef: React.RefObject<HTMLElement | null>, popRef: React.RefObject<HTMLElement | null>) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const update = useCallback(() => {
    const anchor = anchorRef.current?.getBoundingClientRect();
    if (!anchor) return;
    const h = popRef.current?.offsetHeight ?? 420;
    const w = popRef.current?.offsetWidth ?? 340;
    const gap = 8;
    const below = window.innerHeight - anchor.bottom - gap;
    const above = anchor.top - gap;
    const openUp = below < h && above > below;
    let top = openUp ? anchor.top - h - gap : anchor.bottom + gap;
    top = Math.max(gap, Math.min(top, window.innerHeight - h - gap));
    const left = Math.max(gap, Math.min(anchor.left, window.innerWidth - w - gap));
    setPos({ top, left });
  }, [anchorRef, popRef]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    update();
    // วัดอีกรอบหลัง popup แสดงจริง (รู้ความสูงจริง)
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);
  return pos;
};

type DateProps = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
};

/** เลือกวันที่ ปฏิทินภาษาไทย ปี พ.ศ. */
export const ThaiDatePicker = ({ value, onChange, min, max, placeholder = "เลือกวันที่", invalid, id }: DateProps) => {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close, popRef);
  const pos = usePopoverPosition(open, triggerRef, popRef);
  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);
  const popId = useId();
  const thisYear = new Date().getFullYear();

  const disabled = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popId}
        className={triggerClass(invalid, open)}
      >
        <CalendarDays className="h-5 w-5 flex-shrink-0 text-slate-400" />
        <span className={`flex-1 ${value ? "text-slate-900" : "text-slate-400"}`}>{value ? formatThaiShort(value) : placeholder}</span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            aria-label="ล้างวันที่"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }
            }}
            className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </span>
        )}
      </button>

      {open &&
        createPortal(
        <div
          ref={popRef}
          id={popId}
          role="dialog"
          aria-label="ปฏิทิน"
          // กันคลิกในปฏิทินไปกระตุ้น <label> ที่ครอบอยู่ (จะทำให้ปฏิทินเปิด/ปิดเอง)
          onClick={(e) => e.stopPropagation()}
          style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? "visible" : "hidden" }}
          className="thai-date-picker z-[120] max-h-[calc(100vh-16px)] overflow-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
        >
          <DayPicker
            mode="single"
            locale={th}
            selected={selected}
            defaultMonth={selected ?? minDate ?? new Date()}
            onSelect={(d) => {
              if (d) {
                onChange(toValue(d));
                setOpen(false);
              }
            }}
            disabled={disabled}
            captionLayout="dropdown"
            startMonth={new Date(thisYear - 5, 0)}
            endMonth={new Date(thisYear + 5, 11)}
            formatters={{
              formatCaption: (m) => `${format(m, "LLLL", { locale: th })} ${m.getFullYear() + 543}`,
              formatYearDropdown: (y) => String(y.getFullYear() + 543),
              formatMonthDropdown: (m) => format(m, "LLLL", { locale: th }),
            }}
          />
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => {
                onChange(toValue(new Date()));
                setOpen(false);
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 cursor-pointer"
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              ล้าง
            </button>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
};

type TimeProps = {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  id?: string;
  step?: 5 | 10 | 15 | 30;
  presets?: string[];
};

/** เลือกเวลา 24 ชั่วโมง: ชั่วโมง + นาที และปุ่มลัด */
export const TimePicker = ({
  value,
  onChange,
  invalid,
  id,
  step = 5,
  presets = ["08:30", "09:00", "10:00", "13:00", "16:00"],
}: TimeProps) => {
  const [hh, mm] = value ? value.substring(0, 5).split(":") : ["", ""];
  const minutes = Array.from({ length: 60 / step }, (_, i) => pad(i * step));
  // ถ้าค่าเดิมไม่ตรงกับ step (เช่น 09:07) ให้ยังเลือกค่านั้นได้
  if (mm && !minutes.includes(mm)) minutes.push(mm);
  minutes.sort();

  const set = (h: string, m: string) => onChange(h ? `${h}:${m || "00"}` : "");
  const selectClass =
    "flex-1 cursor-pointer appearance-none bg-transparent py-3 text-center text-base text-slate-900 outline-none";

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-xl border bg-white px-3 transition focus-within:ring-4 ${
          invalid ? "border-rose-400 focus-within:ring-rose-500/10" : "border-slate-300 focus-within:border-blue-500 focus-within:ring-blue-500/10"
        }`}
      >
        <Clock className="h-5 w-5 flex-shrink-0 text-slate-400" />
        <select id={id} aria-label="ชั่วโมง" value={hh} onChange={(e) => set(e.target.value, mm)} className={selectClass}>
          <option value="">ชม.</option>
          {Array.from({ length: 24 }, (_, i) => pad(i)).map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-lg font-bold text-slate-400">:</span>
        <select aria-label="นาที" value={mm} onChange={(e) => set(hh || "08", e.target.value)} className={selectClass}>
          <option value="" disabled={!!hh}>
            นาที
          </option>
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-500">น.</span>
        {value && (
          <button type="button" onClick={() => onChange("")} aria-label="ล้างเวลา" className="ml-1 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {presets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`rounded-lg px-2.5 py-1 text-sm font-medium transition cursor-pointer ${
                value.substring(0, 5) === p ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** วันที่ + เวลา: ค่า "yyyy-MM-ddTHH:mm" (เหมือน <input type="datetime-local">) */
export const ThaiDateTimePicker = ({
  value,
  onChange,
  min,
  max,
  invalid,
  defaultTime = "08:00",
  timePresets,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  invalid?: boolean;
  defaultTime?: string;
  timePresets?: string[];
}) => {
  const date = value ? value.substring(0, 10) : "";
  const time = value && value.length >= 16 ? value.substring(11, 16) : "";
  return (
    <div className="grid gap-2 sm:grid-cols-[1.3fr_1fr]">
      <ThaiDatePicker
        value={date}
        min={min?.substring(0, 10)}
        max={max?.substring(0, 10)}
        invalid={invalid}
        onChange={(d) => onChange(d ? `${d}T${time || defaultTime}` : "")}
      />
      <TimePicker
        value={time}
        invalid={invalid}
        presets={timePresets ?? []}
        onChange={(t) => onChange(date ? `${date}T${t || defaultTime}` : "")}
      />
    </div>
  );
};
