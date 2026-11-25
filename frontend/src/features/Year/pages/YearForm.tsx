import { useAddYearMutation, useUpdateYearMutation } from "../YearApi";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { showError, showSuccessOk } from "../../../utils/confirmDelete";
import type { Year } from "../type";
import { SelectInput, TextInput } from "../../../components/Inputs";
import { useDispatch } from "react-redux";
import { setYear } from "../YearSlice";

import { formatDateTimeLocal } from "../../../utils";

interface YearFormProps {
  currentYear?: Year | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const YearForm = ({
  currentYear,
  onSuccess,
  onCancel,
}: YearFormProps) => {
  const [addYear, { isLoading }] = useAddYearMutation();
  const [updateYear, { isLoading: isUpdating }] = useUpdateYearMutation();
  const dispatch = useDispatch();
  const YearSchema = Yup.object().shape({
    yearNumber: Yup.number()
      .required("กรุณากรอกปี")
      .min(3, "ปีต้องมีอย่างน้อย 3 ตัวอักษร"),
    yearName: Yup.string()
      .required("กรุณากรอกรอกชื่อปี")
      .min(3, "ชื่อทีมต้องมีอย่างน้อย 3 ตัวอักษร"),
    isActive: Yup.boolean().required("กรุณากรอกสถานะ"),
  });

  const initialValues = {
    yearNumber: currentYear?.yearNumber || 0,
    yearName: currentYear?.yearName || "",
    isActive: currentYear?.isActive || false,
    competitionRegulationsUrl: currentYear?.competitionRegulationsUrl || "",
    dateName: currentYear?.dateName || "",
    registrationOpenDate: formatDateTimeLocal(currentYear?.registrationOpenDate),
    registrationCloseDate: formatDateTimeLocal(currentYear?.registrationCloseDate),
  };

  const handleSubmit = async (values: Omit<Year, "id">) => {
    const year: Year = {
      ...values,
    };
    if (currentYear) {
      year.yearID = currentYear.yearID;
    }
    console.log(year);
    try {
      if (currentYear) {
        await updateYear(year).unwrap();
        await showSuccessOk("อัพเดทปีการแข่งสำเร็จ!");
      } else {
        await addYear(year).unwrap();
        await showSuccessOk("เพิ่มปีการแข่งสำเร็จ!");
      }
      dispatch(setYear(year));
      onSuccess?.();
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ??
        "ไม่สามารถบันทึกข้อมูลปีการแข่งขันได้ กรุณาลองใหม่";
      await showError(errorMessage);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-300/80 bg-white p-6 shadow-sm md:p-8">
      <h2 className="mb-6 text-2xl font-semibold text-slate-800 md:text-3xl">
        {currentYear ? "แก้ไขปีการเเข่งขัน" : "เพิ่มปีการเเข่งขัน"}
      </h2>
      <Formik
        initialValues={initialValues}
        validationSchema={YearSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        <Form>
          <div className="grid gap-4 md:grid-cols-2">
            {" "}
            <TextInput
              name="yearNumber"
              label="ปีการเเข่งขัน"
              placeholder="ระบุปีการเเข่งขันของคุณ"
            />
            <TextInput
              name="yearName"
              label="ชือปีการเเข่งขัน"
              placeholder="ชื่อปีการเเข่งขันการทีม"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-1 mt-5">
            <div className="md:col-span-2">
              <TextInput
                name="competitionRegulationsUrl"
                label="ลิงค์กฎระเบียบการแข่งขัน"
                placeholder="ระบุลิงค์กฎระเบียบการแข่งขัน"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 mt-5">
            <TextInput
              name="dateName"
              label="วันที่การแข่งขัน"
              placeholder="ระบุชื่อวันที่การแข่งขัน เช่น 18 - 29 สิงหาคม"
            />
            <SelectInput<boolean>
              name="isActive"
              label="สถานะ"
              options={[
                { value: true, label: "เปิด" },
                { value: false, label: "ปิด" },
              ]}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 mt-5">
            <TextInput
              type="datetime-local"
              label="วันและเวลาเปิดลงทะเบียน"
              name="registrationOpenDate"
            />
            <TextInput
              type="datetime-local"
              label="วันและเวลาปิดลงทะเบียน"
              name="registrationCloseDate"
            />
          </div>
          <div className="flex flex-col gap-3 pt-2 md:col-span-2 md:flex-row md:justify-end">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full rounded-lg border border-slate-300 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 md:w-auto md:px-6"
              >
                ยกเลิก
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || isUpdating}
              className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white transition duration-300 hover:bg-blue-700 disabled:opacity-60 md:w-auto md:px-6"
            >
              {isLoading || isUpdating ? "กำลังดำเนินการ..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </Form>
      </Formik>
    </div>
  );
};
