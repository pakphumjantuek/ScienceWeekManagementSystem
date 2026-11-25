// export const baseUrl = "https://localhost:7023";
// export const baseUrlAPI = baseUrl + "/api/";

export const SD_Roles = {
  ADMIN: "admin",
  User: "user",
} as const;

export type SD_Roles = (typeof SD_Roles)[keyof typeof SD_Roles];
