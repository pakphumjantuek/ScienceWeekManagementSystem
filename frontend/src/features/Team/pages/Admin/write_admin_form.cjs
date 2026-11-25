const fs = require('fs');
const path = require('path');

const content = `import { useUpdateTeamMutation } from "../../TeamApi";
import { useMemo } from "react";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { showError, showSuccessOk } from "../../../../utils/confirmDelete";
import { SelectInput, TextInput } from "../../../../components/Inputs";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../Redux/store";
import { useLocation, useNavigate } from "react-router-dom";
import type { TeamRegister } from "../../type";
import { TitlePrefix } from "../../../student/type";
import { withStaffAuth } from "../../../../HOC";

interface TeamFormProps {
  currentTeam?: TeamRegister | null;
  onTeamSaved?: (team: TeamRegister) => void;
}

const AdminFormPage = ({ currentTeam: currentTeamProp }: TeamFormProps) => {
  const userId = useSelector((state: RootState) => state.userAuthStore.id);
  const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation();

  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as any) || {};
  const {
    returnUrl,
    currentTeam: currentTeamFromState,
    requiresProject,
    competitionLevelID,
    school_name,
    competitionName,
    yearId,
    yearName,
    competitionYearID,
    mainPlayersCount,
  } = locationState;

  const currentTeam: TeamRegister | null =
    currentTeamFromState ?? currentTeamProp ?? null;

  const TeamSchema = useMemo(
    () =>
      Yup.object().shape({
        primaryTitlePrefix: Yup.number().required("กรุณากรอกคำนำหน้าชื่อ"),
        primaryFirstName: Yup.string().required("กรุณากรอกชื่อ"),
        primaryLastName: Yup.string().required("กรุณากรอกนามสกุล"),
        secondaryTitlePrefix: Yup.number().optional(),
        secondaryFirstName: Yup.string().optional(),
        secondaryLastName: Yup.string().optional(),
      }),
    []
  );

  const initialValues: TeamRegister & {
    projectName?: string;
    dataAccuracyConfirmed: boolean;
    consentAccepted: boolean;
  } = {
    teamID: currentTeam?.teamID || undefined,
    primaryTitlePrefix: currentTeam?.primaryTitlePrefix ?? 0,
    primaryFirstName: currentTeam?.primaryFirstName ?? "",
    primaryLastName: currentTeam?.primaryLastName ?? "",
    secondaryTitlePrefix: currentTeam?.secondaryTitlePrefix ?? 0,
    secondaryFirstName: currentTeam?.secondaryFirstName ?? "",
    secondaryLastName: currentTeam?.secondaryLastName ?? "",
    userId: currentTeam?.userId || userId || "",
    competitionLevelID: Number(competitionLevelID),
    projectName: currentTeam?.projectName ?? "",
    school_code: currentTeam?.school_code ?? (undefined as unknown as number),
    dataAccuracyConfirmed: false,
    consentAccepted: false,
  };

  const handleSubmit = async (values: typeof initialValues) => {
    try {
      if (currentTeam?.teamID) {
        await updateTeam({
          ...currentTeam,
          ...values,
          school_code: currentTeam.school_code,
        } as TeamRegister).unwrap();
        await showSuccessOk("อัปเดตข้อมูลอาจารย์ที่ปรึกษาสำเร็จ!");
        if (returnUrl) {
          navigate(returnUrl, {
            state: {
              requiresProject,
              competitionName,
              competitionLevelID: Number(competitionLevelID),
              yearId,
              yearName,
              competitionYearID,
              mainPlayersCount,
            },
          });
          return;
        }
        const isROV = competitionName?.toLowerCase().includes("rov");
        const isStaff = location.pathname.startsWith("/staff");
        const prefix = isStaff ? "/staff" : "/admin";
        navigate(
          \`\${prefix}/competitionLevel/\${competitionLevelID}/\${
            isROV ? "matchrov" : "match"
          }\`,
          {
            state: {
              requiresProject,
              competitionName,
              competitionLevelID: Number(competitionLevelID),
              yearId,
              yearName,
              competitionYearID,
              mainPlayersCount,
            },
          }
        );
        return;
      }
    } catch (error: any) {
      await showError(
        error?.data?.errorMessages?.[0] ??
          "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่"
      );
    }
  };

  const displaySchoolName = school_name || currentTeam?.school_name || "-";

  return (
    <div className="min-h-screen bg-slate-50 font-sarabun">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Page header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 text-indigo-700 px-3.5 py-1 text-xs font-semibold">
            จัดการข้อมูลทีม
          </div>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            แก้ไขข้อมูลอาจารย์ที่ปรึกษา / ผู้ควบคุมทีม
          </h1>
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-sm text-blue-900 font-medium">
            <span>สถานศึกษา:</span>
            <span className="font-bold text-blue-700">{displaySchoolName}</span>
          </div>
        </header>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200">
          <div className="p-6 md:p-8">
            <Formik
              initialValues={initialValues}
              validationSchema={TeamSchema}
              enableReinitialize
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-8 text-slate-800">
                  {/* Section: Managers */}
                  <section>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 border-b pb-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                        1
                      </span>
                      ข้อมูลอาจารย์ที่ปรึกษา / ผู้ควบคุมทีม
                    </h2>

                    <div className="mt-6 space-y-6">
                      {/* Advisor 1 */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <h3 className="text-sm font-bold text-indigo-900 mb-3">
                          อาจารย์ที่ปรึกษา / ผู้ควบคุมทีม คนที่ 1 (หลัก) *
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <SelectInput<number>
                              label="คำนำหน้าชื่อ *"
                              name="primaryTitlePrefix"
                              options={TitlePrefix}
                              className="border-slate-300 focus:border-indigo-600 focus:ring-indigo-600 bg-white"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <TextInput
                              label="ชื่อ *"
                              name="primaryFirstName"
                              placeholder="เช่น สมชาย"
                              className="border-slate-300 focus:border-indigo-600 focus:ring-indigo-600 bg-white"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <TextInput
                              label="นามสกุล *"
                              name="primaryLastName"
                              placeholder="เช่น ใจดี"
                              className="border-slate-300 focus:border-indigo-600 focus:ring-indigo-600 bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Advisor 2 */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 mb-3">
                          อาจารย์ที่ปรึกษา / ผู้ควบคุมทีม คนที่ 2 (สำรอง/ไม่บังคับ)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <SelectInput<number>
                              label="คำนำหน้าชื่อ (ไม่บังคับ)"
                              name="secondaryTitlePrefix"
                              options={TitlePrefix}
                              className="border-slate-300 focus:border-indigo-600 focus:ring-indigo-600 bg-white"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <TextInput
                              label="ชื่อ (ไม่บังคับ)"
                              name="secondaryFirstName"
                              placeholder="เช่น สมหญิง"
                              className="border-slate-300 focus:border-indigo-600 focus:ring-indigo-600 bg-white"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <TextInput
                              label="นามสกุล (ไม่บังคับ)"
                              name="secondaryLastName"
                              placeholder="เช่น กตัญญู"
                              className="border-slate-300 focus:border-indigo-600 focus:ring-indigo-600 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Footer actions */}
                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (returnUrl) {
                          navigate(returnUrl, {
                            state: {
                              requiresProject,
                              competitionName,
                              competitionLevelID: Number(competitionLevelID),
                              yearId,
                              yearName,
                              competitionYearID,
                              mainPlayersCount,
                            },
                          });
                          return;
                        }
                        const isROV = competitionName?.toLowerCase().includes("rov");
                        const isStaff = location.pathname.startsWith("/staff");
                        const prefix = isStaff ? "/staff" : "/admin";
                        navigate(
                          \`\${prefix}/competitionLevel/\${competitionLevelID}/\${
                            isROV ? "matchrov" : "match"
                          }\`,
                          {
                            state: {
                              requiresProject,
                              competitionName,
                              competitionLevelID: Number(competitionLevelID),
                              yearId,
                              yearName,
                              competitionYearID,
                              mainPlayersCount,
                            },
                          }
                        );
                      }}
                      className="inline-flex justify-center items-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      ย้อนกลับ
                    </button>
                    <div className="sm:ml-auto w-full sm:w-auto">
                      <button
                        type="submit"
                        disabled={isUpdating || isSubmitting}
                        className="w-full inline-flex justify-center items-center rounded-lg bg-indigo-700 px-5 py-3 text-white font-medium shadow-sm hover:bg-indigo-800 disabled:opacity-60"
                      >
                        {isUpdating || isSubmitting
                          ? "กำลังบันทึก..."
                          : "บันทึกการแก้ไข"}
                      </button>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withStaffAuth(AdminFormPage);
`;

fs.writeFileSync(path.join(__dirname, 'AdminFormPage.tsx'), content, 'utf8');
