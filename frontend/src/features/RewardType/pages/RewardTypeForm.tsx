import {
  useAddRewardTypeMutation,
  useUpdateRewardTypeMutation,
} from "../RewardTypeApi";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { showError, showSuccessOk } from "../../../utils/confirmDelete";
import type { RewardType } from "../type";
import { useModal } from "../../../components/modals/ModalContext";
import { TextInput } from "../../../components/Inputs";

interface RewardTypeFormProps {
  currentRewardType?: RewardType | null;
  onClear: () => void;
}

export const RewardTypeForm = ({ currentRewardType }: RewardTypeFormProps) => {
  const [addRewardType, { isLoading }] = useAddRewardTypeMutation();
  const [updateRewardType, { isLoading: isUpdating }] =
    useUpdateRewardTypeMutation();
  const { hideModal } = useModal();

  const RewardTypeSchema = Yup.object().shape({
    rewardTypeName: Yup.string()
      .required("กรุณากรอกประเภทรางวัล")
      .min(3, "ประเภทรางวัลต้องมีอย่างน้อย 3 ตัวอักษร"),
  });

  const initialValues = {
    rewardTypeName: currentRewardType?.rewardTypeName || "",
  };

  const handleSubmit = async (values: Omit<RewardType, "id">) => {
    const rewardTypes: RewardType = {
      ...values,
    };
    if (currentRewardType) {
      rewardTypes.rewardTypeID = currentRewardType.rewardTypeID;
    }
    try {
      if (currentRewardType) {
        await updateRewardType(rewardTypes).unwrap();
        await showSuccessOk("อัพเดทรางวัลสำเร็จ!");
      } else {
        await addRewardType(rewardTypes).unwrap();
        await showSuccessOk("เพิ่มรางวัลสำเร็จ!");
      }
      hideModal();
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ??
        "ไม่สามารถบันทึกข้อมูลรางวัลได้ กรุณาลองใหม่";
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
        {currentRewardType ? "แก้ไขชื่อรางวัล" : "เพิ่มชื่อรางวัล"}
      </h2>
      <Formik
        initialValues={initialValues}
        validationSchema={RewardTypeSchema}
        onSubmit={handleSubmit}
      >
        <Form className="space-y-3">
          <TextInput
            name="rewardTypeName"
            label="ชื่อรางวัล"
            placeholder="ระบุชื่อรางวัลของคุณ"
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
