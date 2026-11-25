export interface CertificateConfig {
  yearID?: number;
  startNumber: number;
  certificateName: string;
  universityDeanTitle?: string;
  universityDeanName?: string;
  universityDeanSignature?: string;
  facultyDeanTitle?: string;
  facultyDeanName?: string;
  facultyDeanSignature?: string;
  certificateBackgroundPath?: string;
  universityLogoPath?: string;
  instituteLogoPath?: string;
}

export interface SystemSetting {
  id?: number;
  projectName: string;
  projectSubtitle: string;
  showNavbar: boolean;
  logoPath: string;
  theme?: string;
  showTrainingMenu?: boolean;
  showNewsMenu?: boolean;
  showResultsMenu?: boolean;
  showActivityMenu?: boolean;
  homepageContent?: string;
  homeHeroTitle?: string;
  homeHeroHighlight?: string;
  homeHeroDescription?: string;
  homeRegisterButtonLabel?: string;
  homeGuideButtonLabel?: string;
  homeApplicantsButtonLabel?: string;
  showHomeNews?: boolean;
  homeNewsTitle?: string;
  homeNewsDescription?: string;
  homeNewsButtonLabel?: string;
  homeDisplayYearId?: number;
  adminManualPath?: string | null;
  userManualPath?: string | null;
  userManualFileName?: string | null;
  userManualUpdatedAt?: string | null;
  adminManualFileName?: string | null;
  adminManualUpdatedAt?: string | null;
}
