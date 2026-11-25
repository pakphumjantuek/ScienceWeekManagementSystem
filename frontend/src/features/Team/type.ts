import type { Student } from "../student/type";

export interface Team {
  teamID?: number;
  teamName: string;
  registrationDateTime?: string;
  primaryTitlePrefix: number;
  primaryOtherTitlePrefix?: string;
  primaryFirstName?: string;
  primaryLastName?: string;
  secondaryTitlePrefix: number;
  secondaryOtherTitlePrefix?: string;
  secondaryFirstName?: string;
  secondaryLastName?: string;
  thirdTitlePrefix?: number;
  thirdOtherTitlePrefix?: string;
  thirdFirstName?: string;
  thirdLastName?: string;
  fourthTitlePrefix?: number;
  fourthOtherTitlePrefix?: string;
  fourthFirstName?: string;
  fourthLastName?: string;
  fifthTitlePrefix?: number;
  fifthOtherTitlePrefix?: string;
  fifthFirstName?: string;
  fifthLastName?: string;
  userId?: string;
  status?: number;
  competitionName?: string;
  levelName?: string;
  statusTime?: string;
  projectFile?: string;
  projectPDFLink?: string;
  rewardTypeId?: number;
  rewardType?: string;
  projectName?: string;
  competitionLevelID?: number;
  nameOrdinal?: number;
  school_code?: number;
  school_name?: string;
  teamNumberInLevel?: number;
  students?: Student[];
  studentNames?: string;
  province?: string;
  district?: string;
  hasCertificate?: boolean;
}

export interface TeamRegister {
  teamID?: number;
  competitionLevelID: number;
  userId?: string;
  primaryTitlePrefix: number;
  primaryOtherTitlePrefix?: string;
  primaryFirstName?: string;
  primaryLastName?: string;
  secondaryTitlePrefix: number;
  secondaryOtherTitlePrefix?: string;
  secondaryFirstName?: string;
  secondaryLastName?: string;
  thirdTitlePrefix?: number;
  thirdOtherTitlePrefix?: string;
  thirdFirstName?: string;
  thirdLastName?: string;
  fourthTitlePrefix?: number;
  fourthOtherTitlePrefix?: string;
  fourthFirstName?: string;
  fourthLastName?: string;
  fifthTitlePrefix?: number;
  fifthOtherTitlePrefix?: string;
  fifthFirstName?: string;
  fifthLastName?: string;
  projectName?: string;
  school_code?: number;
}

export interface TeamAdvisor {
  teamAdvisorID?: number;
  teamID?: number;
  sortOrder: number;
  titlePrefix: number;
  otherTitlePrefix?: string;
  firstName: string;
  lastName: string;
}

export type TeamCopyRequest = {
  sourceTeamId: number;
  targetCompetitionLevelID?: number | null;
  includeStudents?: boolean; // default true
  overrideProjectName?: string | null;
  resetStatusToCheckedIn?: boolean; // default true
};

export type TeamCopyResult = {
  newTeamId: number;
  competitionLevelID?: number | null;
  teamNumberInLevel?: number | null;
  nameOrdinal?: number | null;
};

export interface TeamUser {
  teamID?: number;
  competitionLevelID: number;
  userId?: string;
}

export type TeamStatusGroupResponse = {
  checkedInTeams: Team[];
  verifiedTeams: Team[];
};

export const statusOptions = [
  { value: 0, label: "ยังไม่ได้ลงทะเบียน" },
  { value: 1, label: "สมัคร" },
  { value: 3, label: "ลงทะเบียนเข้างาน" },
  { value: 2, label: "แก้ไขโครงงาน" },
  { value: 4, label: "ถูกตัดสิทธิ์" },
];

export const statusOptionsUser = [
  { value: 1, label: "สมัคร" },
  { value: 3, label: "ลงทะเบียนเข้างาน" },
  { value: 2, label: "แก้ไขโครงงาน" },
  { value: 4, label: "ตัดสิทธิ์การเเข่งขัน" },
];

export const getStatusBadgeClass = (status: number): string => {
  switch (status) {
    case 1: // ลงทะเบียนสำเร็จ
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300";
    case 2: // แก้ไขโครงงาน
      return "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300";
    case 3: // ลงทะเบียนเข้างาน
      return "bg-blue-100 text-blue-800 ring-1 ring-blue-300";
    case 4: // ตัดสิทธิ์การเเข่งขัน
      return "bg-red-100 text-red-800 ring-1 ring-red-300";
    default:
      return "bg-slate-100 text-slate-800 ring-1 ring-slate-300";
  }
};

/** หนึ่งทีมในหน้า "ประวัติการลงทะเบียนกิจกรรม" (GET teamRegistration/my) */
export interface MyRegistration {
  teamID: number;
  nameOrdinal?: number | null;
  status: number;
  registrationDateTime: string;
  school_code?: number | null;
  school_name?: string | null;
  province?: string | null;
  district?: string | null;
  projectName?: string | null;
  projectPDFLink?: string | null;
  hasCertificate: boolean;
  mainFilledCount: number;
  reserveFilledCount: number;
  competitionLevelID: number;
  levelName?: string | null;
  competitionDateTime?: string | null;
  mainPlayersCount?: number | null;
  reservePlayersCount?: number | null;
  isCertificateNumberGenerated: boolean;
  competitionYearID: number;
  competitionName?: string | null;
  requiresProject: boolean;
  registrationMode: string;
  advisorCount: number;
  maxStudentsPerSchool?: number | null;
  registrationLocation?: string | null;
  yearID: number;
  yearNumber: number;
  yearName?: string | null;
  registrationCloseDate?: string | null;
}
