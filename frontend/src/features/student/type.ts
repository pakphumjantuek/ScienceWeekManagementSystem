export interface Student {
  studentID?: number;
  titlePrefix?: number;
  firstName: string;
  lastName: string;
  teamID?: number;
  isMainMember: boolean;
  rewardTypeID?: number;
  isCertificateGenerated?: boolean;
}

export const TitlePrefix = [
  { value: 0, label: "นาย" },
  { value: 1, label: "นาง" },
  { value: 2, label: "นางสาว" },
  { value: 3, label: "เด็กชาย" },
  { value: 4, label: "เด็กหญิง" },
  { value: 5, label: "ว่าที่ร้อยตรี" },
  { value: 6, label: "ว่าที่ร้อยตรีหญิง" },
];
