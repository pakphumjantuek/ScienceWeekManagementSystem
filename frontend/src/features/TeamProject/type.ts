export interface TeamProject {
  teamProjectID?: number;
  teamID: number;
  projectName?: string;
  projectPDFLink?: string;
}

export interface TeamProjectCreate {
  teamID: number;
  projectName: string;
  file?: File | null;
}

export interface TeamProjectUpdate {
  teamProjectID: number;
  projectName: string;
  file?: File | null;
}
