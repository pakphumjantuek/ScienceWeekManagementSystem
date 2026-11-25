import { Form, Formik } from "formik";
import * as Yup from "yup";
import { TextInput } from "../../../components/Inputs";
import FileUpload from "../../../components/Inputs/FileUpload";
import {
  useAddTeamProjectMutation,
  useUpdateTeamProjectMutation,
} from "../TeamProjectApi";
import type { TeamProject } from "../type";
import { showError, showSuccessOk } from "../../../utils/confirmDelete";
import { useModal } from "../../../components/modals/ModalContext";
import { useState } from "react";

interface TeamProjectFormProps {
  teamID: number;
  currentTeamProject?: TeamProject | null;
}

export const TeamProjectForm = ({
  teamID,
  currentTeamProject,
}: TeamProjectFormProps) => {
  const { hideModal } = useModal();
  const [addTeamProject, { isLoading }] = useAddTeamProjectMutation();
  const [updateTeamProject, { isLoading: isUpdating }] =
    useUpdateTeamProjectMutation();
  const [file, setFile] = useState<File | null>(null);

  const formSchema = Yup.object().shape({
    projectName: Yup.string().required("กรุณากรอกชื่อโครงงาน"),
  });

  const initialValues = {
    projectName: currentTeamProject?.projectName ?? "",
  };

  const handleSubmit = async (values: typeof initialValues) => {
    try {
      const formData = new FormData();
      formData.append("teamID", String(teamID));
      formData.append("projectName", values.projectName.trim());
      if (file) {
        formData.append("File", file);
      }

      if (currentTeamProject?.teamProjectID) {
        await updateTeamProject({
          teamProjectID: currentTeamProject.teamProjectID,
          formData,
        }).unwrap();
        await showSuccessOk("อัปเดตโครงงานสำเร็จ!");
      } else {
        if (!file) {
          await showError("กรุณาอัปโหลดไฟล์โครงงาน");
          return;
        }
        await addTeamProject(formData).unwrap();
        await showSuccessOk("เพิ่มโครงงานสำเร็จ!");
      }

      hideModal();
    } catch (error: any) {
      await showError(
        error?.data?.errorMessages?.[0] ??
          "ไม่สามารถบันทึกข้อมูลโครงงานได้ กรุณาลองใหม่",
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg relative">
      <button
        type="button"
        onClick={hideModal}
        className="absolute right-3 top-3 text-2xl text-gray-400 transition-colors hover:text-red-500"
        aria-label="Close modal"
      >
        &times;
      </button>

      <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">
        {currentTeamProject ? "แก้ไขโครงงาน" : "เพิ่มโครงงาน"}
      </h2>

      <Formik
        initialValues={initialValues}
        validationSchema={formSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form className="space-y-5">
            <div>
              <TextInput
                name="projectName"
                label="ชื่อโครงงาน"
                placeholder="เช่น การศึกษาประสิทธิภาพของ..."
              />
              {touched.projectName && errors.projectName && (
                <p className="mt-1 text-sm font-medium text-rose-600">
                  {String(errors.projectName)}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                ไฟล์โครงงาน
                {!currentTeamProject && (
                  <span className="text-rose-500"> *</span>
                )}
              </label>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <FileUpload
                  accept=".pdf,.doc,.docx,.zip,.rar"
                  file={file}
                  setFile={setFile}
                />
                {file ? (
                  <p className="mt-3 text-sm font-medium text-emerald-700">
                    ไฟล์ที่เลือก: {file.name}
                  </p>
                ) : currentTeamProject?.projectPDFLink ? (
                  <p className="mt-3 text-sm text-slate-500">
                    ยังไม่ได้เลือกไฟล์ใหม่ ระบบจะใช้ไฟล์เดิม
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    รองรับไฟล์ .pdf, .doc, .docx, .zip, .rar
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isUpdating}
              className="w-full rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
            >
              {isLoading || isUpdating ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};
