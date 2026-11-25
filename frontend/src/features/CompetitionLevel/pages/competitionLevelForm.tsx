import {
  useAddCompetitionLevelMutation,
  useUpdateCompetitionLevelMutation,
} from "../CompetitionLevelApi";
import { useGetAllEducationLevelQuery } from "../../EducationLevel/EducationLevelApi";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import type { CompetitionLevel } from "../type";
import { SelectInput, TextInput } from "../../../components/Inputs";
import { formatDateTimeLocal, showError, showSuccessOk } from "../../../utils";

interface CompetitionLevelFormFormProps {
  currentCompetitionLevel?: CompetitionLevel | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  competitionYearID?: number | string;
}

export const CompetitionLevelForm = ({
  currentCompetitionLevel,
  onSuccess,
  onCancel,
  competitionYearID,
}: CompetitionLevelFormFormProps) => {
  const { data: CompetitionsLevel } = useGetAllEducationLevelQuery();
  const [addCompetitionYear, { isLoading }] = useAddCompetitionLevelMutation();
  const [updateCompetitionYear, { isLoading: isUpdating }] =
    useUpdateCompetitionLevelMutation();

  const CompetitionLevelSchema = Yup.object().shape({
    minTeamMembers: Yup.number()
      .nullable()
      .min(1, "จำนวนสมาชิกทีมขั้นต่ำต้องไม่น้อยกว่า 1")
      .max(Yup.ref("maxTeamMembers"), "จำนวนขั้นต่ำต้องไม่เกินจำนวนสูงสุด"),
    maxTeamMembers: Yup.number()
      .nullable()
      .min(Yup.ref("minTeamMembers"), "จำนวนสูงสุดต้องไม่น้อยกว่าจำนวนขั้นต่ำ"),
    maxProjectsPerSchool: Yup.number()
      .nullable()
      .min(1, "จำนวนโครงการสูงสุดต่อโรงเรียนต้องไม่น้อยกว่า 1"),
    competitionDateTime: Yup.string().nullable(),
  });

  const initialCompetitionLevelValues: CompetitionLevel = {
    competitionLevelID:
      currentCompetitionLevel?.competitionLevelID ?? undefined,
    competitionYearID:
      currentCompetitionLevel?.competitionYearID ??
      Number(competitionYearID) ??
      0,
    levelID: currentCompetitionLevel?.levelID ?? 0,
    // minTeamMembers: currentCompetitionLevel?.minTeamMembers ?? 0,
    // maxTeamMembers: currentCompetitionLevel?.maxTeamMembers ?? 0,
    mainPlayersCount: currentCompetitionLevel?.mainPlayersCount ?? 0,
    reservePlayersCount: currentCompetitionLevel?.reservePlayersCount ?? 0,
    competitionDateTime: formatDateTimeLocal(
      currentCompetitionLevel?.competitionDateTime,
    ),
  };

  const handleSubmit = async (values: Omit<CompetitionLevel, "id">) => {
    const competitionLevel: CompetitionLevel = {
      ...values,
      competitionYearID: Number(competitionYearID),
      levelID: Number(values.levelID),
    };

    if (currentCompetitionLevel?.competitionLevelID) {
      competitionLevel.competitionLevelID =
        currentCompetitionLevel.competitionLevelID;
    }

    try {
      console.log(competitionLevel);
      if (currentCompetitionLevel) {
        await updateCompetitionYear(competitionLevel).unwrap();
        await showSuccessOk("อัปเดตข้อมูลเรียบร้อยแล้ว");
      } else {
        await addCompetitionYear(competitionLevel).unwrap();
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
        {currentCompetitionLevel ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}
      </h2>
      <Formik
        initialValues={initialCompetitionLevelValues}
        validationSchema={CompetitionLevelSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        <Form className="grid gap-4 md:grid-cols-2">
          <SelectInput
            name="levelID"
            label="ระดับชั้น"
            options={[
              { value: "", label: "เลือกระดับชั้น" },
              ...(CompetitionsLevel?.map((type: any) => ({
                value: type.levelID.toString(),
                label: type.levelName,
              })) || []),
            ]}
          />
          <TextInput
            name="competitionDateTime"
            label="วันที่และเวลาแข่งขัน"
            type="datetime-local"
          />
          {/* <TextInput
            name="maxTeamMembers"
            label="จำนวนสมาชิกทีมสูงสุด"
            type="number"
          />
          <TextInput
            name="minTeamMembers"
            label="จำนวนสมาชิกทีมขั้นต่ำ"
            type="number"
          /> */}
          <TextInput
            name="mainPlayersCount"
            label="จำนวนสมาชิก (หลัก)"
            type="number"
          />
          <TextInput
            name="reservePlayersCount"
            label="จำนวนสมาชิก (สำรอง)"
            type="number"
          />
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
