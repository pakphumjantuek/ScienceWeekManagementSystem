export interface TeamStatusSummary {
  statusName: string;
  count: number;
}

export interface CompetitionSummary {
  competitionName: string;
  levelName?: string | null;
  teamCount: number;
  studentCount: number;
  schoolCount: number;
}

export interface EducationLevelAttendanceSummary {
  levelID: number;
  levelName: string;
  registeredTeamCount: number;
  registeredStudentCount: number;
  checkedInTeamCount: number;
  checkedInStudentCount: number;
}

export interface CompetitionAttendanceSummary {
  competitionYearID: number;
  competitionName: string;
  registeredTeamCount: number;
  registeredStudentCount: number;
  checkedInTeamCount: number;
  checkedInStudentCount: number;
  levels: EducationLevelAttendanceSummary[];
}

export interface SchoolSummary {
  schoolName: string;
  province?: string | null;
  teamCount: number;
  studentCount: number;
}

export interface RewardSummary {
  rewardName: string;
  teamCount: number;
}

export interface DashboardReport {
  totalSchools: number;
  totalTeams: number;
  totalStudents: number;
  totalCompetitions: number;
  totalRegisteredStudents: number;
  totalCheckedInStudents: number;
  registeredTeams: number;
  verifiedTeams: number;
  projectRevisionTeams: number;
  checkedInTeams: number;
  disqualifiedTeams: number;
  totalProjects: number;
  totalCertificates: number;
  teamStatusSummary: TeamStatusSummary[];
  competitionSummary: CompetitionSummary[];
  competitionAttendanceSummary: CompetitionAttendanceSummary[];
  educationLevelAttendanceSummary: EducationLevelAttendanceSummary[];
  schoolSummary: SchoolSummary[];
  rewardSummary: RewardSummary[];
}
