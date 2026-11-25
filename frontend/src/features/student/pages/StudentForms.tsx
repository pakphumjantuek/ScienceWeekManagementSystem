import {
  useAddStudentMutation,
  useGetAllStudentQuery,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} from "../StudentApi";
import { Formik, Form, Field, getIn, type FormikErrors } from "formik";
import { TitlePrefix, type Student } from "../type";
import { SelectInput, TextInput } from "../../../components/Inputs";
import { showError, showSuccessOk } from "../../../utils";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../../Redux/store";
import { jwtDecode } from "jwt-decode";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Lock, Save, UserCheck, UsersRound } from "lucide-react";

interface StudentFormsInlineProps {
  teamId: number;
  mainPlayersCount: number;
  reservePlayersCount: number;
  competitionLevelID: number;
  returnState: any;
  registrationCloseDate?: string;
}

type FormValues = { students: Student[] };

const makeEmpty = (isMain: boolean): Student => ({
  studentID: undefined,
  teamID: undefined,
  firstName: "",
  lastName: "",
  titlePrefix: 0,
  isMainMember: isMain,
});

const pad = (arr: Student[], count: number, isMain: boolean) =>
  Array.from({ length: count }, (_, i) =>
    arr[i] ? { ...arr[i], isMainMember: isMain } : makeEmpty(isMain),
  );

function buildInitialStudents(
  existing: Student[] = [],
  main: number,
  resv: number,
) {
  const mainArr = existing.filter((s) => s.isMainMember);
  const resvArr = existing.filter((s) => !s.isMainMember);
  return [...pad(mainArr, main, true), ...pad(resvArr, resv, false)];
}

const slotLabel = (index: number, mainPlayersCount: number) =>
  index < mainPlayersCount
    ? `ตัวจริงคนที่ ${index + 1}`
    : `สำรองคนที่ ${index - mainPlayersCount + 1}`;

/**
 * ตัวจริงต้องกรอกครบทุกคน (ชื่อ + นามสกุล), ตัวสำรองไม่บังคับ แต่ถ้ากรอกต้องครบทั้งชื่อและนามสกุล
 * และห้ามชื่อซ้ำกันในทีม — เคยบันทึกทีมที่ไม่มีนักเรียน / ชื่อไม่ครบได้
 */
export function validateStudents(
  values: FormValues,
  mainPlayersCount: number,
): FormikErrors<FormValues> {
  const rowErrors: ({ firstName?: string; lastName?: string } | undefined)[] = [];
  const seen = new Map<string, number>();

  values.students.forEach((s, idx) => {
    const first = (s.firstName ?? "").trim();
    const last = (s.lastName ?? "").trim();
    const isMain = idx < mainPlayersCount;
    const err: { firstName?: string; lastName?: string } = {};

    if (isMain || first || last) {
      if (!first) err.firstName = "กรุณากรอกชื่อ";
      if (!last) err.lastName = "กรุณากรอกนามสกุล (ถ้าไม่มีใส่ -)";
    }

    if (first && last) {
      const key = `${first} ${last}`.toLowerCase();
      if (seen.has(key)) {
        err.firstName = `ชื่อซ้ำกับ${slotLabel(seen.get(key)!, mainPlayersCount)}`;
      } else {
        seen.set(key, idx);
      }
    }

    rowErrors[idx] = Object.keys(err).length ? err : undefined;
  });

  return rowErrors.some(Boolean) ? { students: rowErrors as any } : {};
}

export const StudentFormsInline = ({
  teamId,
  mainPlayersCount,
  reservePlayersCount,
  competitionLevelID,
  returnState,
  registrationCloseDate,
}: StudentFormsInlineProps) => {
  const [addStudent] = useAddStudentMutation();
  const [updateStudent] = useUpdateStudentMutation();
  const [deleteStudent] = useDeleteStudentMutation();
  const navigate = useNavigate();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const { data: existing = [], isLoading } = useGetAllStudentQuery(teamId, {
    skip: !teamId,
  });

  const initialStudents = useMemo(
    () =>
      buildInitialStudents(
        existing as Student[],
        mainPlayersCount,
        reservePlayersCount,
      ),
    [existing, mainPlayersCount, reservePlayersCount],
  );

  const deadlineEndOfDay = useMemo(() => {
    if (!registrationCloseDate) return null;
    const deadlineDate = new Date(registrationCloseDate);
    if (Number.isNaN(deadlineDate.getTime())) return null;
    const hasTime = registrationCloseDate.includes("T") || registrationCloseDate.includes(":");
    if (!hasTime) {
      deadlineDate.setHours(23, 59, 59, 999);
    }
    return deadlineDate;
  }, [registrationCloseDate]);

  const userRole = useSelector((state: RootState) => state.userAuthStore.role);
  const isStaffOrAdmin = (() => {
    let role = userRole || "";
    if (!role) {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          role =
            decoded?.role ||
            decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
            decoded?.Role ||
            "";
        } catch (e) {
          console.error(e);
        }
      }
    }
    const r = String(role).toLowerCase();
    return (
      r === "admin" ||
      r === "staff" ||
      r === "เจ้าหน้าที่" ||
      r === "ผู้ดูแลระบบ" ||
      r.includes("admin") ||
      r.includes("staff")
    );
  })();
  const isEditExpired =
    !!deadlineEndOfDay && new Date() > deadlineEndOfDay && !isStaffOrAdmin;
  const deadlineLabel = deadlineEndOfDay
    ? `${new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric" }).format(deadlineEndOfDay)} (${String(deadlineEndOfDay.getHours()).padStart(2, "0")}:${String(deadlineEndOfDay.getMinutes()).padStart(2, "0")} น.)`
    : "";
  const daysLeft = deadlineEndOfDay
    ? Math.ceil((deadlineEndOfDay.getTime() - Date.now()) / 86_400_000)
    : null;

  const goBack = () =>
    navigate(`/teamregister/${competitionLevelID}`, { state: returnState });

  const handleSubmit = async (values: FormValues) => {
    if (isEditExpired) {
      await showError("หมดสิทธิ์แก้ไขข้อมูลสมาชิกแล้ว");
      return;
    }

    const ops = values.students.map((slot, idx) => {
      const normalized: Student = {
        ...slot,
        teamID: teamId,
        isMainMember: idx < mainPlayersCount,
        firstName: (slot.firstName ?? "").trim(),
        lastName: (slot.lastName ?? "").trim(),
        titlePrefix: Number(slot.titlePrefix ?? 0),
      };
      const hasName = normalized.firstName !== "" || normalized.lastName !== "";
      const hasId = !!normalized.studentID;

      if (hasId && hasName)
        return updateStudent({ ...normalized, studentID: normalized.studentID! }).unwrap();
      if (!hasId && hasName) return addStudent({ ...normalized }).unwrap();
      if (hasId && !hasName) return deleteStudent(normalized.studentID!).unwrap();
      return null;
    });

    // allSettled: แจ้งให้ชัดว่าใครบันทึกไม่สำเร็จ แทนที่จะเงียบ/แจ้ง error รวม
    const results = await Promise.allSettled(ops.map((op) => op ?? Promise.resolve()));
    const failed = results
      .map((r, idx) => ({ r, idx }))
      .filter(({ r, idx }) => ops[idx] && r.status === "rejected");

    if (failed.length === 0) {
      // อยู่หน้าเดิมต่อ เพื่อให้ตรวจ/แก้ไขซ้ำได้จนถึงวันปิดรับ
      await showSuccessOk(
        deadlineLabel
          ? `บันทึกรายชื่อนักเรียนเรียบร้อยแล้ว\nกลับมาแก้ไขได้จนถึง ${deadlineLabel}`
          : "บันทึกรายชื่อนักเรียนเรียบร้อยแล้ว",
      );
      setSavedAt(new Date());
      return;
    }

    const detail = failed
      .map(({ r, idx }) => {
        const reason = (r as PromiseRejectedResult).reason;
        return `${slotLabel(idx, mainPlayersCount)}: ${
          reason?.data?.errorMessages?.[0] ?? "บันทึกไม่สำเร็จ"
        }`;
      })
      .join("\n");
    await showError(
      `บันทึกไม่สำเร็จ ${failed.length} รายการ (รายการอื่นบันทึกแล้ว)\n${detail}\nกรุณาตรวจสอบแล้วกดบันทึกอีกครั้ง`,
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mb-4"></div>
        <p className="text-lg text-slate-500 font-medium">กำลังโหลดรายชื่อนักเรียน...</p>
      </div>
    );
  }

  const renderSlot = (
    index: number,
    order: number,
    isMain: boolean,
    values: FormValues,
  ) => {
    const s = values.students[index];
    const filled = !!s?.firstName?.trim() && !!s?.lastName?.trim();
    return (
      <div
        key={`${isMain ? "main" : "reserve"}-${index}`}
        className={`rounded-xl border p-4 sm:p-5 ${
          filled ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
        }`}
      >
        <Field type="hidden" name={`students[${index}].studentID`} />
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${
              filled
                ? "bg-emerald-500 text-white"
                : isMain
                  ? "bg-blue-600 text-white"
                  : "bg-amber-400 text-amber-950"
            }`}
          >
            {filled ? <CheckCircle2 className="w-5 h-5" /> : order}
          </span>
          <h4 className="text-lg font-bold">
            {isMain ? `ตัวจริงคนที่ ${order}` : `สำรองคนที่ ${order}`}
            {isMain && <span className="text-rose-500"> *</span>}
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr_1fr] gap-4">
          <SelectInput<number>
            name={`students[${index}].titlePrefix`}
            label="คำนำหน้า"
            options={TitlePrefix}
            disabled={isEditExpired}
            className="border-slate-300 bg-white text-lg py-3"
          />
          <TextInput
            name={`students[${index}].firstName`}
            label="ชื่อ"
            placeholder="เช่น สมชาย"
            disabled={isEditExpired}
            className="border-slate-300 bg-white text-lg py-3"
          />
          <TextInput
            name={`students[${index}].lastName`}
            label="นามสกุล (ถ้าไม่มีใส่ -)"
            placeholder="เช่น รักเรียน"
            disabled={isEditExpired}
            className="border-slate-300 bg-white text-lg py-3"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {!isEditExpired && deadlineLabel && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3 text-blue-950">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
          <p className="text-base">
            บันทึกแล้วกลับมาแก้ไขรายชื่อได้ตลอด จนถึง <b>{deadlineLabel}</b>
            {daysLeft !== null && daysLeft >= 0 && (
              <span className={`font-semibold ${daysLeft <= 3 ? "text-rose-600" : "text-amber-700"}`}>
                {" "}· {daysLeft === 0 ? "ปิดวันนี้" : `เหลืออีก ${daysLeft} วัน`}
              </span>
            )}
            <span className="block text-sm text-blue-800 mt-0.5">
              ทางกลับมาแก้: หน้ารายการทีม → ปุ่ม "จัดการสมาชิกทีม"
            </span>
          </p>
        </div>
      )}

      {savedAt && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 text-emerald-900">
          <p className="flex items-center gap-2 text-base font-semibold flex-1">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            บันทึกแล้วเมื่อ{" "}
            {savedAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
            — แก้ไขต่อในหน้านี้ได้เลย
          </p>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-base font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            กลับไปหน้ารายการทีม
          </button>
        </div>
      )}

      {isEditExpired && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3 text-amber-900">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="text-lg font-bold">หมดสิทธิ์แก้ไขรายชื่อแล้ว</p>
            <p className="text-base">ดูรายชื่อได้อย่างเดียว ไม่สามารถบันทึกการเปลี่ยนแปลงได้</p>
          </div>
        </div>
      )}

      <Formik
        enableReinitialize
        initialValues={{ students: initialStudents }}
        validate={(v) => validateStudents(v, mainPlayersCount)}
        onSubmit={handleSubmit}
      >
        {({ values, errors, isSubmitting, submitCount }) => {
          const mainFilled = values.students
            .slice(0, mainPlayersCount)
            .filter((s) => s.firstName?.trim() && s.lastName?.trim()).length;
          const rowErrors = (getIn(errors, "students") ?? []) as any[];
          const missing = rowErrors
            .map((e, idx) => (e ? `${slotLabel(idx, mainPlayersCount)}: ${e.firstName ?? e.lastName}` : null))
            .filter(Boolean) as string[];

          return (
            <Form className="space-y-5">
              {mainPlayersCount > 0 && (
                <section className="rounded-2xl border border-slate-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <UserCheck className="w-6 h-6 text-blue-600" />
                      นักเรียนตัวจริง
                      <span className="text-base font-semibold text-rose-600">(ต้องกรอกครบ)</span>
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-base font-bold ${
                        mainFilled === mainPlayersCount
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      กรอกแล้ว {mainFilled}/{mainPlayersCount} คน
                    </span>
                  </div>
                  <div className="p-4 sm:p-6 space-y-3">
                    {Array.from({ length: mainPlayersCount }, (_, i) =>
                      renderSlot(i, i + 1, true, values),
                    )}
                  </div>
                </section>
              )}

              {reservePlayersCount > 0 && (
                <section className="rounded-2xl border border-slate-200 bg-white">
                  <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <UsersRound className="w-6 h-6 text-amber-500" />
                      นักเรียนตัวสำรอง
                      <span className="text-base font-medium text-slate-400">(ไม่บังคับ)</span>
                    </h3>
                    <p className="text-base text-slate-500 mt-0.5">ถ้าไม่มีตัวสำรอง เว้นว่างไว้ได้</p>
                  </div>
                  <div className="p-4 sm:p-6 space-y-3">
                    {Array.from({ length: reservePlayersCount }, (_, i) =>
                      renderSlot(mainPlayersCount + i, i + 1, false, values),
                    )}
                  </div>
                </section>
              )}

              <p className="text-base text-slate-500 text-center">
                ตรวจสอบชื่อ-นามสกุลให้ตรงกับบัตรประชาชน เพราะจะใช้พิมพ์บนเกียรติบัตร
              </p>

              {submitCount > 0 && missing.length > 0 && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-1" />
                  <div className="text-base text-rose-900">
                    <p className="text-lg font-bold">ยังกรอกไม่ครบ กรุณาตรวจสอบ:</p>
                    <ul className="mt-1 list-disc pl-5">
                      {missing.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Actions: sticky so the save button is always reachable */}
              <div className="sticky bottom-0 z-20 -mx-4 sm:mx-0 border-t sm:border sm:rounded-2xl border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sm:p-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex justify-center items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                  ย้อนกลับ
                </button>

                {!isEditExpired && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-700 px-8 py-3.5 text-lg font-bold text-white hover:bg-blue-800 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    <Save className="w-5 h-5" />
                    {isSubmitting ? "กำลังบันทึก..." : "บันทึกรายชื่อนักเรียน"}
                  </button>
                )}
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};
