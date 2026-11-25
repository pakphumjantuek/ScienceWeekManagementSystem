import { useAddSchoolMutation, useUpdateSchoolMutation } from "../SchoolApi";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { type School } from "../type";
import { useModal } from "../../../components/modals/ModalContext";
import { TextInput } from "../../../components/Inputs";
import { showError, showSuccessOk } from "../../../utils";

interface SchoolFormProps {
  currentSchool?: School | null;
  onClear: () => void;
}

export const SchoolForm = ({ currentSchool, onClear }: SchoolFormProps) => {
  const [addSchool, { isLoading }] = useAddSchoolMutation();
  const [updateSchool, { isLoading: isUpdating }] = useUpdateSchoolMutation();
  const { hideModal } = useModal();

  const SchoolSchema = Yup.object().shape({
    school_name: Yup.string()
      .required("กรุณากรอกชื่อโรงเรียน")
      .min(3, "ชื่อโรงเรียนต้องมีอย่างน้อย 3 ตัวอักษร"),
  });

  const initialSchoolValues: School = {
    school_name: currentSchool?.school_name || "",
    subdistrict: currentSchool?.subdistrict || "",
    district: currentSchool?.district || "",
    province: currentSchool?.province || "",
  };

  const handleSubmit = async (values: Omit<School, "school_code">) => {
    const school: School = {
      ...values,
      school_code: currentSchool?.school_code || 0,
    };
    if (currentSchool?.school_code) {
      school.school_code = currentSchool.school_code;
    }
    try {
      if (currentSchool) {
        await updateSchool(school).unwrap();
        await showSuccessOk("อัปเดตโรงเรียนเรียบร้อยแล้ว");
      } else {
        await addSchool(school).unwrap();
        await showSuccessOk("เพิ่มโรงเรียนเรียบร้อยแล้ว");
      }
      onClear();
      hideModal();
      console.log(school);
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ??
        "ไม่สามารถบันทึกข้อมูลโรงเรียนได้ กรุณาลองใหม่";
      await showError(errorMessage);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-xl shadow-lg relative">
      <button
        onClick={hideModal}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl"
        aria-label="Close"
      >
        &times;
      </button>
      <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
        {currentSchool ? "แก้ไขโรงเรียน" : "เพิ่มโรงเรียน"}
      </h2>
      <Formik
        initialValues={initialSchoolValues}
        validationSchema={SchoolSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        <Form className="space-y-3">
          <TextInput
            name="school_name"
            label="ชื่อโรงเรียน"
            placeholder="โปรดกรอกชื่อโรงเรียน"
          />
          <TextInput
            name="subdistrict"
            label="ตำบล"
            placeholder="โปรดกรอกตำบล"
          />
          <TextInput
            name="district"
            label="อำเภอ"
            placeholder="โปรดกรอกอำเภอ"
          />
          <TextInput
            name="province"
            label="จังหวัด"
            placeholder="โปรดกรอกจังหวัด"
          />

          <div className="flex gap-3 justify-end">
            <button
              type="submit"
              disabled={isLoading || isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading || isUpdating ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </Form>
      </Formik>
    </div>
  );
};
