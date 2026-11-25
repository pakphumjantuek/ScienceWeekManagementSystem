import { useEffect } from "react";

export const formatThaiDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const formatThaiDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return (
    new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // แสดงเวลาแบบ 24 ชม.
    })
      .format(date)
      .replace(" น.", "") + " น."
  ); // เพิ่ม "น." ตามภาษาไทย
};

export const toBangkokDate = (date: Date) =>
  date.toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });

export const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // เดือนนับจาก 0
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateTimeLocal = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/** Registration stays open through the end of the configured calendar day. */
export const isRegistrationClosed = (closeDate?: string | null) => {
  if (!closeDate) return false;
  const deadline = new Date(closeDate);
  if (Number.isNaN(deadline.getTime())) return false;
  const hasTime = closeDate.includes("T") || closeDate.includes(":");
  if (!hasTime) {
    deadline.setHours(23, 59, 59, 999);
  }
  return new Date() > deadline;
};

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
