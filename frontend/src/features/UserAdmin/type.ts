export interface UserAdmin {
  id?: string;          // backend เดิมไม่ได้ส่ง id, เก็บเป็น optional เผื่ออนาคต
  userName: string;
  email: string;
  currentRoles: string;
  selectedRole: string;
  isSuspended?: boolean;
}

export interface RoleOption {
  name: string;         // backend ส่งเฉพาะ Name → ไม่ต้องมี id
}

export interface ChangeRolePayload {
  userName: string;     // ใช้ userName แทน userId
  role: string;         // ใช้ roleName ตรง ๆ (เช่น "Admin", "Staff")
}
