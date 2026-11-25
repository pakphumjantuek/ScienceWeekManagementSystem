// src/features/Team/pages/TeamFormPage.tsx
import {
  useAddTeamMutation,
  useUpdateTeamMutation,
  TeamApi,
} from "../../TeamApi";
import {
  useAddSchoolMutation,
  useGetDistrictsQuery,
  useGetProvincesQuery,
} from "../../../School/SchoolApi";
import { useCallback, useMemo, useState } from "react";
import * as Yup from "yup";
import { Form, Formik, Field } from "formik";
import { showError, showSuccessOk } from "../../../../utils/confirmDelete";
import {
  FileUpload,
  SelectInput,
  TextInput,
} from "../../../../components/Inputs";
import CreatableSelect from "react-select/creatable";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import type { RootState } from "../../../../Redux/store";
import { jwtDecode } from "jwt-decode";
import withAuth from "../../../../HOC/withAuth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useGetCompetitionLevelByIdQuery } from "../../../CompetitionLevel/CompetitionLevelApi";
import { useGetReportCompetitionLevelSummaryQuery } from "../../../PublicReport/PublicReportApi";
import type { TeamRegister } from "../../type";
import { TitlePrefix } from "../../../student/type";
import type { School } from "../../../School/type";
import CascadingSchoolPicker from "../../../../components/CascadingSchoolPicker";
import {
  useAddTeamProjectMutation,
  useGetTeamProjectByTeamIdQuery,
  useUpdateTeamProjectMutation,
} from "../../../TeamProject/TeamProjectApi";
import {
  CheckCircle2,
  Shield,
  ChevronRight,
  ArrowLeft,
  ClipboardList,
  ExternalLink,
  Plus,
  AlertCircle,
  Clock,
  Users,
  FileText,
  Info,
  Lock,
} from "lucide-react";

interface TeamFormProps {
  currentTeam?: TeamRegister | null;
  onTeamSaved?: (team: TeamRegister) => void;
}

type NewSchoolInput = {
  school_name: string;
  district: string;
  province: string;
};

type SelectOption = {
  value: string;
  label: string;
};

const EMPTY_TITLE_PREFIX = -1;
const ALLOWED_PROJECT_EXTENSIONS = ["pdf", "doc", "docx", "zip", "rar"];

const STEPS = ["เลือกปี", "เลือกกิจกรรม", "เลือกระดับชั้น", "ลงทะเบียน"];

/** Step indicator */
function StepsBar({ current = 4 }: { current?: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mt-5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 sm:gap-x-2">
      {STEPS.map((label, idx) => {
        const active = idx + 1 === current;
        return (
          <li key={label} className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-base sm:text-base font-medium whitespace-nowrap ${
                active ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-500"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-base font-bold ${
                  active ? "bg-white text-blue-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {idx + 1}
              </span>
              {label}
            </span>
            {idx < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
          </li>
        );
      })}
    </ol>
  );
}

/** One numbered form section, shows a check mark once its required fields are filled */
function SectionCard({
  number,
  title,
  hint,
  done,
  children,
}: {
  number: number;
  title: string;
  hint: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
        <span
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-base ${
            done ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"
          }`}
        >
          {done ? <CheckCircle2 className="w-5 h-5" /> : number}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold leading-snug">{title}</h2>
          <p className="text-sm sm:text-base text-slate-500">{hint}</p>
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

// Thai labels for the error summary next to the submit button
const FIELD_LABELS: Record<string, string> = {
  school_code: "สถานศึกษา",
  primaryTitlePrefix: "คำนำหน้าชื่อผู้ควบคุมทีมคนที่ 1",
  primaryOtherTitlePrefix: "คำนำหน้าชื่อ (อื่นๆ) ผู้ควบคุมทีมคนที่ 1",
  primaryFirstName: "ชื่อผู้ควบคุมทีมคนที่ 1",
  primaryLastName: "นามสกุลผู้ควบคุมทีมคนที่ 1",
  secondaryOtherTitlePrefix: "คำนำหน้าชื่อ (อื่นๆ) ผู้ควบคุมทีมคนที่ 2",
  projectName: "ชื่อโครงงาน",
  pdpaConsent: "การยินยอมข้อมูลส่วนบุคคล",
};

const TeamFormPage = ({ currentTeam: currentTeamProp }: TeamFormProps) => {
  const userId = useSelector((state: RootState) => state.userAuthStore.id);
  const dispatch = useDispatch();
  const [addTeam, { isLoading }] = useAddTeamMutation();
  const [addSchool] = useAddSchoolMutation();
  const [updateTeam, { isLoading: isUpdatingTeam }] = useUpdateTeamMutation();
  const [addTeamProject, { isLoading: isAddingProject }] =
    useAddTeamProjectMutation();
  const [updateTeamProject, { isLoading: isUpdatingProject }] =
    useUpdateTeamProjectMutation();
  const [file, setFile] = useState<File | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { competitionLevelID } = useParams();
  const { data: competitionLevel } = useGetCompetitionLevelByIdQuery(Number(competitionLevelID), { skip: !competitionLevelID });
  const baseUrl = import.meta.env.VITE_API_BASE_URLS;

  // รับค่าจากหน้าก่อน
  const {
    returnUrl,
    currentTeam: currentTeamFromState,
    requiresProject: requiresProjectFromState,
    mainPlayersCount,
    reservePlayersCount,
    competitionName,
    levelName,
    yearId,
    yearName,
    competitionYearID,
    registrationCloseDate,
    advisorCount: advisorCountFromState,
    registrationMode = "team",
    school_name,
    province,
    district,
    school_code: school_CodeFromState,
  } = (location.state as any) || {};
  // ไม่มีข้อมูลจากหน้าก่อน (รีเฟรช/เปิดลิงก์ตรง) → ไม่รู้วันปิดรับ จึงไม่ให้บันทึก
  const hasState = Boolean((location.state as any)?.competitionName);
  const advisorCount = competitionLevel?.advisorCount ?? advisorCountFromState ?? 2;

  // Whether a project file is required must come from the server, not from navigation
  // state: state is lost on refresh / direct links, which let teams register without a project.
  const {
    data: levelSummary,
    isLoading: isLevelSummaryLoading,
    isError: isLevelSummaryError,
  } = useGetReportCompetitionLevelSummaryQuery(Number(competitionLevelID), {
    skip: !competitionLevelID,
  });
  const requiresProject: boolean =
    levelSummary?.requiresProject ?? !!requiresProjectFromState;

  const currentTeam: TeamRegister | null =
    currentTeamFromState ?? currentTeamProp ?? null;
  const { data: existingProjects = [] } = useGetTeamProjectByTeamIdQuery(
    currentTeam?.teamID ?? 0,
    {
      skip: !currentTeam?.teamID,
    },
  );
  const currentProject = existingProjects[0];
  const currentProjectFileLink =
    currentProject?.projectPDFLink ?? (currentTeam as any)?.projectPDFLink;
  const currentProjectName =
    currentProject?.projectName ?? (currentTeam as any)?.projectName;
  const deadlineEndOfDay = useMemo(() => {
    if (!registrationCloseDate) return null;
    const deadlineDate = new Date(registrationCloseDate);
    if (Number.isNaN(deadlineDate.getTime())) return null;
    const hasTime = registrationCloseDate.includes("T") || registrationCloseDate.includes(":");
    if (!hasTime) {
      deadlineDate.setHours(23, 59, 59, 999);
    }
    return deadlineDate;
  }, [registrationCloseDate]);
  const userRole = useSelector((state: RootState) => state.userAuthStore.role);
  const isStaffOrAdmin = (() => {
    let role = userRole || "";
    if (!role) {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          role =
            decoded?.role ||
            decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
            decoded?.Role ||
            "";
        } catch (e) {
          console.error(e);
        }
      }
    }
    const r = String(role).toLowerCase();
    return (
      r === "admin" ||
      r === "staff" ||
      r === "เจ้าหน้าที่" ||
      r === "ผู้ดูแลระบบ" ||
      r.includes("admin") ||
      r.includes("staff")
    );
  })();
  const isEditExpired = !!deadlineEndOfDay && new Date() > deadlineEndOfDay && !isStaffOrAdmin;
  const daysLeft = deadlineEndOfDay
    ? Math.ceil((deadlineEndOfDay.getTime() - Date.now()) / 86_400_000)
    : null;
  const deadlineLabel = deadlineEndOfDay
    ? `${new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric" }).format(deadlineEndOfDay)} (${String(deadlineEndOfDay.getHours()).padStart(2, "0")}:${String(deadlineEndOfDay.getMinutes()).padStart(2, "0")} น.)`
    : "";
  const teamRegisterState = {
    requiresProject,
    mainPlayersCount,
    reservePlayersCount,
    competitionName,
    levelName,
    yearId,
    yearName,
    competitionYearID,
    registrationCloseDate,
    advisorCount,
    registrationMode,
  };

  // เพิ่มสถานศึกษาแบบ inline
  const [showNewSchoolForm, setShowNewSchoolForm] = useState(false);
  const [showExtraAdvisors, setShowExtraAdvisors] = useState(false);
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [newSchool, setNewSchool] = useState<NewSchoolInput>({
    school_name: "",
    district: "",
    province: "",
  });
  const { data: provinces = [] } = useGetProvincesQuery();
  const { data: districts = [], isLoading: isDistrictLoading } =
    useGetDistrictsQuery(newSchool.province, { skip: !newSchool.province });

  const provinceOptions = useMemo<SelectOption[]>(
    () =>
      provinces.map((item) => ({
        value: item,
        label: item,
      })),
    [provinces],
  );

  const districtOptions = useMemo<SelectOption[]>(
    () =>
      districts.map((item) => ({
        value: item,
        label: item,
      })),
    [districts],
  );
  const titlePrefixOptions = useMemo(
    () => [
      { value: EMPTY_TITLE_PREFIX, label: "กรุณาเลือกคำนำหน้า" },
      ...TitlePrefix.filter((prefix) => prefix.value >= 0 && prefix.value <= 2),
      { value: 7, label: "อื่นๆ" },
    ],
    [],
  );

  // วาลิเดชัน
  const TeamSchema = useMemo(
    () =>
      Yup.object().shape({
        school_code: Yup.number().required("กรุณาเลือกสถานศึกษา"),
        primaryTitlePrefix: Yup.number()
          .moreThan(EMPTY_TITLE_PREFIX, "กรุณาเลือกคำนำหน้าชื่อ")
          .required("กรุณาเลือกคำนำหน้าชื่อ"),
        primaryFirstName: Yup.string().required("กรุณากรอกชื่อ"),
        primaryLastName: Yup.string().required("กรุณากรอกนามสกุล"),
        primaryOtherTitlePrefix: Yup.string().when("primaryTitlePrefix", { is: 7, then: (schema) => schema.required("กรุณาระบุคำนำหน้าชื่อ") }),
        secondaryTitlePrefix: Yup.number().optional(),
        secondaryFirstName: Yup.string().optional(),
        secondaryLastName: Yup.string().optional(),
        secondaryOtherTitlePrefix: Yup.string().when("secondaryTitlePrefix", { is: 7, then: (schema) => schema.required("กรุณาระบุคำนำหน้าชื่อ") }),
        projectName: Yup.string().when([], {
          is: () => !!requiresProject,
          then: (schema) => schema.required("กรุณากรอกชื่อโครงงาน"),
        }),
        pdpaConsent: Yup.boolean()
          .oneOf([true], "กรุณายินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล")
          .required("กรุณายินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล"),
      }),
    [requiresProject],
  );

  const initialValues: TeamRegister & {
    projectName?: string;
    pdpaConsent: boolean;
  } = {
    teamID: currentTeam?.teamID || undefined,
    primaryTitlePrefix:
      currentTeam?.primaryTitlePrefix ?? EMPTY_TITLE_PREFIX,
    primaryFirstName: currentTeam?.primaryFirstName ?? "",
    primaryOtherTitlePrefix: currentTeam?.primaryOtherTitlePrefix ?? "",
    primaryLastName: currentTeam?.primaryLastName ?? "",
    secondaryTitlePrefix:
      currentTeam?.secondaryTitlePrefix ?? EMPTY_TITLE_PREFIX,
    secondaryFirstName: currentTeam?.secondaryFirstName ?? "",
    secondaryOtherTitlePrefix: currentTeam?.secondaryOtherTitlePrefix ?? "",
    thirdTitlePrefix: currentTeam?.thirdTitlePrefix ?? EMPTY_TITLE_PREFIX,
    thirdFirstName: currentTeam?.thirdFirstName ?? "",
    thirdLastName: currentTeam?.thirdLastName ?? "",
    fourthTitlePrefix: currentTeam?.fourthTitlePrefix ?? EMPTY_TITLE_PREFIX,
    fourthFirstName: currentTeam?.fourthFirstName ?? "",
    fourthLastName: currentTeam?.fourthLastName ?? "",
    fifthTitlePrefix: currentTeam?.fifthTitlePrefix ?? EMPTY_TITLE_PREFIX,
    fifthFirstName: currentTeam?.fifthFirstName ?? "",
    fifthLastName: currentTeam?.fifthLastName ?? "",
    secondaryLastName: currentTeam?.secondaryLastName ?? "",
    userId: currentTeam?.userId || userId || "",
    competitionLevelID: Number(competitionLevelID),
    projectName: currentTeam?.projectName ?? "",
    school_code: currentTeam?.school_code ?? school_CodeFromState ?? undefined,
    pdpaConsent: false,
  };

  const handleCreateSchool = useCallback(
    async (setFieldValue: (field: string, value: any) => void) => {
      if (!newSchool.school_name?.trim()) {
        await showError("กรุณากรอกชื่อสถานศึกษา");
        return;
      }

      // helper: ถ้าเป็นสตริงว่างให้เป็น undefined
      const clean = (v?: string) => (v && v.trim() ? v.trim() : undefined);

      try {
        setIsAddingSchool(true);

        const payload: School = {
          school_name: newSchool.school_name.trim(),
          district: clean(newSchool.district),
          province: clean(newSchool.province),
        };

        const created = await addSchool(payload).unwrap();

        setFieldValue("school_code", Number((created as any).school_code));

        // เคลียร์ฟอร์ม
        setNewSchool({
          school_name: "",
          district: "",
          province: "",
        });
        setShowNewSchoolForm(false);

        await showSuccessOk(
          `เพิ่ม "${(created as any).school_name}" สำเร็จ และเลือกให้แล้ว`,
        );
      } catch (e: any) {
        await showError(
          e?.data?.errorMessages?.[0] ??
            e?.message ??
            "ไม่สามารถเพิ่มสถานศึกษาได้ กรุณาลองใหม่",
        );
      } finally {
        setIsAddingSchool(false);
      }
    },
    [addSchool, newSchool],
  );

  const handleSubmit = async (values: typeof initialValues) => {
    if (isEditExpired || !hasState) {
      await showError("หมดสิทธิ์แก้ไขข้อมูลทีมแล้ว");
      return;
    }

    // ครูคนที่ 2 ขึ้นไป: ถ้ากรอกบางช่อง ต้องกรอกให้ครบ (ชื่อจะไปอยู่บนเกียรติบัตร)
    for (const { key, number } of extraAdvisorKeys) {
      const v = values as any;
      const first = v[`${key}FirstName`]?.trim();
      const last = v[`${key}LastName`]?.trim();
      if ((first || last) && !(first && last)) {
        await showError(
          `กรุณากรอกชื่อและนามสกุลของครูผู้ควบคุมทีมคนที่ ${number} ให้ครบ หรือลบออกให้ว่างทั้งคู่`,
        );
        return;
      }
    }

    // Validate the project BEFORE any API call, so we never save a team half-way
    if (isLevelSummaryLoading) {
      await showError("กำลังตรวจสอบเงื่อนไขกิจกรรม กรุณารอสักครู่แล้วกดบันทึกอีกครั้ง");
      return;
    }
    if (isLevelSummaryError && requiresProjectFromState === undefined) {
      await showError("ไม่สามารถตรวจสอบเงื่อนไขกิจกรรมได้ กรุณารีเฟรชหน้าแล้วลองใหม่");
      return;
    }
    if (requiresProject) {
      if (!values.projectName?.trim()) {
        await showError("กรุณากรอกชื่อโครงงาน");
        return;
      }
      const hasExistingFile = !!currentTeam && !!currentProjectFileLink;
      if (!file && !hasExistingFile) {
        await showError("กิจกรรมนี้ต้องแนบไฟล์โครงงาน กรุณาเลือกไฟล์ก่อนบันทึก");
        return;
      }
    }
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_PROJECT_EXTENSIONS.includes(ext)) {
        await showError("ไฟล์โครงงานต้องเป็น .pdf .doc .docx .zip หรือ .rar เท่านั้น");
        return;
      }
      if (file.size === 0) {
        await showError("ไฟล์โครงงานว่างเปล่า กรุณาเลือกไฟล์ใหม่");
        return;
      }
    }

    const normalizedPrimaryTitlePrefix =
      values.primaryTitlePrefix === EMPTY_TITLE_PREFIX
        ? EMPTY_TITLE_PREFIX
        : values.primaryTitlePrefix;
    const normalizedSecondaryTitlePrefix =
      values.secondaryTitlePrefix === EMPTY_TITLE_PREFIX
        ? 0
        : values.secondaryTitlePrefix;

    try {
      // โหมดแก้ไข
      if (currentTeam?.teamID) {
        await updateTeam({
          ...(values as TeamRegister),
          primaryTitlePrefix: normalizedPrimaryTitlePrefix,
          secondaryTitlePrefix: normalizedSecondaryTitlePrefix,
          competitionLevelID: Number(competitionLevelID),
        }).unwrap();

        if (requiresProject && currentTeam.teamID) {
          const existingProject = existingProjects[0];
          const projectFormData = new FormData();
          projectFormData.append("teamID", String(currentTeam.teamID));
          projectFormData.append("projectName", values.projectName ?? "");

          if (file) {
            projectFormData.append("File", file);
          }

          if (existingProject?.teamProjectID) {
            if (file || values.projectName !== existingProject.projectName) {
              await updateTeamProject({
                teamProjectID: existingProject.teamProjectID,
                formData: projectFormData,
              }).unwrap();
              dispatch(TeamApi.util.invalidateTags(["Team"]));
            }
          } else if (file) {
            await addTeamProject(projectFormData).unwrap();
            dispatch(TeamApi.util.invalidateTags(["Team"]));
          }
        }

        await showSuccessOk("อัปเดตข้อมูลทีมสำเร็จ!");
        if (returnUrl) {
          navigate(returnUrl, { state: teamRegisterState });
        } else {
          navigate(`/teamregister/${competitionLevelID}`, {
            state: teamRegisterState,
          });
        }
        return;
      }

      // โหมดสร้างใหม่
      const formData = new FormData();
      formData.append(
        "primaryTitlePrefix",
        normalizedPrimaryTitlePrefix.toString(),
      );
      formData.append("primaryFirstName", values.primaryFirstName ?? "");
      formData.append("primaryOtherTitlePrefix", values.primaryOtherTitlePrefix ?? "");
      formData.append("primaryLastName", values.primaryLastName ?? "");
      formData.append(
        "secondaryTitlePrefix",
        normalizedSecondaryTitlePrefix.toString(),
      );
      formData.append("secondaryFirstName", values.secondaryFirstName ?? "");
      formData.append("secondaryOtherTitlePrefix", values.secondaryOtherTitlePrefix ?? "");
      ["third", "fourth", "fifth"].forEach((key) => {
        formData.append(`${key}TitlePrefix`, String((values as any)[`${key}TitlePrefix`] === EMPTY_TITLE_PREFIX ? 0 : (values as any)[`${key}TitlePrefix`]));
        formData.append(`${key}FirstName`, (values as any)[`${key}FirstName`] ?? "");
        formData.append(`${key}LastName`, (values as any)[`${key}LastName`] ?? "");
      });
      formData.append("secondaryLastName", values.secondaryLastName ?? "");
      formData.append("competitionLevelID", String(competitionLevelID));
      formData.append("projectName", values.projectName ?? "");
      if (typeof values.school_code !== "number") {
        await showError("กรุณาเลือกสถานศึกษา");
        return;
      }
      formData.append("school_code", String(values.school_code));
      if (requiresProject && !file) {
        await showError("กรุณาอัปโหลดไฟล์โครงงาน");
        return;
      }
      if (file) formData.append("File", file);

      const savedTeam = await addTeam(formData).unwrap();
      await showSuccessOk("เพิ่มทีมสำเร็จ!");

      navigate(`/team/${savedTeam.teamID}/players`, {
        state: {
          mainPlayersCount,
          reservePlayersCount,
          registrationMode,
          requiresProject,
          competitionName,
          levelName,
          yearId,
          yearName,
          competitionYearID,
          registrationCloseDate,
          advisorCount,
          competitionLevelID: Number(competitionLevelID),
        },
      });
    } catch (error: any) {
      await showError(
        error?.data?.errorMessages?.[0] ??
          "ไม่สามารถบันทึกข้อมูลทีมได้ กรุณาลองใหม่",
      );
    }
  };


  const isSaving =
    isLoading || isAddingProject || isUpdatingTeam || isUpdatingProject;

  const goBack = () => {
    // มาจากการพาไปอัตโนมัติ (ยังไม่มีทีม) → ข้ามหน้ารายการทีม ไม่งั้นจะเด้งกลับมาฟอร์มอีก
    if ((location.state as any)?.backToLevelList && !currentTeam && competitionYearID) {
      navigate(`/competitionLevelUserList/${competitionYearID}`, {
        state: teamRegisterState,
      });
      return;
    }
    if (returnUrl) {
      navigate(returnUrl, { state: teamRegisterState });
    } else {
      navigate(`/teamregister/${competitionLevelID}`, {
        state: teamRegisterState,
      });
    }
  };

  const advisorFields = (key: string, number: number, required: boolean, values: any) => {
    const prefixName = `${key}TitlePrefix`;
    const otherName = `${key}OtherTitlePrefix`;
    const star = required ? " *" : "";
    return (
      <div key={key}>
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          ผู้ควบคุมทีมคนที่ {number}
          {required ? (
            <span className="text-base font-semibold text-rose-600">(จำเป็น)</span>
          ) : (
            <span className="text-base font-medium text-slate-400">(ไม่บังคับ)</span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <SelectInput<number>
              label={`คำนำหน้าชื่อ${star}`}
              name={prefixName}
              options={titlePrefixOptions}
              className="border-slate-300 bg-white text-slate-900 text-base py-3 focus:border-blue-500 focus:ring-blue-500"
            />
            {values[prefixName] === 7 && (key === "primary" || key === "secondary") && (
              <TextInput
                label="ระบุคำนำหน้าชื่อ *"
                name={otherName}
                placeholder="เช่น ดร., ผศ."
                className="mt-3 border-slate-300 bg-white text-slate-900 text-base py-3"
              />
            )}
          </div>
          <TextInput
            label={`ชื่อ${star}`}
            name={`${key}FirstName`}
            placeholder="เช่น สมชาย"
            className="border-slate-300 bg-white text-slate-900 text-base py-3 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
          />
          <TextInput
            label={`นามสกุล${star}`}
            name={`${key}LastName`}
            placeholder="เช่น ใจดี (ถ้าไม่มีใส่ -)"
            className="border-slate-300 bg-white text-slate-900 text-base py-3 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  };

  const extraAdvisorKeys = [
    { key: "secondary", number: 2 },
    { key: "third", number: 3 },
    { key: "fourth", number: 4 },
    { key: "fifth", number: 5 },
  ].filter(({ number }) => number === 2 || advisorCount >= number);

  const hasExtraAdvisorData = extraAdvisorKeys.some(
    ({ key }) => !!(initialValues as any)[`${key}FirstName`],
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-28 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* ===== Header ===== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-1.5">
          <span className="flex-1 bg-blue-600" />
          <span className="flex-1 bg-emerald-500" />
          <span className="flex-1 bg-amber-500" />
          <span className="flex-1 bg-rose-500" />
        </div>
        <div className="relative w-full px-4 sm:px-6 lg:px-10 py-7 md:py-10 text-center">
          <button
            type="button"
            onClick={goBack}
            className="mb-4 md:mb-0 md:absolute md:left-10 md:top-8 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            ย้อนกลับ
          </button>

          {(competitionName || levelName) && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              {competitionName && (
                <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded-full text-base font-bold">
                  {competitionName}
                </span>
              )}
              {levelName && (
                <span className="bg-blue-700 text-white px-3 py-1 rounded-full text-base font-bold">
                  ระดับ {levelName}
                </span>
              )}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            {currentTeam ? "แก้ไขข้อมูลทีม" : "ลงทะเบียนทีมใหม่"}
          </h1>
          <p className="mt-2 text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
            กรอกข้อมูลทีละขั้นด้านล่าง ข้อมูลนี้ใช้สำหรับติดต่อและออกเกียรติบัตร
          </p>
          <StepsBar />
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 mt-5 sm:mt-6 space-y-5">
        {!hasState ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 text-center">
            <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl md:text-2xl font-bold mb-2">กรุณาเลือกกิจกรรมใหม่อีกครั้ง</h3>
            <p className="text-slate-500 text-base md:text-lg mb-6">
              ไม่พบข้อมูลกิจกรรมจากหน้าก่อนหน้า (อาจเกิดจากการรีเฟรชหน้า)
            </p>
            <button
              type="button"
              onClick={() => navigate(`/yearuser`)}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              ไปหน้าเลือกปี / กิจกรรม
            </button>
          </div>
        ) : (
        <>
        {isEditExpired && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3 text-base text-amber-900">
            <Lock className="w-5 h-5 mt-0.5 shrink-0 text-amber-700" />
            <span>
              <b>หมดสิทธิ์แก้ไขข้อมูลทีมแล้ว</b>
              {deadlineLabel && ` (ปิดรับ ${deadlineLabel})`} — ดูข้อมูลได้อย่างเดียว
            </span>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white px-4 sm:px-5 py-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm sm:text-base text-slate-700">
          {deadlineLabel && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              ปิดรับ <b>{deadlineLabel}</b>
              {!isEditExpired && daysLeft !== null && daysLeft >= 0 && (
                <span className={`font-semibold ${daysLeft <= 3 ? "text-rose-600" : "text-amber-700"}`}>
                  · {daysLeft === 0 ? "ปิดวันนี้" : `เหลือ ${daysLeft} วัน`}
                </span>
              )}
            </span>
          )}
          {registrationMode !== "individual" && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              นักเรียนตัวจริง <b>{mainPlayersCount ?? "-"}</b> · สำรอง <b>{reservePlayersCount ?? "-"}</b> คน
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            {requiresProject ? "ต้องแนบไฟล์โครงงาน" : "ไม่ต้องแนบไฟล์โครงงาน"}
          </span>
        </div>

        {!currentTeam && !isEditExpired && (
          <p className="flex items-start gap-2 text-sm sm:text-base text-slate-600">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-blue-600" />
            <span>
              กรอกข้อมูลด้านล่างให้ครบ แล้วกด <b>"บันทึกและไปเพิ่มนักเรียน"</b> —
              ระบบจะพาไปหน้าเพิ่มรายชื่อนักเรียนในทีมต่อ
            </span>
          </p>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={TeamSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, isSubmitting, setFieldValue, submitCount }) => {
            const schoolDone = typeof values.school_code === "number";
            const advisorDone =
              values.primaryTitlePrefix !== EMPTY_TITLE_PREFIX &&
              !!values.primaryFirstName?.trim() &&
              !!values.primaryLastName?.trim();
            const projectDone =
              !!values.projectName?.trim() && (!!file || !!currentTeam);
            const missing = Object.keys(errors).map((k) => FIELD_LABELS[k] ?? k);

            return (
              <Form className="space-y-5">
                <fieldset disabled={isEditExpired} className="space-y-5 min-w-0 disabled:opacity-70">
                {/* 1. School */}
                <SectionCard
                  number={1}
                  title="โรงเรียน / สถานศึกษา"
                  hint="เลือกจังหวัด → อำเภอ → พิมพ์ค้นหาชื่อโรงเรียน"
                  done={schoolDone}
                >
                  <CascadingSchoolPicker
                    name="school_code"
                    initialSchoolLabel={school_name}
                    initialProvince={province}
                    initialDistrict={district}
                  />
                  {touched.school_code && errors.school_code && (
                    <p className="mt-2 text-base text-rose-600 font-medium">
                      {String(errors.school_code)}
                    </p>
                  )}

                  {!showNewSchoolForm ? (
                    <button
                      type="button"
                      onClick={() => setShowNewSchoolForm(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-2.5 text-base font-medium text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      หาโรงเรียนไม่เจอ? เพิ่มโรงเรียนใหม่
                    </button>
                  ) : (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
                      <h3 className="text-base font-bold mb-1">เพิ่มโรงเรียนใหม่</h3>
                      <p className="text-base text-slate-600 mb-4">
                        ถ้าไม่มีจังหวัดหรืออำเภอในรายการ พิมพ์เพิ่มเองได้
                      </p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="block text-base font-medium text-slate-700">
                            ชื่อโรงเรียน <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="เช่น โรงเรียนสาธิตมหาวิทยาลัย..."
                            value={newSchool.school_name}
                            onChange={(e) =>
                              setNewSchool((s) => ({ ...s, school_name: e.target.value }))
                            }
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-base font-medium text-slate-700">จังหวัด</label>
                          <CreatableSelect<SelectOption, false>
                            inputId="new-school-province"
                            isSearchable
                            isClearable
                            formatCreateLabel={(inputValue) => `เพิ่มจังหวัด "${inputValue}"`}
                            placeholder="ค้นหาและเลือกจังหวัด"
                            options={provinceOptions}
                            value={
                              newSchool.province
                                ? { value: newSchool.province, label: newSchool.province }
                                : null
                            }
                            onChange={(option) =>
                              setNewSchool((s) => ({
                                ...s,
                                province: option?.value ?? "",
                                district: option?.value === s.province ? s.district : "",
                              }))
                            }
                            onCreateOption={(inputValue) =>
                              setNewSchool((s) => ({ ...s, province: inputValue.trim(), district: "" }))
                            }
                            className="text-base"
                            menuPortalTarget={document.body}
                            menuPlacement="auto"
                            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                            classNamePrefix="react-select"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-base font-medium text-slate-700">อำเภอ/เขต</label>
                          <CreatableSelect<SelectOption, false>
                            inputId="new-school-district"
                            isSearchable
                            isClearable
                            isDisabled={!newSchool.province}
                            isLoading={isDistrictLoading}
                            formatCreateLabel={(inputValue) => `เพิ่มอำเภอ/เขต "${inputValue}"`}
                            placeholder={newSchool.province ? "ค้นหาและเลือกอำเภอ" : "เลือกจังหวัดก่อน"}
                            options={districtOptions}
                            value={
                              newSchool.district
                                ? { value: newSchool.district, label: newSchool.district }
                                : null
                            }
                            onChange={(option) =>
                              setNewSchool((s) => ({ ...s, district: option?.value ?? "" }))
                            }
                            onCreateOption={(inputValue) =>
                              setNewSchool((s) => ({ ...s, district: inputValue.trim() }))
                            }
                            className="text-base"
                            menuPortalTarget={document.body}
                            menuPlacement="auto"
                            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                            classNamePrefix="react-select"
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          disabled={isAddingSchool || !newSchool.school_name.trim()}
                          onClick={() => handleCreateSchool(setFieldValue)}
                          className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-base font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition-colors cursor-pointer"
                        >
                          {isAddingSchool ? "กำลังบันทึก..." : "บันทึกและเลือกโรงเรียนนี้"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewSchoolForm(false)}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* 2. Advisors */}
                <SectionCard
                  number={2}
                  title="ครูผู้ควบคุมทีม"
                  hint="กรอกอย่างน้อย 1 คน ชื่อนี้จะแสดงบนเกียรติบัตร"
                  done={advisorDone}
                >
                  <div className="space-y-6">
                    {advisorFields("primary", 1, true, values)}

                    {showExtraAdvisors || hasExtraAdvisorData ? (
                      extraAdvisorKeys.map(({ key, number }) =>
                        advisorFields(key, number, false, values),
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowExtraAdvisors(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-base font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        เพิ่มครูผู้ควบคุมทีมคนอื่น (ไม่บังคับ)
                      </button>
                    )}
                  </div>
                </SectionCard>

                {/* 3. Project */}
                {requiresProject && (
                  <SectionCard
                    number={3}
                    title="ข้อมูลโครงงาน"
                    hint="ใส่ชื่อโครงงาน และแนบไฟล์โครงงาน"
                    done={projectDone}
                  >
                    <div className="space-y-5">
                      <div>
                        <TextInput
                          label="ชื่อโครงงาน *"
                          name="projectName"
                          placeholder="เช่น การศึกษาประสิทธิภาพของ..."
                          className="border-slate-300 bg-white text-slate-900 text-base py-3 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-base text-slate-500">
                          ชื่อนี้จะแสดงในเอกสารและประกาศผล
                        </p>
                      </div>

                      <div>
                        <label className="block mb-2 text-base font-medium text-slate-800">
                          {currentTeam ? "เปลี่ยนไฟล์โครงงาน (ถ้าต้องการ)" : "ไฟล์โครงงาน"}
                          {!currentTeam && <span className="text-rose-500"> *</span>}
                        </label>
                        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 sm:p-6">
                          <FileUpload
                            accept=".pdf,.doc,.docx,.zip,.rar"
                            file={file}
                            setFile={setFile}
                          />
                          {file ? (
                            <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              <p className="min-w-0 break-all text-base font-medium text-emerald-800">
                                เลือกไฟล์แล้ว: {file.name}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-3 text-base text-slate-500 text-center">
                              รองรับ .pdf .doc .docx .zip .rar · ตั้งชื่อไฟล์เช่น ชื่อโรงเรียน-ชื่อโครงงาน
                            </p>
                          )}
                          {currentTeam && !file && (
                            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-base font-semibold text-blue-900">ไฟล์เดิม</p>
                                <p className="line-clamp-2 text-base text-blue-950">
                                  {currentProjectName || "เอกสารโครงงานที่เคยอัปโหลดไว้"}
                                </p>
                                <p className="text-base text-blue-700">ถ้าไม่เลือกไฟล์ใหม่ ระบบจะใช้ไฟล์นี้ต่อ</p>
                              </div>
                              {currentProjectFileLink ? (
                                <a
                                  href={`${baseUrl}${currentProjectFileLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-base font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  เปิดไฟล์เดิม
                                </a>
                              ) : (
                                <span className="shrink-0 text-base text-slate-500">ไม่มีไฟล์เดิม</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* PDPA Consent */}
                <section
                  className={`rounded-2xl border p-4 sm:p-5 ${
                    values.pdpaConsent ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <Field
                      type="checkbox"
                      name="pdpaConsent"
                      className="mt-1 h-6 w-6 shrink-0 rounded border-slate-300 bg-white text-blue-700 focus:ring-blue-600"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-base font-bold">
                        <Shield className="w-5 h-5 text-blue-600" />
                        ความยินยอมในการเก็บรวบรวม ใช้ และประมวลผลข้อมูลส่วนบุคคล
                      </span>
                      <span className="mt-1 block text-sm sm:text-base leading-relaxed text-slate-600">
                        ข้าพเจ้าได้อ่านและเข้าใจรายละเอียดเกี่ยวกับการเก็บรวบรวม ใช้ และประมวลผลข้อมูลส่วนบุคคล
                        และยินยอมให้หน่วยงานเก็บรวบรวม ใช้ และประมวลผลข้อมูลส่วนบุคคลที่ข้าพเจ้าให้ไว้ผ่านแบบฟอร์มนี้
                        ซึ่งรวมถึงข้อมูลสถานศึกษา ข้อมูลผู้สมัคร ข้อมูลอาจารย์ที่ปรึกษา และข้อมูลโครงงาน
                        เพื่อดำเนินการรับสมัคร ตรวจสอบคุณสมบัติและข้อมูลที่เกี่ยวข้อง พิจารณาการเข้าร่วมกิจกรรม
                        ประกาศผล และจัดทำเอกสารที่เกี่ยวข้องตามวัตถุประสงค์ของการดำเนินกิจกรรม
                      </span>
                      <span className="mt-2 block text-sm sm:text-base leading-relaxed text-slate-600">
                        หน่วยงานจะดำเนินการเกี่ยวกับข้อมูลส่วนบุคคลดังกล่าวเท่าที่จำเป็นและตามวัตถุประสงค์ที่แจ้งไว้
                        โดยคำนึงถึงสิทธิของเจ้าของข้อมูลส่วนบุคคลและปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคลที่เกี่ยวข้อง
                      </span>
                    </span>
                  </label>
                  {touched.pdpaConsent && errors.pdpaConsent && (
                    <p className="text-base text-rose-600 font-medium pl-9 mt-2">
                      {String(errors.pdpaConsent)}
                    </p>
                  )}
                </section>
                </fieldset>

                {/* Error summary */}
                {submitCount > 0 && missing.length > 0 && (
                  <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-base text-rose-900">
                      <p className="font-bold">ยังกรอกไม่ครบ กรุณาตรวจสอบ:</p>
                      <ul className="mt-1 list-disc pl-5">
                        {missing.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Actions: sticky at the bottom so the save button is always reachable */}
                <div className="sticky bottom-0 z-20 -mx-3 sm:mx-0 border-t sm:border sm:rounded-2xl border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sm:p-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex justify-center items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    ย้อนกลับ
                  </button>

                  {!isEditExpired && (
                    <button
                      type="submit"
                      disabled={isSaving || isSubmitting || isLevelSummaryLoading}
                      className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-700 px-8 py-3.5 text-white text-base font-bold hover:bg-blue-800 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {isSaving || isSubmitting
                        ? "กำลังบันทึกข้อมูล..."
                        : currentTeam
                          ? "บันทึกการแก้ไข"
                          : "บันทึกและไปเพิ่มนักเรียน"}
                      {!(isSaving || isSubmitting) && <ChevronRight className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </Form>
            );
          }}
        </Formik>
        </>
        )}
      </main>
    </div>
  );
};

export default withAuth(TeamFormPage);
