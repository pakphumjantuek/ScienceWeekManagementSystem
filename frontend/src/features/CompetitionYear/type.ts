export interface CompetitionYear {
  competitionYearID?: number;
  yearID: number;
  competitionID: number;
  competitionEndDate?: string;
  registrationLocation: string;
  isActive?: boolean;
  isRegistrationOpen?: boolean;
  competitionName?: string;
  requiresProject?: boolean;
  advisorCount?: number;
  registrationMode?: "individual" | "team";
  maxStudentsPerSchool?: number;
}
