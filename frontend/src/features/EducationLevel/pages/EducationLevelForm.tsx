import {
  useAddEducationLevelMutation,
  useUpdateEducationLevelMutation,
} from "../EducationLevelApi";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { showError, showSuccessOk } from "../../../utils/confirmDelete";
import type { EducationLevel } from "../type";
import { useModal } from "../../../components/modals/ModalContext";
import { TextInput } from "../../../components/Inputs";

interface EducationLevelFormProps {
  currentEducationLevel?: EducationLevel | null;
  onClear: () => void;
}

export const EducationLevelForm = ({
  currentEducationLevel,
}: EducationLevelFormProps) => {
  const [addEducationLevel, { isLoading }] = useAddEducationLevelMutation();
  const [updateEducationLevel, { isLoading: isUpdating }] =
    useUpdateEducationLevelMutation();
  const { hideModal } = useModal();

  const EducationLevelSchema = Yup.object().shape({
    levelName: Yup.string()
      .required("กรุณากรอกระดับชั้น")
      .min(3, "ระดับชั้นต้องมีอย่างน้อย 3 ตัวอักษร"),
  });

  const initialValues = {
    levelName: currentEducationLevel?.levelName || "",
  };

  const handleSubmit = async (values: Omit<EducationLevel, "id">) => {
    const educationLevels: EducationLevel = {
      ...values,
    };
    if (currentEducationLevel) {
      educationLevels.levelID = currentEducationLevel.levelID;
    }
    try {
      if (currentEducationLevel) {
        await updateEducationLevel(educationLevels).unwrap();
        await showSuccessOk("อัพเดทระดับชั้นสำเร็จ!");
      } else {
        await addEducationLevel(educationLevels).unwrap();
        await showSuccessOk("เพิ่มระดับชั้นการแข่งสำเร็จ!");
      }
      hideModal();
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ??
        "ไม่สามารถบันทึกข้อมูลระดับชั้นได้ กรุณาลองใหม่";
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
        {currentEducationLevel
          ? "แก้ไขระดับชั้นการเเข่งขัน"
          : "เพิ่มระดับชั้นการเเข่งขัน"}
      </h2>
      <Formik
        initialValues={initialValues}
        validationSchema={EducationLevelSchema}
        onSubmit={handleSubmit}
      >
        <Form className="space-y-3">
          <TextInput
            name="levelName"
            label="ระดับชั้น"
            placeholder="ระบุระดับชั้นของคุณ"
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
