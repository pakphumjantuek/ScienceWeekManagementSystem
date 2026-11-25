import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileImage,
  PenTool,
  Shield,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useAddCertificateConfigMutation,
  useGetCertificateConfigQuery,
  useUpdateCertificateConfigMutation,
  useUploadCertificateBackgroundMutation,
  useUploadLogoMutation,
  useUploadSignatureMutation,
} from "../certificateApi";
import type { LogoRole, SignatureRole } from "../certificateApi";
import { useGetAllYearQuery } from "../../Year/YearApi";
import { withAdminAuth } from "../../../HOC";
import { showError, showSuccessOk } from "../../../utils/confirmDelete";
import type { CertificateConfig } from "../type";

type MaybeNum = number | "";
type UploadState = { selected: File | null; preview: string };

type AssetUploadCardProps = {
  acceptHint: string;
  buttonLabel: string;
  currentAlt: string;
  currentImage?: string;
  currentLabel: string;
  emptyCurrentLabel: string;
  emptySelectedLabel: string;
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  selectedFile: File | null;
  selectedImage?: string;
  selectedLabel: string;
  uploadInputId: string;
};

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const previewFrameClassName =
  "flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50";

function AssetPreview({
  alt,
  emptyLabel,
  src,
}: {
  alt: string;
  emptyLabel: string;
  src?: string;
}) {
  if (!src) {
    return (
      <div
        className={`${previewFrameClassName} border-dashed text-sm text-slate-400`}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={previewFrameClassName}>
      <img src={src} alt={alt} className="h-full w-full object-contain" />
    </div>
  );
}

function AssetUploadCard({
  acceptHint,
  buttonLabel,
  currentAlt,
  currentImage,
  currentLabel,
  emptyCurrentLabel,
  emptySelectedLabel,
  isUploading,
  onFileChange,
  onUpload,
  selectedFile,
  selectedImage,
  selectedLabel,
  uploadInputId,
}: AssetUploadCardProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">{currentLabel}</p>
          <AssetPreview
            alt={currentAlt}
            src={currentImage}
            emptyLabel={emptyCurrentLabel}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">
            {selectedLabel}
          </p>
          <AssetPreview
            alt={`${currentAlt} selected`}
            src={selectedImage}
            emptyLabel={emptySelectedLabel}
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <input
          id={uploadInputId}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        <label
          htmlFor={uploadInputId}
          className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-blue-400 hover:bg-blue-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <FileImage className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {selectedFile ? selectedFile.name : "เลือกไฟล์ภาพ"}
              </p>
              <p className="text-xs text-slate-500">{acceptHint}</p>
            </div>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            Browse
          </span>
        </label>

        <button
          onClick={onUpload}
          disabled={!selectedFile || isUploading}
          className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            selectedFile && !isUploading
              ? "bg-blue-700 text-white hover:bg-blue-800"
              : "cursor-not-allowed bg-slate-200 text-slate-500"
          }`}
        >
          {isUploading ? "กำลังอัปโหลด..." : buttonLabel}
        </button>
      </div>
    </div>
  );
}

const UploadBackgroundYear: React.FC = () => {
  const { yearId } = useParams<{ yearId: string }>();
  const navigate = useNavigate();

  const yidNum = useMemo(() => Number(yearId), [yearId]);
  const validYear = !!yearId && !Number.isNaN(yidNum);

  const { data: years = [] } = useGetAllYearQuery();
  const currentYearObj = useMemo(
    () => years.find((y) => y.yearID === yidNum),
    [years, yidNum],
  );

  const [startNumber, setStartNumber] = useState<MaybeNum>("");
  const [certificateName, setCertificateName] = useState<string>("");
  const [universityDeanTitle, setUniversityDeanTitle] = useState<string>(
    "อธิการบดีมหาวิทยาลัย",
  );
  const [universityDeanName, setUniversityDeanName] = useState<string>("");
  const [facultyDeanTitle, setFacultyDeanTitle] = useState<string>(
    "คณบดีคณะวิทยาศาสตร์และเทคโนโลยี",
  );
  const [facultyDeanName, setFacultyDeanName] = useState<string>("");

  const {
    data: cfg,
    isFetching: isConfigLoading,
    refetch: refetchConfig,
  } = useGetCertificateConfigQuery(yidNum, { skip: !validYear });

  const [addConfig, { isLoading: isCreating }] =
    useAddCertificateConfigMutation();
  const [updateConfig, { isLoading: isUpdating }] =
    useUpdateCertificateConfigMutation();

  const [selectedBgFile, setSelectedBgFile] = useState<File | null>(null);
  const [localBgPreview, setLocalBgPreview] = useState<string>("");
  const [logoUni, setLogoUni] = useState<UploadState>({
    selected: null,
    preview: "",
  });
  const [institute, setInstitute] = useState<UploadState>({
    selected: null,
    preview: "",
  });
  const [sigUni, setSigUni] = useState<UploadState>({
    selected: null,
    preview: "",
  });
  const [sigFaculty, setSigFaculty] = useState<UploadState>({
    selected: null,
    preview: "",
  });

  const [uploadBg, { isLoading: isUploadingBg }] =
    useUploadCertificateBackgroundMutation();
  const [uploadLogo, { isLoading: isUploadingLogo }] = useUploadLogoMutation();
  const [uploadSignature, { isLoading: isUploadingSig }] =
    useUploadSignatureMutation();

  const hasConfig = !!cfg;
  const isSaving = isConfigLoading || (hasConfig ? isUpdating : isCreating);
  const cacheBust = Date.now();

  useEffect(() => {
    if (!isConfigLoading) {
      if (cfg) {
        setStartNumber(cfg.startNumber ?? "");
        setCertificateName(cfg.certificateName ?? "");
        setUniversityDeanTitle(
          cfg.universityDeanTitle || "อธิการบดีมหาวิทยาลัย",
        );
        setUniversityDeanName(cfg.universityDeanName ?? "");
        setFacultyDeanTitle(
          cfg.facultyDeanTitle || "คณบดีคณะวิทยาศาสตร์และเทคโนโลยี",
        );
        setFacultyDeanName(cfg.facultyDeanName ?? "");
      } else {
        setStartNumber("");
        setCertificateName("");
        setUniversityDeanTitle("อธิการบดีมหาวิทยาลัย");
        setUniversityDeanName("");
        setFacultyDeanTitle("คณบดีคณะวิทยาศาสตร์และเทคโนโลยี");
        setFacultyDeanName("");
      }
    }
  }, [cfg, isConfigLoading]);

  useEffect(() => {
    return () => {
      [
        localBgPreview,
        logoUni.preview,
        institute.preview,
        sigUni.preview,
        sigFaculty.preview,
      ]
        .filter(Boolean)
        .forEach((url) => URL.revokeObjectURL(url));
    };
  }, [
    institute.preview,
    localBgPreview,
    logoUni.preview,
    sigFaculty.preview,
    sigUni.preview,
  ]);

  const validateForm = () => {
    if (startNumber === "" || Number.isNaN(Number(startNumber))) {
      showError("กรุณากรอกเลขรันเป็นตัวเลข");
      return false;
    }
    return true;
  };

  const handleSaveConfig = async () => {
    if (!validYear || !validateForm()) return;

    const payload: CertificateConfig = {
      yearID: yidNum,
      startNumber: Number(startNumber),
      certificateName: certificateName.trim(),
      universityDeanTitle: universityDeanTitle.trim(),
      universityDeanName: universityDeanName.trim(),
      facultyDeanTitle: facultyDeanTitle.trim(),
      facultyDeanName: facultyDeanName.trim(),
    };

    try {
      if (hasConfig) {
        await updateConfig(payload).unwrap();
        showSuccessOk("อัปเดตค่าตั้งค่าเกียรติบัตรสำเร็จ");
      } else {
        await addConfig(payload).unwrap();
        showSuccessOk("สร้างค่าตั้งค่าเกียรติบัตรสำเร็จ");
      }
      await refetchConfig();
    } catch (err: any) {
      showError(
        "ล้มเหลว: " +
          (err?.data?.errorMessages?.[0] || err?.message || "เกิดข้อผิดพลาด"),
      );
    }
  };

  const onBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (localBgPreview) URL.revokeObjectURL(localBgPreview);
    setSelectedBgFile(file);
    setLocalBgPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleUploadBg = async () => {
    if (!validYear || !selectedBgFile) return;
    try {
      await uploadBg({ yearId: yidNum, file: selectedBgFile }).unwrap();
      showSuccessOk("อัปโหลดพื้นหลังสำเร็จ");
      if (localBgPreview) URL.revokeObjectURL(localBgPreview);
      setSelectedBgFile(null);
      setLocalBgPreview("");
      await refetchConfig();
    } catch (err: any) {
      showError(
        "ล้มเหลว: " +
          (err?.data?.errorMessages?.[0] || err?.message || "เกิดข้อผิดพลาด"),
      );
    }
  };

  const onUploadStateChange =
    (
      setter: React.Dispatch<React.SetStateAction<UploadState>>,
      currentPreview: string,
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      setter({
        selected: file,
        preview: file ? URL.createObjectURL(file) : "",
      });
    };

  const doUploadLogo = async (
    role: LogoRole,
    state: UploadState,
    after: () => void,
  ) => {
    if (!validYear || !state.selected) return;
    try {
      await uploadLogo({ yearId: yidNum, role, file: state.selected }).unwrap();
      showSuccessOk(`อัปโหลดโลโก้ (${role}) สำเร็จ`);
      after();
      await refetchConfig();
    } catch (err: any) {
      showError(
        "ล้มเหลว: " +
          (err?.data?.errorMessages?.[0] || err?.message || "เกิดข้อผิดพลาด"),
      );
    }
  };

  const doUploadSignature = async (
    role: SignatureRole,
    state: UploadState,
    after: () => void,
  ) => {
    if (!validYear || !state.selected) return;
    try {
      await uploadSignature({
        yearId: yidNum,
        role,
        file: state.selected,
      }).unwrap();
      showSuccessOk(`อัปโหลดลายเซ็น (${role}) สำเร็จ`);
      after();
      await refetchConfig();
    } catch (err: any) {
      showError(
        "ล้มเหลว: " +
          (err?.data?.errorMessages?.[0] || err?.message || "เกิดข้อผิดพลาด"),
      );
    }
  };

  const resetUploadState = (
    state: UploadState,
    setter: React.Dispatch<React.SetStateAction<UploadState>>,
  ) => {
    if (state.preview) URL.revokeObjectURL(state.preview);
    setter({ selected: null, preview: "" });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_45%,_#f8fafc_100%)] px-4 py-6 font-sarabun sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-900 px-6 py-8 text-white shadow-2xl sm:px-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                Certificate Administration
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                จัดการเกียรติบัตร
                {currentYearObj?.yearNumber
                  ? `ประจำปี ${currentYearObj.yearNumber}`
                  : currentYearObj?.yearName
                    ? `ประจำ${currentYearObj.yearName}`
                    : "ประจำปีการศึกษา"}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-200 sm:text-base">
                ออกแบบค่าตั้งค่าเกียรติบัตรให้พร้อมใช้งานในบริบทมหาวิทยาลัย
                ทั้งเลขรัน ชื่อผู้ลงนาม พื้นหลัง ลายเซ็น และโลโก้ในหน้าเดียว
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-slate-300">ปีที่กำลังแก้ไข</p>
                <p className="mt-1 text-lg font-bold">
                  {currentYearObj
                    ? currentYearObj.yearNumber
                      ? `พ.ศ. ${currentYearObj.yearNumber}`
                      : currentYearObj.yearName
                    : validYear
                      ? `ID ${yidNum}`
                      : "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-slate-300">สถานะข้อมูล</p>
                <p className="mt-1 text-lg font-bold">
                  {hasConfig ? "พร้อมใช้งาน" : "ยังไม่สร้าง"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-300">การบันทึก</p>
                <p className="mt-1 text-lg font-bold">
                  {isConfigLoading ? "กำลังโหลด" : "พร้อมแก้ไข"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าก่อนหน้า
          </button>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            แนะนำให้ใช้ภาพพื้นหลังและโลโก้แบบพื้นโปร่งใสเพื่อผลลัพธ์ที่คมชัด
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">
                    ข้อมูลหลักของเกียรติบัตร
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    กำหนดเลขเริ่มต้น ชื่อรัน และชื่อผู้ลงนาม
                    เพื่อให้เอกสารแต่ละปีมีรูปแบบสม่ำเสมอ
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    เลขรันเกียรติบัตร
                  </label>
                  <input
                    type="number"
                    value={startNumber}
                    onChange={(e) =>
                      setStartNumber(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className={fieldClassName}
                    placeholder="เช่น 221"
                    min={0}
                    disabled={isConfigLoading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    ชื่อรันเกียรติบัตร
                  </label>
                  <input
                    type="text"
                    value={certificateName}
                    onChange={(e) => setCertificateName(e.target.value)}
                    className={fieldClassName}
                    placeholder='เช่น "SCI"'
                    maxLength={50}
                    disabled={isConfigLoading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    ตำแหน่งผู้ลงนามฝั่งซ้าย (ตำแหน่งที่ 1)
                  </label>
                  <input
                    type="text"
                    value={universityDeanTitle}
                    onChange={(e) => setUniversityDeanTitle(e.target.value)}
                    className={fieldClassName}
                    placeholder="เช่น อธิการบดีมหาวิทยาลัยราชภัฏกาญจนบุรี"
                    maxLength={150}
                    disabled={isConfigLoading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    ชื่อผู้ลงนามฝั่งซ้าย (ผู้ลงนามที่ 1)
                  </label>
                  <input
                    type="text"
                    value={universityDeanName}
                    onChange={(e) => setUniversityDeanName(e.target.value)}
                    className={fieldClassName}
                    placeholder="เช่น รองศาสตราจารย์ ดร. สมหมาย รักจริง"
                    maxLength={100}
                    disabled={isConfigLoading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    ตำแหน่งผู้ลงนามฝั่งขวา (ตำแหน่งที่ 2)
                  </label>
                  <input
                    type="text"
                    value={facultyDeanTitle}
                    onChange={(e) => setFacultyDeanTitle(e.target.value)}
                    className={fieldClassName}
                    placeholder="เช่น คณบดีคณะวิทยาศาสตร์และเทคโนโลยี"
                    maxLength={150}
                    disabled={isConfigLoading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    ชื่อผู้ลงนามฝั่งขวา (ผู้ลงนามที่ 2)
                  </label>
                  <input
                    type="text"
                    value={facultyDeanName}
                    onChange={(e) => setFacultyDeanName(e.target.value)}
                    className={fieldClassName}
                    placeholder="เช่น ผู้ช่วยศาสตราจารย์ ดร. สมหญิง จริงรัก"
                    maxLength={100}
                    disabled={isConfigLoading}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  การตั้งค่านี้จะถูกใช้เป็นข้อมูลพื้นฐานของเกียรติบัตรในปีการศึกษานี้
                </p>
                <button
                  onClick={handleSaveConfig}
                  disabled={!validYear || isSaving}
                  className={`inline-flex min-w-[210px] items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                    !validYear || isSaving
                      ? "cursor-not-allowed bg-slate-200 text-slate-500"
                      : hasConfig
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-emerald-700 text-white hover:bg-emerald-800"
                  }`}
                >
                  {isConfigLoading
                    ? "กำลังตรวจสอบ..."
                    : hasConfig
                      ? isUpdating
                        ? "กำลังอัปเดต..."
                        : "อัปเดตค่าตั้งค่า"
                      : isCreating
                        ? "กำลังสร้าง..."
                        : "สร้างค่าตั้งค่า"}
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <PenTool className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    ลายเซ็นผู้ลงนาม
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    อัปโหลดลายเซ็นแยกตามตำแหน่ง
                    เพื่อใช้งานกับแม่แบบเกียรติบัตรของมหาวิทยาลัย
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                <AssetUploadCard
                  acceptHint="รองรับไฟล์ภาพ เช่น PNG พื้นโปร่งใส"
                  buttonLabel="อัปโหลดลายเซ็นคณบดีมหาวิทยาลัย"
                  currentAlt="UniversityDean signature"
                  currentImage={
                    cfg?.universityDeanSignature
                      ? `${cfg.universityDeanSignature}?v=${cacheBust}`
                      : undefined
                  }
                  currentLabel="ลายเซ็นที่ใช้งานอยู่"
                  emptyCurrentLabel="ยังไม่มีลายเซ็นปัจจุบัน"
                  emptySelectedLabel="ยังไม่ได้เลือกไฟล์ใหม่"
                  isUploading={isUploadingSig || !validYear}
                  onFileChange={onUploadStateChange(setSigUni, sigUni.preview)}
                  onUpload={() =>
                    doUploadSignature("UniversityDean", sigUni, () =>
                      resetUploadState(sigUni, setSigUni),
                    )
                  }
                  selectedFile={sigUni.selected}
                  selectedImage={sigUni.preview}
                  selectedLabel="ไฟล์ที่เลือก"
                  uploadInputId="sig-uni-file"
                />

                <AssetUploadCard
                  acceptHint="รองรับไฟล์ภาพ เช่น PNG พื้นโปร่งใส"
                  buttonLabel="อัปโหลดลายเซ็นคณบดีคณะ"
                  currentAlt="FacultyDean signature"
                  currentImage={
                    cfg?.facultyDeanSignature
                      ? `${cfg.facultyDeanSignature}?v=${cacheBust}`
                      : undefined
                  }
                  currentLabel="ลายเซ็นที่ใช้งานอยู่"
                  emptyCurrentLabel="ยังไม่มีลายเซ็นปัจจุบัน"
                  emptySelectedLabel="ยังไม่ได้เลือกไฟล์ใหม่"
                  isUploading={isUploadingSig || !validYear}
                  onFileChange={onUploadStateChange(
                    setSigFaculty,
                    sigFaculty.preview,
                  )}
                  onUpload={() =>
                    doUploadSignature("FacultyDean", sigFaculty, () =>
                      resetUploadState(sigFaculty, setSigFaculty),
                    )
                  }
                  selectedFile={sigFaculty.selected}
                  selectedImage={sigFaculty.preview}
                  selectedLabel="ไฟล์ที่เลือก"
                  uploadInputId="sig-fac-file"
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <FileImage className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    โลโก้หน่วยงาน
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    แยกโลโก้ระดับมหาวิทยาลัยและคณะ
                    เพื่อให้วางในแม่แบบเอกสารได้อย่างเหมาะสม
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                <AssetUploadCard
                  acceptHint="แนะนำ PNG หรือ SVG ที่พื้นหลังโปร่งใส"
                  buttonLabel="อัปโหลดโลโก้มหาวิทยาลัย"
                  currentAlt="UniversityLogo"
                  currentImage={
                    cfg?.universityLogoPath
                      ? `${cfg.universityLogoPath}?v=${cacheBust}`
                      : undefined
                  }
                  currentLabel="โลโก้ที่ใช้งานอยู่"
                  emptyCurrentLabel="ยังไม่มีโลโก้มหาวิทยาลัย"
                  emptySelectedLabel="ยังไม่ได้เลือกไฟล์ใหม่"
                  isUploading={isUploadingLogo || !validYear}
                  onFileChange={onUploadStateChange(
                    setLogoUni,
                    logoUni.preview,
                  )}
                  onUpload={() =>
                    doUploadLogo("UniversityLogo", logoUni, () =>
                      resetUploadState(logoUni, setLogoUni),
                    )
                  }
                  selectedFile={logoUni.selected}
                  selectedImage={logoUni.preview}
                  selectedLabel="ไฟล์ที่เลือก"
                  uploadInputId="logo-uni-file"
                />

                <AssetUploadCard
                  acceptHint="แนะนำ PNG หรือ SVG ที่พื้นหลังโปร่งใส"
                  buttonLabel="อัปโหลดโลโก้คณะ/สถาบัน"
                  currentAlt="InstituteLogo"
                  currentImage={
                    cfg?.instituteLogoPath
                      ? `${cfg.instituteLogoPath}?v=${cacheBust}`
                      : undefined
                  }
                  currentLabel="โลโก้ที่ใช้งานอยู่"
                  emptyCurrentLabel="ยังไม่มีโลโก้คณะ/สถาบัน"
                  emptySelectedLabel="ยังไม่ได้เลือกไฟล์ใหม่"
                  isUploading={isUploadingLogo || !validYear}
                  onFileChange={onUploadStateChange(
                    setInstitute,
                    institute.preview,
                  )}
                  onUpload={() =>
                    doUploadLogo("InstituteLogo", institute, () =>
                      resetUploadState(institute, setInstitute),
                    )
                  }
                  selectedFile={institute.selected}
                  selectedImage={institute.preview}
                  selectedLabel="ไฟล์ที่เลือก"
                  uploadInputId="logo-institute-file"
                />
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                พื้นหลังเกียรติบัตร
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                ใช้ภาพแนวนอนที่มีสัดส่วนใกล้เคียงเอกสาร เพื่อจัดวางข้อความ
                ลายเซ็น และโลโก้ได้สวยสมดุล
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    พื้นหลังปัจจุบัน
                  </p>
                  <AssetPreview
                    alt="Current background"
                    src={
                      cfg?.certificateBackgroundPath
                        ? `${cfg.certificateBackgroundPath}?v=${cacheBust}`
                        : undefined
                    }
                    emptyLabel="ยังไม่มีภาพพื้นหลังที่ใช้งานอยู่"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    พรีวิวไฟล์ใหม่
                  </p>
                  <AssetPreview
                    alt="Selected preview"
                    src={localBgPreview || undefined}
                    emptyLabel="เลือกไฟล์เพื่อดูตัวอย่างก่อนอัปโหลด"
                  />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onBgFileChange}
                  className="hidden"
                  id="bg-file-upload"
                />
                <label
                  htmlFor="bg-file-upload"
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-blue-400 hover:bg-blue-50"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <FileImage className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedBgFile
                        ? selectedBgFile.name
                        : "เลือกไฟล์พื้นหลัง"}
                    </p>
                    <p className="text-xs text-slate-500">
                      แนะนำไฟล์ PNG หรือ JPG ความละเอียดสูง
                    </p>
                  </div>
                </label>

                <button
                  onClick={handleUploadBg}
                  disabled={!selectedBgFile || !validYear || isUploadingBg}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    selectedBgFile && !isUploadingBg && validYear
                      ? "bg-blue-700 text-white hover:bg-blue-800"
                      : "cursor-not-allowed bg-slate-200 text-slate-500"
                  }`}
                >
                  {isUploadingBg ? "กำลังอัปโหลด..." : "อัปโหลดภาพพื้นหลัง"}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-amber-200 bg-[linear-gradient(180deg,_#fffdf5_0%,_#fff7e6_100%)] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                แนวทางการใช้งาน
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <p>
                  1. บันทึกข้อมูลหลักก่อน เพื่อให้ชื่อผู้ลงนามและเลขรันถูกต้อง
                </p>
                <p>2. ใช้ลายเซ็นและโลโก้พื้นโปร่งใส เพื่อลดขอบขาวบนเอกสาร</p>
                <p>
                  3.
                  ภาพพื้นหลังควรเว้นพื้นที่ตรงกลางสำหรับชื่อผู้ได้รับเกียรติบัตร
                </p>
                <p>
                  4. หากเพิ่งอัปโหลดไฟล์ใหม่ ระบบจะรีเฟรชภาพล่าสุดให้อัตโนมัติ
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default withAdminAuth(UploadBackgroundYear);
