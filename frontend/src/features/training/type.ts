export interface Branch {
  id: number;
  name: string;
}

export interface TrainingTopic {
  id: number;
  name: string;
  description?: string;
  trainingDate?: string;
  startTime?: string;
  endTime?: string;
  maxParticipants: number;
  isOpenRegister: boolean;
  registerStartDate?: string;
  registerEndDate?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  teacherName?: string;
  trainingtopicsrequirements?: string;
  branch_id?: number;
  branch?: Branch;
  certificateTemplateId?: number;
  yearID?: number | null;
  audience?: string;
  // กลุ่มไลน์: ลิงก์/QR ส่งมาเฉพาะเจ้าหน้าที่ และผู้สมัครผ่าน TrainingRegistrations/my
  lineGroupUrl?: string | null;
  lineQrPath?: string | null;
  lineNote?: string | null;
  hasLineGroup?: boolean;
}

export interface TrainingRegistration {
  id: number;
  trainingtopicId: number;
  trainingtopic?: TrainingTopic;
  userId?: string;
  prefix?: string;
  firstName: string;
  lastName: string;
  registeredAt: string;
  status: string;
}

export interface TrainingRegistrationPayload {
  trainingtopicId: number;
  prefix?: string;
  firstName: string;
  lastName: string;
}

export interface TrainingRegistrationUpdatePayload {
  prefix?: string;
  firstName: string;
  lastName: string;
}
