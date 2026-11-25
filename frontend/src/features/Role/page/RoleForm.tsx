import { useAddRoleMutation, useUpdateRoleMutation } from "../roleApi";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { showError, showSuccessOk } from "../../../utils/confirmDelete";
import type { Role } from "../type";
import { useModal } from "../../../components/modals/ModalContext";
import { TextInput } from "../../../components/Inputs";

interface RoleFormProps {
  currentRole?: Role | null; // ถ้ามี => โหมดแก้ไข
  onClear: () => void;
}

type FormValues = {
  name: string;
  updateName: string;
};

export const RoleForm = ({ currentRole }: RoleFormProps) => {
  const [addRole, { isLoading }] = useAddRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const { hideModal } = useModal();

  const isEdit = !!currentRole;

  // ✅ validate ตามโหมด
  const RoleSchema = Yup.object().shape({
    name: Yup.string().when([], {
      // ใช้ name เฉพาะโหมดเพิ่ม
      is: () => !isEdit,
      then: (s) =>
        s
          .required("กรุณากรอกสิทธิ์")
          .min(3, "สิทธิ์ต้องมีอย่างน้อย 3 ตัวอักษร"),
      otherwise: (s) => s.notRequired(),
    }),
    updateName: Yup.string().when([], {
      // ใช้ updateName เฉพาะโหมดแก้ไข
      is: () => isEdit,
      then: (s) =>
        s
          .required("กรุณากรอกชื่อสิทธิ์ใหม่")
          .min(3, "สิทธิ์ต้องมีอย่างน้อย 3 ตัวอักษร"),
      otherwise: (s) => s.notRequired(),
    }),
  });

  const initialValues: FormValues = {
    // เพิ่ม: เริ่มด้วย name ว่าง
    // แก้ไข: เติมทั้ง name และ updateName = ชื่อเดิม เพื่อให้ผู้ใช้แก้ได้สะดวก
    name: currentRole?.name ?? "",
    updateName: currentRole?.name ?? "",
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      if (isEdit && currentRole) {
        // ✅ อัปเดต: ส่งเฉพาะ { id, updateName }
        await updateRole({
          id: currentRole.id,
          name: values.updateName,
          updateName: values.updateName,
        }).unwrap();
        await showSuccessOk("อัพเดทสิทธิ์สำเร็จ!");
      } else {
        await addRole({ name: values.name }).unwrap();
        await showSuccessOk("เพิ่มสิทธิ์สำเร็จ!");
      }
      hideModal();
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ??
        "ไม่สามารถบันทึกข้อมูลสิทธิ์ได้ กรุณาลองใหม่";
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
        {isEdit ? "แก้ไขชื่อสิทธิ์" : "เพิ่มชื่อสิทธิ์"}
      </h2>

      <Formik
        initialValues={initialValues}
        validationSchema={RoleSchema}
        onSubmit={handleSubmit}
      >
        <Form className="space-y-3">
          {!isEdit && (
            <TextInput
              name="name"
              label="ชื่อสิทธิ์"
              placeholder="ระบุชื่อสิทธิ์ของคุณ"
            />
          )}

          {isEdit && (
            <TextInput
              name="updateName"
              label="ชื่อสิทธิ์ใหม่"
              placeholder="ระบุชื่อสิทธิ์ใหม่"
            />
          )}

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
