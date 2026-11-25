import { useAddStudentMutation, useUpdateStudentMutation } from "../StudentApi";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { TitlePrefix, type Student } from "../type";
import { useModal } from "../../../components/modals/ModalContext";
import { SelectInput, TextInput } from "../../../components/Inputs";
import { showError, showSuccessOk } from "../../../utils";

interface StudentFormProps {
  currentStudent?: Student | null;
  onClear: () => void;
  teamId?: number | string;
}

export const StudentForm = ({
  currentStudent,
  onClear,
  teamId,
}: StudentFormProps) => {
  const [addStudent, { isLoading }] = useAddStudentMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const { hideModal } = useModal();

  const StudentSchema = Yup.object().shape({
    firstName: Yup.string()
      .required("กรุณากรอกชื่อ")
      .min(1, "ชื่อต้องมีอย่างน้อย 1 ตัวอักษร"),
    lastName: Yup.string()
      .required("กรุณากรอกนามสกุล")
      .min(1, "นามสกุลต้องมีอย่างน้อย 1 ตัวอักษร"),
  });

  const initialStudentValues: Student = {
    firstName: currentStudent?.firstName || "",
    lastName: currentStudent?.lastName || "",
    isMainMember: currentStudent?.isMainMember || true,
    titlePrefix: currentStudent?.titlePrefix || 0,
  };

  const handleSubmit = async (values: Omit<Student, "id">) => {
    const student: Student = {
      ...values,
      teamID: Number(teamId),
    };

    if (currentStudent?.studentID) {
      student.studentID = currentStudent.studentID;
    }

    try {
      if (currentStudent) {
        await updateStudent(student).unwrap();
        await showSuccessOk("อัปเดตผู้เล่นเรียบร้อยแล้ว");
      } else {
        await addStudent(student).unwrap();
        await showSuccessOk("เพิ่มผู้เล่นเรียบร้อยแล้ว");
      }
      onClear();
      hideModal();
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ??
        "ไม่สามารถบันทึกข้อมูลผู้เล่นได้ กรุณาลองใหม่";
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
        {currentStudent ? "แก้ไขผู้เล่น" : "เพิ่มผู้เล่น"}
      </h2>
      <Formik
        initialValues={initialStudentValues}
        validationSchema={StudentSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        <Form className="space-y-3">
          <SelectInput<number>
            name="titlePrefix"
            label="คำนำหน้าชื่อ"
            options={TitlePrefix}
          />
          <TextInput name="firstName" label="ชื่อ" placeholder="โปรดกรอกชื่อ" />
          <TextInput
            name="lastName"
            label="นามสกุล"
            placeholder="โปรดกรอกนามสกุล"
          />
          <SelectInput<boolean>
            name="isMainMember"
            label="เลือกบทบาทผู้เล่น"
            options={[
              { value: true, label: "ตัวจริง" },
              { value: false, label: "ตัวสำรอง" },
            ]}
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
