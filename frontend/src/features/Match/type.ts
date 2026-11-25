export interface Match {
  id: string;
  teamA: Team;
  teamB: Team | null;
  winner: Team | null;
  status: string;
  round: number;
  competitionLevelID: string;
}

export interface Team {
  teamID: string;
  school_name?: string;
  nameOrdinal?: number;
  teamNumberInLevel?: number;
}

export type TournamentResult = {
  firstPlace: Team | null;
  secondPlace: Team | null;
  thirdPlaces: Team[];
};

export interface MatchDrawLog {
  id: number;
  competitionLevelID: number;
  round: number;
  actionType: string;
  note: string;
  matchesJson: string;
  createdAt: string;
}