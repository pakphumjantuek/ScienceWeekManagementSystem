import { useEffect, useMemo, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import { useField, useFormikContext } from "formik";
import {
  useLazySearchSchoolsQuery,
  useLazyGetSchoolByCodeQuery,
} from "../features/School/SchoolApi";

type Option = { value: number; label: string };

type Props = {
  name?: string;
  label?: string;
  placeholder?: string;
  limit?: number;
  /** ส่งชื่อโรงเรียนมาเพื่อโชว์ทันทีตอนแก้ไข */
  initialLabel?: string;
};

export default function SchoolSearchField({
  name = "school_code",
  label = "ค้นหาโรงเรียน",
  placeholder = "พิมพ์ชื่อโรงเรียนเพื่อค้นหา...",
  limit = 50,
  initialLabel,
}: Props) {
  // เก็บใน Formik เป็น number | undefined (ห้าม "")
  const [, meta, helpers] = useField<number | undefined>(name);
  const { setFieldTouched, values } = useFormikContext<any>();

  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [triggerSearch] = useLazySearchSchoolsQuery();
  const [getByCode] = useLazyGetSchoolByCodeQuery();

  // ====== โหลดตัวเลือกแบบ debounce ======
  const debounceRef = useRef<number | undefined>(undefined);
  const loadOptions = useMemo(
    () => (inputValue: string, callback: (opts: Option[]) => void) => {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(async () => {
        const q = inputValue.trim();
        if (!q) {
          callback([]);
          return;
        }
        const res = await triggerSearch({ q, limit }, true);
        if ("data" in res) {
          const raw =
            (res.data as any)?.result ?? (res.data as any)?.Result ?? res.data;
          const arr = Array.isArray(raw) ? raw : [];
          const opts: Option[] = arr.map((s: any) => ({
            value: Number(s.school_code),
            label: String(s.school_name ?? ""),
          }));
          callback(opts);
        } else {
          callback([]);
        }
      }, 300);
    },
    [limit, triggerSearch]
  );

  // ====== พรีโหลดจากค่าเดิมในฟอร์ม ======
  useEffect(() => {
    const raw = values?.[name];
    const code =
      typeof raw === "string" ? parseInt(raw, 10) : (raw as number | undefined);

    // ไม่มีค่า → ล้าง
    if (!code || Number.isNaN(code)) {
      setSelectedOption(null);
      if (meta.value !== undefined) helpers.setValue(undefined);
      return;
    }

    // ถ้ามี initialLabel → ตั้งค่าได้เลย
    if (initialLabel && (!selectedOption || selectedOption.value !== code)) {
      setSelectedOption({ value: code, label: initialLabel });
      if (meta.value !== code) helpers.setValue(code);
      return;
    }

    // Fallback: ดึงชื่อจากรหัส
    if (!selectedOption || selectedOption.value !== code) {
      (async () => {
        const res = await getByCode(code, true);
        if ("data" in res && res.data) {
          const data =
            (res.data as any)?.result ?? (res.data as any)?.Result ?? res.data;
          const school_code = Number(data?.school_code);
          const school_name = String(data?.school_name ?? "");

          if (school_code && school_name) {
            setSelectedOption({ value: school_code, label: school_name });
            if (meta.value !== school_code) helpers.setValue(school_code);
          } else {
            setSelectedOption(null);
            helpers.setValue(undefined);
          }
        } else {
          setSelectedOption(null);
          helpers.setValue(undefined);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-comments
  }, [values?.[name], initialLabel]); // อัปเดตเมื่อค่าในฟอร์มหรือ initialLabel เปลี่ยน

  return (
    <div className="space-y-2">
      <label className="block font-medium">{label}</label>
      <AsyncSelect<Option, false>
        cacheOptions
        defaultOptions={[]}
        loadOptions={loadOptions}
        value={selectedOption}
        onChange={(opt) => {
          setSelectedOption(opt);
          helpers.setValue(opt?.value ?? undefined);
        }}
        onBlur={() => setFieldTouched(name, true)}
        isClearable
        placeholder={placeholder}
        menuPlacement="auto"
        menuShouldScrollIntoView
        noOptionsMessage={() => "ไม่พบสถานศึกษา"}
        classNamePrefix="rs"
        // บังคับการอ่าน label/value ชัด ๆ
        getOptionLabel={(o) => o.label ?? ""}
        getOptionValue={(o) => String(o.value)}
        styles={{
          control: (base) => ({ ...base, minHeight: 42 }),
        }}
      />

      {/* Echo ค่าที่เลือกเพื่อไล่บั๊ก (เอาออกได้เมื่อเรียบร้อย) */}
      <div className="text-xs text-slate-500">
        {selectedOption ? (
          <>
            เลือกแล้ว: <b>{selectedOption.label}</b> (code:{" "}
            {selectedOption.value})
          </>
        ) : (
          "ยังไม่ได้เลือก"
        )}
      </div>
      {meta.touched && meta.error ? (
        <p className="mt-1 text-sm text-red-600">{String(meta.error)}</p>
      ) : null}
    </div>
  );
}
