import {
  useAddCompetitionMutation,
  useUpdateCompetitionMutation,
} from "../CompetitionApi";
import { useGetAllCompetitionTypeQuery } from "../../CompetitionType/CompetitionTypeApi";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { showError, showSuccessOk } from "../../../utils/confirmDelete";
import type { Competition } from "../type";
import { useModal } from "../../../components/modals/ModalContext";
import { SelectInput, TextInput } from "../../../components/Inputs";

interface CompetitionFormProps {
  currentCompetition?: Competition | null;
  onClear: () => void;
}

export const CompetitionForm = ({
  currentCompetition,
}: CompetitionFormProps) => {
  const [addCompetition, { isLoading }] = useAddCompetitionMutation();
  const [updateCompetition, { isLoading: isUpdating }] =
    useUpdateCompetitionMutation();
  const { data: CompetitionTypes } = useGetAllCompetitionTypeQuery();

  const { hideModal } = useModal();

  const CompetitionSchema = Yup.object().shape({
    competitionName: Yup.string()
      .required("กรุณากรอกชื่อการแข่งขัน")
      .min(3, "ชื่อการแข่งขันต้องมีอย่างน้อย 3 ตัวอักษร"),
    competitionTypeID: Yup.number()
      .required("กรุณาเลือกประเภทการแข่งขัน")
      .typeError("ประเภทการแข่งขันต้องเป็นตัวเลข"),
    description: Yup.string().optional(),
    coordinatorName: Yup.string()
      .optional()
      .min(3, "ชื่อผู้ประสานงานต้องมีอย่างน้อย 3 ตัวอักษร"),
    coordinatorPhone: Yup.string()
      .optional()
      .matches(/^[0-9]{10}$/, "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก"),
    requiresProject: Yup.boolean().optional(),
  });

  const initialCompetitionValues: Competition = {
    competitionID: currentCompetition?.competitionID ?? undefined,
    competitionName: currentCompetition?.competitionName ?? "",
    competitionTypeID: currentCompetition?.competitionTypeID ?? 0,
    coordinatorName: currentCompetition?.coordinatorName ?? "",
    coordinatorPhone: currentCompetition?.coordinatorPhone ?? "",
    requiresProject: currentCompetition?.requiresProject ?? false,
  };

  const handleSubmit = async (values: Omit<Competition, "id">) => {
    const competition: Competition = {
      ...values,
    };
    if (currentCompetition) {
      competition.competitionID = currentCompetition.competitionID;
    }
    try {
      if (currentCompetition) {
        await updateCompetition(competition).unwrap();
        await showSuccessOk("อัพเดทกิจกรรมการแข่งสำเร็จ!");
      } else {
        await addCompetition(competition).unwrap();
        await showSuccessOk("เพิ่มกิจกรรมการแข่งสำเร็จ!");
      }
      hideModal();
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ??
        "ไม่สามารถบันทึกข้อมูลทีมได้ กรุณาลองใหม่";
      await showError(errorMessage);
    }
    console.log(competition);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg relative">
      <button
        onClick={hideModal}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors text-2xl z-10"
        aria-label="Close modal"
      >
        &times;
      </button>

      <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
        {currentCompetition
          ? "แก้ไขกิจกรรมการเเข่งขัน"
          : "เพิ่มกิจกรรมการเเข่งขัน"}
      </h2>
      <Formik
        initialValues={initialCompetitionValues}
        validationSchema={CompetitionSchema}
        onSubmit={handleSubmit}
      >
        <Form className="space-y-3">
          <SelectInput
            name="competitionTypeID"
            label="ประเภทการแข่งขัน"
            options={[
              { value: "", label: "กรุณาเลือกประเภทการแข่งขัน" },
              ...(CompetitionTypes?.map((type: any) => ({
                value: type.competitionTypeID,
                label: type.competitionTypeName,
              })) || []),
            ]}
          />
          <TextInput
            name="competitionName"
            label="ชื่อกิจกรรมการเเข่งขัน"
            placeholder="ระบุชื่อกิจกรรมการเเข่งขันของคุณ"
          />
          <TextInput
            name="coordinatorName"
            label="ชื่อผู้จัดกิจกรรมการเเข่งขัน"
            placeholder="ระบุชื่อกิจกรรมการเเข่งขันของคุณ"
          />
          <TextInput
            name="coordinatorPhone"
            label="เบอร์โทรผู้จัดกิจกรรมการเเข่งขัน"
            placeholder="ระบุชื่อกิจกรรมการเเข่งขันของคุณ"
          />

          <SelectInput<boolean>
            name="requiresProject"
            label="ต้องมีโครงงาน?"
            options={[
              { value: true, label: "มี" },
              { value: false, label: "ไม่มี" },
            ]}
          />

          <button
            type="submit"
            disabled={isLoading || isUpdating}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition duration-300 font-medium disabled:opacity-60 mt-4"
          >
            {isLoading || isUpdating ? "กำลังดำเนินการ..." : "บันทึกข้อมูล"}
          </button>
        </Form>
      </Formik>
    </div>
  );
};
