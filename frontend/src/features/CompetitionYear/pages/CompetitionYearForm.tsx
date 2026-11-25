import {
  useAddCompetitionYearMutation,
  useUpdateCompetitionYearMutation,
} from "../CompetitionYearApi";
import { useGetAllCompetitionQuery } from "../../Competition/CompetitionApi";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import type { CompetitionYear } from "../type";
import { SelectInput, TextInput } from "../../../components/Inputs";
import { showError, showSuccessOk } from "../../../utils";

interface CompetitionYearFormProps {
  currentCompetitionYear?: CompetitionYear | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  yearId?: number | string;
}

export const CompetitionYearForm = ({
  currentCompetitionYear,
  onSuccess,
  onCancel,
  yearId,
}: CompetitionYearFormProps) => {
  const { data: Competitions } = useGetAllCompetitionQuery();
  const [addCompetitionYear, { isLoading }] = useAddCompetitionYearMutation();
  const [updateCompetitionYear, { isLoading: isUpdating }] =
    useUpdateCompetitionYearMutation();

  const CompetitionTypeSchema = Yup.object().shape({
    registrationLocation: Yup.string()
      .required("กรุณาระบุสถานที่จัดกิจกรรม")
      .min(3, "ชื่อสถานที่ต้องมีอย่างน้อย 3 ตัวอักษร"),
    competitionID: Yup.string().required("กรุณาเลือกประเภทกิจกรรม"),
  });

  const initialValues = {
    yearID: currentCompetitionYear?.yearID || Number(yearId) || 0,
    competitionID: currentCompetitionYear?.competitionID ?? 0,
    registrationLocation: currentCompetitionYear?.registrationLocation || "",
    advisorCount: currentCompetitionYear?.advisorCount ?? 1,
    registrationMode: currentCompetitionYear?.registrationMode ?? "team",
    maxStudentsPerSchool: currentCompetitionYear?.maxStudentsPerSchool ?? undefined,
  };

  const handleSubmit = async (values: Omit<CompetitionYear, "id">) => {
    const competitionYear: CompetitionYear = {
      ...values,
      competitionID: Number(values.competitionID),
      yearID: Number(yearId),
    };

    if (currentCompetitionYear?.competitionYearID) {
      competitionYear.competitionYearID =
        currentCompetitionYear.competitionYearID;
    }

    try {
      if (currentCompetitionYear) {
        await updateCompetitionYear(competitionYear).unwrap();
        await showSuccessOk("อัปเดตข้อมูลเรียบร้อยแล้ว");
      } else {
        await addCompetitionYear(competitionYear).unwrap();
        await showSuccessOk("เพิ่มข้อมูลเรียบร้อยแล้ว");
      }
      onSuccess?.();
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ??
        "ไม่สามารถบันทึกข้อมูลกิจกรรมได้ กรุณาลองใหม่";
      await showError(errorMessage);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-300/80 bg-white p-6 shadow-sm md:p-8">
      <h2 className="mb-6 text-2xl font-semibold text-slate-800 md:text-3xl">
        {currentCompetitionYear ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}
      </h2>
      <Formik
        initialValues={initialValues}
        validationSchema={CompetitionTypeSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        <Form className="grid gap-4 md:grid-cols-2">
          <SelectInput
            name="competitionID"
            label="ประเภทกิจกรรม"
            options={[
              { value: "", label: "เลือกประเภทกิจกรรม" },
              ...(Competitions?.map((type: any) => ({
                value: type.competitionID.toString(),
                label: type.competitionName,
              })) || []),
            ]}
          />
          <TextInput
            name="advisorCount"
            type="number"
            label="จำนวนผู้ควบคุมทีม / อาจารย์ที่ปรึกษา"
          />
          <SelectInput<string>
            name="registrationMode"
            label="รูปแบบการสมัคร"
            options={[{ value: "team", label: "แบบทีม" }, { value: "individual", label: "แบบเดี่ยว" }]}
          />
          <TextInput
            name="maxStudentsPerSchool"
            type="number"
            label="จำนวนผู้สมัครสูงสุดต่อโรงเรียน (ไม่กำหนดเว้นว่าง)"
          />
          <div className="md:col-span-2">
            <TextInput
              name="registrationLocation"
              label="สถานที่จัดกิจกรรม"
              placeholder="เช่น อาคารกิจกรรม"
            />
          </div>
          <div className="flex flex-col gap-3 pt-2 md:col-span-2 md:flex-row md:justify-end">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 md:w-auto"
              >
                ยกเลิก
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || isUpdating}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50 md:w-auto"
            >
              {isLoading || isUpdating ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </Form>
      </Formik>
    </div>
  );
};
