import {
  useAddCompetitionTypeMutation,
  useUpdateCompetitionTypeMutation,
} from "../CompetitionTypeApi";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { showError, showSuccessOk } from "../../../utils/confirmDelete";
import type { CompetitionType } from "../type";
import { useModal } from "../../../components/modals/ModalContext";
import { TextInput } from "../../../components/Inputs";

interface CompetitionTypeFormProps {
  currentCompetitionType?: CompetitionType | null;
  onClear: () => void;
}

export const CompetitionTypeForm = ({
  currentCompetitionType,
}: CompetitionTypeFormProps) => {
  const [addCompetitionType, { isLoading }] = useAddCompetitionTypeMutation();
  const [updateCompetitionType, { isLoading: isUpdating }] =
    useUpdateCompetitionTypeMutation();
  const { hideModal } = useModal();

  const CompetitionTypeSchema = Yup.object().shape({
    competitionTypeName: Yup.string()
      .required("กรุณากรอกชื่อประเภทการแข่งขัน")
      .min(3, "ชื่อประเภทการแข่งขันต้องมีอย่างน้อย 3 ตัวอักษร"),
  });

  const initialValues = {
    competitionTypeName: currentCompetitionType?.competitionTypeName || "",
  };

  const handleSubmit = async (values: Omit<CompetitionType, "id">) => {
    const competitionType: CompetitionType = {
      ...values,
    };
    if (currentCompetitionType) {
      competitionType.competitionTypeID =
        currentCompetitionType.competitionTypeID;
    }
    try {
      if (currentCompetitionType) {
        await updateCompetitionType(competitionType).unwrap();
        await showSuccessOk("อัพเดทประเภทการแข่งขันสำเร็จ!");
      } else {
        await addCompetitionType(competitionType).unwrap();
        await showSuccessOk("เพิ่มประเภทการแข่งขันสำเร็จ!");
      }
      hideModal();
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ??
        "ไม่สามารถบันทึกข้อมูลประเภทการแข่งขันได้ กรุณาลองใหม่";
      await showError(errorMessage);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8 bg-white rounded-xl shadow-lg relative">
      <button
        onClick={hideModal}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors text-2xl z-10"
        aria-label="Close modal"
      >
        &times;
      </button>

      <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
        {currentCompetitionType
          ? "แก้ไขประเภทการแข่งขัน"
          : "เพิ่มประเภทการแข่งขัน"}
      </h2>
      <Formik
        initialValues={initialValues}
        validationSchema={CompetitionTypeSchema}
        onSubmit={handleSubmit}
      >
        <Form className="space-y-3">
          <TextInput
            name="competitionTypeName"
            label="ชื่อประเภทการแข่งขัน"
            placeholder="ระบุชื่อประเภทการแข่งขันของคุณ"
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
