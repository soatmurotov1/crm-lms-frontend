/**
 * EduCenter dizayn tokenlari — butun ilova uchun yagona manba.
 *
 * Kalit nomlari avval DashboardPage, TeacherPages/Dashboard va ExamsPage ichida
 * takrorlangan uchta obyektdan olingan, shuning uchun mavjud sahifalar
 * o'zgarishsiz ishlashda davom etadi.
 */

const darkTokens = {
  app: "bg-slate-950",
  sidebar: "bg-slate-900 border-slate-800",
  main: "bg-slate-950",
  card: "bg-slate-900 border-slate-800",
  text: "text-white",
  soft: "text-slate-400",
  menu: "text-slate-200",
  hover: "hover:bg-slate-800",
  topBtn: "bg-slate-900 border-slate-700 text-white",
  active: "bg-violet-600 text-white",
  select: "bg-slate-900 border-slate-700 text-white",
  subpanel: "bg-slate-900 border-slate-800",
  submenuActive: "bg-violet-600 text-white",
  submenuText: "text-slate-200",
  rowBorder: "border-slate-700",
  input: "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500",
  overlay: "bg-black/50",
  tab: "bg-slate-900 text-slate-300 border-slate-700",
  tabActive: "bg-violet-600 text-white border-violet-600",
  chip: "bg-slate-800 text-slate-300 border-slate-700",

  // ExamsPage vocabulary'si
  shell: "bg-slate-950 text-slate-100",
  panel: "bg-slate-900 border-slate-800",
  muted: "text-slate-400",
  button: "bg-violet-600 hover:bg-violet-700 text-white",
  secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100",
};

const lightTokens = {
  app: "bg-slate-100",
  sidebar: "bg-white border-slate-200",
  main: "bg-slate-100",
  card: "bg-white border-slate-200",
  text: "text-slate-900",
  soft: "text-slate-500",
  menu: "text-slate-700",
  hover: "hover:bg-slate-100",
  topBtn: "bg-white border-slate-200 text-slate-700",
  active: "bg-violet-500 text-white",
  select: "bg-white border-slate-200 text-slate-700",
  subpanel: "bg-white border-slate-200",
  submenuActive: "bg-violet-100 text-violet-700",
  submenuText: "text-slate-700",
  rowBorder: "border-slate-200",
  input: "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400",
  overlay: "bg-black/30",
  tab: "bg-white text-slate-600 border-slate-200",
  tabActive: "bg-violet-100 text-violet-700 border-violet-200",
  chip: "bg-slate-50 text-slate-600 border-slate-200",

  // ExamsPage vocabulary'si
  shell: "bg-slate-50 text-slate-900",
  panel: "bg-white border-slate-200",
  muted: "text-slate-500",
  button: "bg-violet-600 hover:bg-violet-700 text-white",
  secondary: "bg-slate-100 hover:bg-slate-200 text-slate-900",
};

export function getThemeTokens(darkMode) {
  return darkMode ? darkTokens : lightTokens;
}
