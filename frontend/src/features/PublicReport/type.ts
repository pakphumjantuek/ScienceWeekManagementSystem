export interface PublicReportYear {
  yearID: number;
  yearNumber: number;
  yearName: string;
  isActive?: boolean;
}

export interface PublicReportCompetitionYear {
  competitionYearID: number;
  yearID: number;
  competitionID: number;
  competitionName: string;
  competitionEndDate?: string;
  registrationLocation?: string;
  requiresProject?: boolean;
  schoolCount?: number;
  studentCount?: number;
}

export interface PublicReportCompetitionLevel {
  competitionLevelID: number;
  competitionYearID: number;
  levelID: number;
  levelName: string;
  schoolCount: number;
  teamCount?: number;
  studentCount: number;
  competitionDateTime?: string | null;
}

export interface PublicReportLevelSummary {
  competitionLevelID: number;
  competitionYearID: number;
  yearID: number;
  yearName: string;
  yearNumber: number;
  competitionName: string;
  levelName: string;
  requiresProject?: boolean;
  registrationLocation?: string | null;
  competitionDateTime?: string | null;
  schoolCount: number;
  teamCount: number;
  studentCount: number;
}

export interface PublicReportTeam {
  teamID: number;
  schoolName: string;
  province?: string | null;
  district?: string | null;
  teamName?: string | null;
  projectName?: string | null;
  projectPDFLink?: string | null;
  teacherName?: string | null;
  studentCount: number;
  mainStudentCount: number;
  reserveStudentCount: number;
}

export interface PublicReportStudent {
  studentID: number;
  firstName: string;
  lastName: string;
  titlePrefixLabel?: string | null;
  isMainMember: boolean;
}

export interface PublicReportPaginatedTeams {
  items: PublicReportTeam[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CompetitorAnnouncement {
  teamID: number;
  schoolName: string;
  competitorNames: string[];
  advisorNames: string[];
  remarks: string;
  competitionLevelName?: string;
}
