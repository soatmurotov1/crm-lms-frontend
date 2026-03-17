export const makeDateHeaders = () => {
  return [
    { day: "Fri", num: 20 },
    { day: "Sat", num: 21 },
    { day: "Sun", num: 22 },
    { day: "Mon", num: 23 },
    { day: "Tue", num: 24 },
    { day: "Wed", num: 25 },
    { day: "Thu", num: 26 },
    { day: "Fri", num: 27 },
    { day: "Sat", num: 28 },
  ];
};

const dayByIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const lessonDateLabel = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return { day: "-", num: "-" };
  return {
    day: dayByIndex[date.getDay()] || "-",
    num: date.getDate(),
  };
};

export const defaultStudents = [];

export const defaultTeachers = [
  { id: 1, name: "Jinibijoev", phone: "+998912879856" },
];

export const defaultHomeworkStudents = [
  {
    id: 1,
    name: "Sardor Xushvaqtov Bahodir o'g'li",
    sentAt: "11 Mart, 2026 14:50",
    status: "kutayotgan",
  },
  {
    id: 2,
    name: "Jamoliddin Maxammadibrohimov Xusniddin o'g'li",
    sentAt: "10 Mart, 2026 17:22",
    status: "kutayotgan",
  },
  {
    id: 3,
    name: "Abrorbek Soatmurotov Alimboy o'g'li",
    sentAt: "10 Mart, 2026 13:36",
    status: "kutayotgan",
  },
  {
    id: 4,
    name: "Dilshod Olimov Farhod o'g'li",
    sentAt: "10 Mart, 2026 15:39",
    status: "kutayotgan",
  },
  {
    id: 5,
    name: "Bunyodbek G'ulomjonov",
    sentAt: "11 Mart, 2026 10:16",
    status: "kutayotgan",
  },
  {
    id: 6,
    name: "Axrorbek Mengilov",
    sentAt: "10 Mart, 2026 19:53",
    status: "kutayotgan",
  },
  {
    id: 7,
    name: "Sirojiddin Oyosboyev",
    sentAt: "10 Mart, 2026 13:54",
    status: "qabul",
  },
  {
    id: 8,
    name: "Olimjon Murtozoyev",
    sentAt: "11 Mart, 2026 09:25",
    status: "qabul",
  },
  {
    id: 9,
    name: "Sabina Norbekova",
    sentAt: "10 Mart, 2026 17:33",
    status: "qaytarilgan",
  },
  {
    id: 10,
    name: "Qo'chqorboyev Abbos Abulqosim o'g'li",
    sentAt: "10 Mart, 2026 19:52",
    status: "bajarilmagan",
  },
  { id: 11, name: "Murodjon Soliyev", sentAt: "-", status: "bajarilmagan" },
];

export const defaultHomeworks = [
  {
    id: 1,
    title: "crm continue backend finish",
    total: 15,
    submitted: 11,
    checked: 0,
    assignedAt: "10 Mart, 2026 09:30",
    deadline: "11 Mart, 2026 01:30",
    lessonDate: "09 Mart, 2026",
    description: "Backendni tugatish",
    studentStatuses: defaultHomeworkStudents,
  },
  {
    id: 2,
    title: "crm project continue",
    total: 15,
    submitted: 11,
    checked: 0,
    assignedAt: "04 Mart, 2026 21:39",
    deadline: "05 Mart, 2026 13:39",
    lessonDate: "04 Mart, 2026",
    description: "Project davom ettirish",
    studentStatuses: defaultHomeworkStudents,
  },
  {
    id: 3,
    title: "React continue, nested route, NavLink",
    total: 15,
    submitted: 12,
    checked: 0,
    assignedAt: "25 Fev, 2026 23:10",
    deadline: "26 Fev, 2026 15:10",
    lessonDate: "25 Fev, 2026",
    description: "Nested route va NavLink",
    studentStatuses: defaultHomeworkStudents,
  },
];

export const defaultVideos = [
  {
    id: 1,
    name: "62.2.mov",
    lessonName: "crm continue",
    status: "Tayyor",
    lessonDate: "10 Mart, 2026",
    size: "2.77 GB",
    uploadedAt: "10 Mart, 2026",
  },
  {
    id: 2,
    name: "62.1.mov",
    lessonName: "crm continue",
    status: "Tayyor",
    lessonDate: "10 Mart, 2026",
    size: "1.21 GB",
    uploadedAt: "10 Mart, 2026",
  },
  {
    id: 3,
    name: "61.2.mov",
    lessonName: "crm continue backend finish",
    status: "Tayyor",
    lessonDate: "09 Mart, 2026",
    size: "1.82 GB",
    uploadedAt: "10 Mart, 2026",
  },
  {
    id: 4,
    name: "61.1.mov",
    lessonName: "crm continue backend finish",
    status: "Tayyor",
    lessonDate: "09 Mart, 2026",
    size: "1.76 GB",
    uploadedAt: "10 Mart, 2026",
  },
  {
    id: 5,
    name: "60.1.mov",
    lessonName: "crm project continue lesson, studentGroup model",
    status: "Tayyor",
    lessonDate: "06 Mart, 2026",
    size: "1.37 GB",
    uploadedAt: "09 Mart, 2026",
  },
  {
    id: 6,
    name: "59.1.mov",
    lessonName: "crm project continue",
    status: "Tayyor",
    lessonDate: "05 Mart, 2026",
    size: "1.77 GB",
    uploadedAt: "06 Mart, 2026",
  },
];

export const getInitial = (name = "") => {
  const safe = String(name ?? "").trim();
  return safe ? safe.charAt(0).toUpperCase() : "?";
};
