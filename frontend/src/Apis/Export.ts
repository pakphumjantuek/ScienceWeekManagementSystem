import { showError } from "../utils";
import { API_BASE_URL } from "../config";

const baseUrlApi = API_BASE_URL;
const exportBaseUrl = `${String(baseUrlApi).replace(/\/+$/, "")}/export`;
const getAuthHeader = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return {} as Record<string, string>;
  }

  return { Authorization: `Bearer ${token}` } satisfies Record<string, string>;
};

// ดึงไฟล์รายงานเป็น Blob (ใช้แสดงตัวอย่าง/พิมพ์ในหน้าเว็บ) path เช่น "reportpdfTeam/12"
export const fetchExportBlob = async (path: string): Promise<Blob> => {
  const response = await fetch(`${exportBaseUrl}/${path}`, { headers: getAuthHeader() });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const fallback =
      response.status === 401
        ? "กรุณาเข้าสู่ระบบใหม่"
        : response.status === 403
          ? "บัญชีนี้ไม่มีสิทธิ์ดาวน์โหลดรายงานนี้"
          : response.status === 404
            ? "ไม่พบรายงาน (ลองรีสตาร์ท backend ให้เป็นเวอร์ชันล่าสุด)"
            : "ไม่สามารถสร้างรายงานได้";
    throw new Error(`${detail?.message || detail?.detail || fallback} (HTTP ${response.status})`);
  }
  return response.blob();
};

// ดาวน์โหลดรายชื่อทีมเป็น PDF
export const handleDownloadPdf = async (competitionLevelID: number) => {
  try {
    const response = await fetch(
      `${exportBaseUrl}/reportpdfTeam/${competitionLevelID}`,
      {
        headers: getAuthHeader(),
      },
    );
    if (!response.ok) throw new Error("ไม่พบทีมในระดับการแข่งขันนี้");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Report_TeamPDF_${competitionLevelID}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    const errorMessage =
      error?.data?.errorMessages?.[0] ?? "ไม่พบทีมในระดับการแข่งขันนี้";
    await showError(errorMessage);
  }
};
// ดาวน์โหลดรายชื่อทีมเป็น Word
export const handleDownloadWord = async (competitionLevelID: number) => {
  try {
    const response = await fetch(
      `${exportBaseUrl}/reportwordTeam/${competitionLevelID}`,
      {
        headers: getAuthHeader(),
      },
    );
    if (!response.ok) throw new Error("ไม่พบทีมในระดับการแข่งขันนี้");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Report_TeamWord_${competitionLevelID}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    const errorMessage =
      error?.data?.errorMessages?.[0] ?? "ไม่พบทีมในระดับการแข่งขันนี้";
    await showError(errorMessage);
  }
};
// ดาวน์โหลดใบเกียรติบัตรทีม
export const handleDownloadCertificate = async (teamID: number) => {
  try {
    const response = await fetch(
      `${exportBaseUrl}/certificateTeam/${teamID}`,
      {
        headers: getAuthHeader(),
      },
    );
    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      throw new Error(detail?.message || "ไม่สามารถดาวน์โหลดไฟล์ได้");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Certificate_Team_${teamID}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error("Download failed:", err);
    alert(err?.message || "ไม่สามารถดาวน์โหลดใบเกียรติบัตรทีม");
  }
};
// ดาวน์โหลดใบเกียรติบัตรผู้เล่น
export const handleDownloadCertificateStudent = async (
  teamId: number,
  studentID: number,
) => {
  try {
    const response = await fetch(
      `${exportBaseUrl}/certificatestudent/${teamId}/${studentID}`,
      {
        headers: getAuthHeader(),
      },
    );
    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      throw new Error(detail?.message || detail?.detail || "ไม่สามารถดาวน์โหลดไฟล์ได้");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Certificate_Student_${teamId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error("Download failed:", err);
    alert(err?.message || "ไม่สามารถดาวน์โหลดใบเกียรติบัตรรายบุคคล");
  }
};
export const handleDownloadWinnersWord = async (competitionLevelID: number) => {
  try {
    const response = await fetch(
      `${exportBaseUrl}/winners-form-word/${competitionLevelID}`,
      {
        headers: getAuthHeader(),
      },
    );
    if (!response.ok) throw new Error("ไม่พบผู้ชนะในระดับการแข่งขันนี้");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Winners_Level_${competitionLevelID}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    await showError(error?.message ?? "ไม่สามารถดาวน์โหลดรายงานผู้ชนะ Word ได้");
  }
};

// ตรวจสถานะเลขเกียรติบัตรทุกทีมในปี (CSV เปิดด้วย Excel)
export const handleDownloadCertificateStatusCsv = async (yearId: number) => {
  try {
    const blob = await fetchExportBlob(`certificateStatus/year/${yearId}`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Certificate_Status_${yearId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    await showError(error?.message ?? "ไม่สามารถดาวน์โหลดสถานะเลขเกียรติบัตรได้");
  }
};

export const handleDownloadWinnersByYearWord = async (yearId: number) => {
  try {
    const response = await fetch(
      `${exportBaseUrl}/winners-form-word/year/${yearId}`,
      {
        headers: getAuthHeader(),
      },
    );
    if (!response.ok) throw new Error("ไม่พบผู้ชนะในปีการแข่งขันนี้");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Winners_Year_${yearId}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    await showError(error?.message ?? "ไม่สามารถดาวน์โหลดรายงานผู้ชนะ Word ได้");
  }
};

export const handleDownloadWordCompetitionYear = async (
  competitionYearID: number,
) => {
  try {
    const response = await fetch(
      `${exportBaseUrl}/reportwordCompetitionYear/${competitionYearID}`,
      {
        headers: getAuthHeader(),
      },
    );

    if (!response.ok) throw new Error("ไม่พบทีมในกิจกรรมนี้");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Report_Team_CompetitionYear_${competitionYearID}.docx`;
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    const errorMessage =
      error?.data?.errorMessages?.[0] ?? "ไม่พบทีมในกิจกรรมนี้";
    await showError(errorMessage);
  }
};

export const handleDownloadWordCompetitionYearsSummary = async (
  yearId: number,
) => {
  try {
    const response = await fetch(
      `${exportBaseUrl}/reportwordCompetitionYearsSummary/${yearId}`,
      {
        headers: getAuthHeader(),
      },
    );

    if (!response.ok) throw new Error("ไม่พบข้อมูลกิจกรรมในปีนี้");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Competition_Summary_${yearId}.docx`;
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    const errorMessage =
      error?.data?.errorMessages?.[0] ?? "ไม่พบข้อมูลกิจกรรมในปีนี้";
    await showError(errorMessage);
  }
};

export const handleDownloadPdfCompetitionYearsSummary = async (
  yearId: number,
) => {
  try {
    const response = await fetch(
      `${exportBaseUrl}/reportpdfCompetitionYearsSummary/${yearId}`,
      {
        headers: getAuthHeader(),
      },
    );

    if (!response.ok) throw new Error("ไม่พบข้อมูลกิจกรรมในปีนี้");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Competition_Summary_${yearId}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    const errorMessage =
      error?.data?.errorMessages?.[0] ?? "ไม่พบข้อมูลกิจกรรมในปีนี้";
    await showError(errorMessage);
  }
};

export const handleDownloadCompetitionAttendanceReportPdf = async (
  yearId: number,
) => {
  try {
    const response = await fetch(
      `${exportBaseUrl}/reportpdfCompetitionAttendance/${yearId}`,
      {
        headers: getAuthHeader(),
      },
    );

    if (!response.ok) {
      throw new Error("ไม่สามารถสร้างรายงานผู้ลงทะเบียนเข้างานได้");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Competition_Attendance_Report_${yearId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    await showError(
      error?.message ?? "ไม่สามารถสร้างรายงานผู้ลงทะเบียนเข้างานได้",
    );
  }
};

export const handleDownloadWordCompetitionLevels = async (
  competitionLevelIds: number[],
) => {
  try {
    const response = await fetch(
      `${exportBaseUrl}/reportwordCompetitionLevels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ competitionLevelIds }),
      },
    );

    if (!response.ok) throw new Error("ไม่สามารถดาวน์โหลดรายชื่อระดับชั้นที่เลือกได้");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Report_Team_Selected_Levels.docx`;
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    const errorMessage =
      error?.data?.errorMessages?.[0] ??
      "ไม่สามารถดาวน์โหลดรายชื่อระดับชั้นที่เลือกได้";
    await showError(errorMessage);
  }
};
