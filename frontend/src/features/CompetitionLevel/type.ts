export interface CompetitionLevel {
  competitionLevelID?: number;
  competitionYearID: number;
  levelID: number;
  mainPlayersCount?: number | null;
  reservePlayersCount?: number | null;
  advisorCount?: number;
  registrationMode?: "individual" | "team";
  levelName?: string | null;
  competitionDateTime?: string;
  isCertificateNumberGenerated?: boolean;
}
