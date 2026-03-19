const WEEKDAY_LABELS = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"];

export const defaultTeachers = [
  { id: 1, name: "Noma'lum o'qituvchi", phone: "-" },
];

export function getInitial(value = "") {
  const parts = String(value).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

export function lessonDateLabel(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date();

  if (Number.isNaN(date.getTime())) {
    return { day: "-", num: "-" };
  }

  return {
    day: WEEKDAY_LABELS[date.getDay()] || "-",
    num: String(date.getDate()).padStart(2, "0"),
  };
}

export function makeDateHeaders(days = 9) {
  const count = Number(days) > 0 ? Number(days) : 9;

  return Array.from({ length: count }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - 1 - index));

    return lessonDateLabel(date);
  });
}
