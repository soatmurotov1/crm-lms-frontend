export const WEEK_DAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

export const DAY_INDEX_TO_ENUM = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(value) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    date,
  );
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}

export function formatDateTime(value) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatShortDate(date)} ${hours}:${minutes}`;
}

export function getInitials(value) {
  if (!value) return "-";
  const parts = String(value).trim().split(/\s+/).slice(0, 2);
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

export function getHomeworkStatusLabel(status) {
  const normalized = normalizeHomeworkStatus(status);
  if (normalized === "APPROVED") return "Qabul qilingan";
  if (normalized === "PENDING") return "Kutayotganlar";
  if (normalized === "REJECTED") return "Qaytarilgan";
  if (normalized === "NOT_DONE") return "Bajarilmagan";
  if (normalized === "NOT_ASSIGNED") return "Berilmagan";
  return "Berilmagan";
}

export function getHomeworkStatusTone(status) {
  const normalized = normalizeHomeworkStatus(status);
  if (normalized === "APPROVED") return "success";
  if (normalized === "PENDING") return "info";
  if (normalized === "REJECTED") return "warning";
  if (normalized === "NOT_DONE") return "danger";
  return "neutral";
}

export function normalizeHomeworkStatus(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED") return "APPROVED";
  if (normalized === "PENDING") return "PENDING";
  if (normalized === "REJECTED") return "REJECTED";
  if (
    [
      "NOT_REVIEWED",
      "GIVEN",
      "ASSIGNED",
      "NOT_DONE",
      "NOT_COMPLETED",
      "MISSED",
      "BERILGAN",
      "BAJARILMAGAN",
    ].includes(normalized)
  ) {
    return "NOT_DONE";
  }
  if (["NOT_ASSIGNED", "NOT_GIVEN", "NONE"].includes(normalized)) {
    return "NOT_ASSIGNED";
  }
  return "NOT_ASSIGNED";
}
