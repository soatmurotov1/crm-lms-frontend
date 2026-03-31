const UZ_TIME_ZONE = "Asia/Tashkent";

const DATE_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

const UZ_MONTHS_LONG = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

const UZ_MONTHS_SHORT = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avg",
  "sen",
  "okt",
  "noy",
  "dek",
];

const toDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateParts = (date) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: UZ_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) return null;

  return { year, month, day };
};

const toTimeParts = (date) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: UZ_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  if (!hour || !minute) return null;

  return { hour, minute };
};

export const toInputDate = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.match(DATE_PREFIX_REGEX);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  const date = toDate(value);
  if (!date) return "";

  const parts = toDateParts(date);
  if (!parts) return "";

  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const formatUzDate = (value, options = {}) => {
  const date = toDate(value);
  if (!date) return "-";

  const parts = toDateParts(date);
  if (!parts) return "-";

  const monthIndex = Number(parts.month) - 1;
  const monthName =
    options?.month === "short"
      ? UZ_MONTHS_SHORT[monthIndex]
      : UZ_MONTHS_LONG[monthIndex];
  if (!monthName) return "-";

  return `${Number(parts.day)} ${monthName} ${parts.year}`;
};

export const formatUzDateTime = (value, options = {}) => {
  const date = toDate(value);
  if (!date) return "-";

  const dateParts = toDateParts(date);
  const timeParts = toTimeParts(date);
  if (!dateParts || !timeParts) return "-";

  const monthIndex = Number(dateParts.month) - 1;
  const monthName =
    options?.month === "short"
      ? UZ_MONTHS_SHORT[monthIndex]
      : UZ_MONTHS_LONG[monthIndex];
  if (!monthName) return "-";

  return `${Number(dateParts.day)} ${monthName} ${dateParts.year}, ${timeParts.hour}:${timeParts.minute}`;
};

export const formatUzTime = (value, options = {}) => {
  const date = toDate(value);
  if (!date) return "-";

  const parts = toTimeParts(date);
  if (!parts) return "-";

  return `${parts.hour}:${parts.minute}`;
};
