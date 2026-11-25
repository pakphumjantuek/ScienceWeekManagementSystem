// src/components/CascadingSchoolPicker.tsx
import { useEffect, useMemo, useState } from "react";
import { useField } from "formik";
import Select from "react-select";
import {
  useGetProvincesQuery,
  useGetDistrictsQuery,
  useLazySearchSchoolsByAreaQuery,
  useGetSchoolByCodeQuery,
} from "../features/School/SchoolApi";

const useDebounce = <T,>(v: T, delay = 350) => {
  const [x, setX] = useState(v);
  useEffect(() => {
    const id = setTimeout(() => setX(v), delay);
    return () => clearTimeout(id);
  }, [v, delay]);
  return x;
};

type Props = {
  name: string; // Formik field name: "school_Code"
  initialProvince?: string;
  initialDistrict?: string;
  initialSchoolLabel?: string;
  className?: string;
};

type SelectOption = {
  value: string;
  label: string;
};

export default function CascadingSchoolPicker({
  name,
  initialProvince,
  initialDistrict,
  initialSchoolLabel,
  className,
}: Props) {
  const [{ value }, , helpers] = useField<number | undefined>(name);

  // ค่าตั้งต้น (trim)
  const [province, setProvince] = useState((initialProvince ?? "").trim());
  const [district, setDistrict] = useState((initialDistrict ?? "").trim());
  const [keyword, setKeyword] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(
    initialSchoolLabel ?? null
  );
  const dq = useDebounce(keyword);

  // โหลดจังหวัด/อำเภอ
  const {
    data: provinces = [],
    isLoading: lp,
    isError: ep,
  } = useGetProvincesQuery();
  const {
    data: rawDistricts = [],
    isLoading: ld,
    isFetching: fd,
    isError: ed,
  } = useGetDistrictsQuery(province, { skip: !province });
  const districts = useMemo(
    () => rawDistricts.map((d) => (d ?? "").trim()),
    [rawDistricts]
  );
  const provinceOptions = useMemo<SelectOption[]>(
    () =>
      provinces.map((p) => {
        const value = (p ?? "").trim();
        return { value, label: value };
      }),
    [provinces],
  );
  const districtOptions = useMemo<SelectOption[]>(
    () => districts.map((d) => ({ value: d, label: d })),
    [districts],
  );

  // ค้นหาโรงเรียน
  const [
    trigger,
    { data: schools = [], isFetching: fs, isLoading: ls, isError: es },
  ] = useLazySearchSchoolsByAreaQuery();

  // ถ้ามี code แต่ยังไม่รู้ชื่อ → โหลดชื่อ (และเติม province/district ถ้ายังว่าง)
  const { data: schoolByCode } = useGetSchoolByCodeQuery(value as number, {
    skip: !value || !!selectedName,
  });
  useEffect(() => {
    if (!schoolByCode) return;
    if (!selectedName) setSelectedName(schoolByCode.school_name);
    if (!province && schoolByCode.province)
      setProvince((schoolByCode.province ?? "").trim());
    if (!district && schoolByCode.district)
      setDistrict((schoolByCode.district ?? "").trim());
  }, [schoolByCode]);

  // เมื่อรายการอำเภอโหลดเสร็จ → ถ้ามีค่าเริ่มต้นและอยู่ใน options ให้ set คืน
  useEffect(() => {
    const d0 = (initialDistrict ?? "").trim();
    if (!d0 || !province || districts.length === 0) return;
    if (!district && districts.includes(d0)) setDistrict(d0);
  }, [initialDistrict, province, districts]);

  // ยิงค้นหาเมื่อพร้อม (และยังไม่มีการเลือกโรงเรียน)
  useEffect(() => {
    if (!value && province && district)
      trigger({ province, district, q: dq, limit: 100 });
  }, [province, district, dq, value]);

  // ---------- handlers ----------
  const handleProvinceChange = (pv: string) => {
    pv = (pv ?? "").trim();
    setProvince(pv);
    // reset ใต้ชั้นเมื่อผู้ใช้เปลี่ยนจังหวัด
    setDistrict("");
    helpers.setValue(undefined);
    setSelectedName(null);
    setKeyword("");
  };

  const handleDistrictChange = (dv: string) => {
    dv = (dv ?? "").trim();
    setDistrict(dv);
    // reset โรงเรียนเมื่อผู้ใช้เปลี่ยนอำเภอ
    helpers.setValue(undefined);
    setSelectedName(null);
    setKeyword("");
  };

  const handlePickSchool = (code: number, name: string) => {
    helpers.setValue(Number(code));
    setSelectedName(name);
    setKeyword(""); // เคลียร์คำค้น
  };

  const resetSchool = () => {
    helpers.setValue(undefined);
    setSelectedName(null);
    setKeyword("");
  };

  // ล็อกจังหวัด/อำเภอเมื่อมีการเลือกโรงเรียนแล้ว
  const hasSelection = !!value;
  const disabledDistrict = hasSelection || !province || ld || fd;
  const disabledProvince = hasSelection || lp;
  const disabledSchool = hasSelection || !province || !district || ls;

  const txtProv = useMemo(
    () => (lp ? "กำลังโหลดจังหวัด…" : ep ? "โหลดจังหวัดไม่สำเร็จ" : null),
    [lp, ep]
  );
  const txtDist = useMemo(
    () =>
      !province
        ? null
        : ld || fd
        ? "กำลังโหลดอำเภอ…"
        : ed
        ? "โหลดอำเภอไม่สำเร็จ"
        : null,
    [province, ld, fd, ed]
  );
  const txtSch = useMemo(() => {
    if (hasSelection) return null;
    if (!province || !district) return "โปรดเลือกจังหวัดและอำเภอก่อน";
    if (fs) return "กำลังค้นหา…";
    if (es) return "ค้นหาโรงเรียนไม่สำเร็จ";
    if ((schools?.length ?? 0) === 0) return "ไม่พบโรงเรียน";
    return null;
  }, [hasSelection, province, district, fs, es, schools]);

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-3">
        {/* จังหวัด */}
        <div className="space-y-1.5">
          <label className="block text-base font-medium text-slate-700">
            จังหวัด *
          </label>
          <Select<SelectOption, false>
            inputId={`${name}-province`}
            isSearchable
            isClearable
            isDisabled={disabledProvince}
            placeholder="ค้นหาและเลือกจังหวัด"
            options={provinceOptions}
            value={
              province
                ? {
                    value: province,
                    label: province,
                  }
                : null
            }
            onChange={(option) => handleProvinceChange(option?.value ?? "")}
            className="text-base"
            menuPortalTarget={document.body}
            menuPlacement="auto"
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            classNamePrefix="react-select"
          />
          {txtProv && <p className="text-sm text-slate-500">{txtProv}</p>}
        </div>

        {/* อำเภอ */}
        <div className="space-y-1.5">
          <label className="block text-base font-medium text-slate-700">
            อำเภอ *
          </label>
          <Select<SelectOption, false>
            inputId={`${name}-district`}
            isSearchable
            isClearable
            isDisabled={disabledDistrict}
            placeholder={province ? "ค้นหาและเลือกอำเภอ" : "เลือกจังหวัดก่อน"}
            options={districtOptions}
            value={
              district
                ? {
                    value: district,
                    label: district,
                  }
                : null
            }
            onChange={(option) => handleDistrictChange(option?.value ?? "")}
            className="text-base"
            menuPortalTarget={document.body}
            menuPlacement="auto"
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            classNamePrefix="react-select"
          />
          {txtDist && <p className="text-sm text-slate-500">{txtDist}</p>}
        </div>

        {/* โรงเรียน */}
        <div className="space-y-1.5">
          <label className="block text-base font-medium text-slate-700">
            โรงเรียน / สถานศึกษา *
          </label>

          {/* ถ้าถูกเลือกแล้ว: โชว์แค่ชื่อ + ปุ่มล้าง */}
          {hasSelection ? (
            <div className="mt-1 flex items-center justify-between rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3">
              <span className="text-base text-emerald-800 font-medium truncate">
                {selectedName ?? schoolByCode?.school_name ?? "—"}
              </span>
              <button
                type="button"
                onClick={resetSchool}
                className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-white"
                aria-label="ล้างโรงเรียน"
                title="ล้างโรงเรียน"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <input
                disabled={disabledSchool}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="พิมพ์เพื่อค้นหา เช่น 'สาธิต'"
                className="mt-1 w-full rounded-md border border-slate-300 px-4 py-3 text-base disabled:bg-slate-100 focus:border-indigo-600 focus:ring-indigo-600"
              />
              <div className="mt-2 max-h-56 overflow-auto rounded-md border border-slate-200">
                {txtSch ? (
                  <div className="p-3 text-base text-slate-500">{txtSch}</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {schools.map((s) => (
                      <li
                        key={s.school_code}
                        className="p-3 text-base hover:bg-indigo-50 cursor-pointer"
                        onClick={() =>
                          handlePickSchool(s.school_code ?? 0, s.school_name)
                        }
                        title={s.school_name}
                      >
                        {s.school_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
