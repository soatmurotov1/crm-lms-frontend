/**
 * Ilovaning ikonka to'plami.
 *
 * Avval interfeys bo'ylab emoji ishlatilgan (🎓 📚 💳 …). Emoji har
 * operatsion tizimda boshqacha chiziladi, o'z rangini olib yuradi va matn
 * bilan bir tekisda turmaydi — natijada panel jiddiy ko'rinmaydi.
 *
 * Bu yerdagi ikonkalar bitta geometriyada chizilgan: 24x24 to'r, faqat
 * chiziq (fill yo'q), `currentColor`. Ya'ni ikonka o'zi turgan matnning
 * rangini va o'lchamini oladi, tungi rejimga ham o'zi moslashadi.
 *
 * Foydalanish:
 *   <Icon name="students" />              // 20px, joriy rang
 *   <Icon name="trash" size={16} />
 *   <Icon name="check" className="text-success" />
 *
 * Yangi ikonka qo'shish: quyidagi ro'yxatga bir qator. Element turlari —
 * ["path", d] | ["circle", cx, cy, r] | ["rect", x, y, w, h, rx].
 */

const ICONS = {
  /* ---- Navigatsiya / bo'limlar ---- */
  dashboard: [
    ["rect", 3, 3, 7, 9, 1],
    ["rect", 14, 3, 7, 5, 1],
    ["rect", 14, 12, 7, 9, 1],
    ["rect", 3, 16, 7, 5, 1],
  ],
  home: [
    ["path", "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
    ["path", "M9 22V12h6v10"],
  ],
  students: [
    ["path", "M22 10 12 5 2 10l10 5z"],
    ["path", "M6 12v5c3 2.5 9 2.5 12 0v-5"],
    ["path", "M22 10v6"],
  ],
  groups: [
    ["path", "M12 7v14"],
    [
      "path",
      "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
    ],
  ],
  teachers: [
    ["path", "M14 22v-4a2 2 0 1 0-4 0v4"],
    ["path", "m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"],
    ["path", "M18 5v17"],
    ["path", "m4 6 8-4 8 4"],
    ["path", "M6 5v17"],
    ["circle", 12, 9, 2],
  ],
  users: [
    ["path", "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"],
    ["circle", 9, 7, 4],
    ["path", "M22 21v-2a4 4 0 0 0-3-3.87"],
    ["path", "M16 3.13a4 4 0 0 1 0 7.75"],
  ],
  user: [
    ["path", "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"],
    ["circle", 12, 7, 4],
  ],
  building: [
    ["path", "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"],
    ["path", "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"],
    ["path", "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"],
    ["path", "M10 6h4M10 10h4M10 14h4M10 18h4"],
  ],
  door: [
    ["path", "M13 4h3a2 2 0 0 1 2 2v14"],
    ["path", "M2 20h3M13 20h9"],
    ["path", "M10 12v.01"],
    [
      "path",
      "M13 4.562v16.157a1 1 0 0 1-1.242.97L5.759 20.16A2 2 0 0 1 4 18.223V4.562a2 2 0 0 1 1.515-1.94l6-1.5A1 1 0 0 1 13 2.06z",
    ],
  ],
  payments: [
    ["rect", 2, 5, 20, 14, 2],
    ["path", "M2 10h20"],
    ["path", "M6 15h4"],
  ],
  money: [
    ["path", "M21 12V7H5a2 2 0 0 1 0-4h14v4"],
    ["path", "M3 5v14a2 2 0 0 0 2 2h16v-5"],
    ["path", "M18 12a2 2 0 0 0 0 4h4v-4Z"],
  ],
  reports: [
    ["path", "M3 3v16a2 2 0 0 0 2 2h16"],
    ["path", "M18 17V9M13 17V5M8 17v-3"],
  ],
  attendance: [
    ["rect", 3, 4, 18, 18, 2],
    ["path", "M16 2v4M8 2v4M3 10h18"],
    ["path", "m9 16 2 2 4-4"],
  ],
  calendar: [
    ["rect", 3, 4, 18, 18, 2],
    ["path", "M16 2v4M8 2v4M3 10h18"],
  ],
  clock: [
    ["circle", 12, 12, 10],
    ["path", "M12 6v6l4 2"],
  ],
  bell: [
    ["path", "M10.3 21a2 2 0 0 0 3.4 0"],
    [
      "path",
      "M3.3 15.3A1 1 0 0 0 4 17h16a1 1 0 0 0 .7-1.7C19.4 14 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.4 6-2.7 7.3",
    ],
  ],
  settings: [
    [
      "path",
      "M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z",
    ],
    ["circle", 12, 12, 3],
  ],
  security: [
    ["rect", 3, 11, 18, 11, 2],
    ["path", "M7 11V7a5 5 0 0 1 10 0v4"],
  ],
  shield: [
    [
      "path",
      "M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z",
    ],
  ],
  key: [
    ["circle", 7.5, 15.5, 5.5],
    ["path", "m21 2-9.6 9.6"],
    ["path", "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"],
  ],
  exams: [
    ["path", "M10 2v7.3M14 9.3V2M8.5 2h7"],
    ["path", "M14 9.3a6.5 6.5 0 1 1-4 0"],
    ["path", "M5.5 16h13"],
  ],
  homework: [
    ["path", "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"],
    ["path", "M14 2v4a2 2 0 0 0 2 2h4"],
    ["path", "M16 13H8M16 17H8M10 9H8"],
  ],
  clipboard: [
    ["rect", 8, 2, 8, 4, 1],
    [
      "path",
      "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
    ],
    ["path", "M12 11h4M12 16h4M8 11h.01M8 16h.01"],
  ],
  folder: [
    [
      "path",
      "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
    ],
  ],
  inbox: [
    ["path", "M22 12h-6l-2 3h-4l-2-3H2"],
    [
      "path",
      "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
    ],
  ],
  support: [
    ["circle", 12, 12, 10],
    ["circle", 12, 12, 4],
    ["path", "m4.9 4.9 4.3 4.3M14.8 9.2l4.3-4.3M14.8 14.8l4.3 4.3M9.2 14.8l-4.3 4.3"],
  ],
  plans: [
    ["path", "M6 3h12l4 6-10 13L2 9Z"],
    ["path", "M11 3 8 9l4 13 4-13-3-6"],
    ["path", "M2 9h20"],
  ],
  package: [
    ["path", "m7.5 4.3 9 5.1"],
    [
      "path",
      "M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
    ],
    ["path", "m3.3 7 8.7 5 8.7-5M12 22V12"],
  ],
  briefcase: [
    ["rect", 2, 7, 20, 14, 2],
    ["path", "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"],
  ],
  puzzle: [
    [
      "path",
      "M15.4 4.4a1 1 0 0 0 1.7-.5 2.5 2.5 0 1 1 3 3 1 1 0 0 0-.5 1.7l1.7 1.7a2.4 2.4 0 0 1 0 3.4l-1.7 1.7a1 1 0 0 1-1.7-.5 2.5 2.5 0 1 0-3 3 1 1 0 0 1 .5 1.7l-1.7 1.7a2.4 2.4 0 0 1-3.4 0l-1.7-1.7a1 1 0 0 0-1.7.5 2.5 2.5 0 1 1-3-3 1 1 0 0 0 .5-1.7l-1.7-1.7a2.4 2.4 0 0 1 0-3.4l1.7-1.7a1 1 0 0 1 1.7.5 2.5 2.5 0 1 0 3-3 1 1 0 0 1-.5-1.7l1.7-1.7a2.4 2.4 0 0 1 3.4 0z",
    ],
  ],
  chat: [["path", "M7.9 20A9 9 0 1 0 4 16.1L2 22Z"]],
  mail: [
    ["path", "m22 7-9 5.7a2 2 0 0 1-2 0L2 7"],
    ["rect", 2, 4, 20, 16, 2],
  ],
  phone: [
    [
      "path",
      "M13.8 16.6a1 1 0 0 0 1.2-.3l.4-.5A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.5.4a1 1 0 0 0-.3 1.2 14 14 0 0 0 6.4 6.4",
    ],
  ],
  location: [
    [
      "path",
      "M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0",
    ],
    ["circle", 12, 10, 3],
  ],
  attachment: [
    [
      "path",
      "m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5l8.6-8.6A4 4 0 1 1 18 8.8l-8.6 8.6a2 2 0 0 1-2.8-2.9l8.5-8.5",
    ],
  ],

  /* ---- Holat va natija ---- */
  check: [["path", "m20 6-11 11-5-5"]],
  checkCircle: [
    ["circle", 12, 12, 10],
    ["path", "m9 12 2 2 4-4"],
  ],
  xCircle: [
    ["circle", 12, 12, 10],
    ["path", "m15 9-6 6M9 9l6 6"],
  ],
  warning: [
    [
      "path",
      "m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3",
    ],
    ["path", "M12 9v4M12 17h.01"],
  ],
  info: [
    ["circle", 12, 12, 10],
    ["path", "M12 16v-4M12 8h.01"],
  ],
  help: [
    ["circle", 12, 12, 10],
    ["path", "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"],
    ["path", "M12 17h.01"],
  ],
  ban: [
    ["circle", 12, 12, 10],
    ["path", "m4.9 4.9 14.2 14.2"],
  ],
  star: [
    [
      "path",
      "m12 2.5 2.9 5.9 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z",
    ],
  ],
  trophy: [
    ["path", "M6 9H4.5a2.5 2.5 0 0 1 0-5H6"],
    ["path", "M18 9h1.5a2.5 2.5 0 0 0 0-5H18"],
    ["path", "M4 22h16"],
    ["path", "M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22"],
    ["path", "M14 14.7V17c0 .6.5 1 1 1.2 1.2.6 2 2 2 3.8"],
    ["path", "M18 2H6v7a6 6 0 0 0 12 0V2Z"],
  ],
  target: [
    ["circle", 12, 12, 10],
    ["circle", 12, 12, 6],
    ["circle", 12, 12, 2],
  ],
  flag: [
    ["path", "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"],
    ["path", "M4 22v-7"],
  ],
  smile: [
    ["circle", 12, 12, 10],
    ["path", "M8 14s1.5 2 4 2 4-2 4-2"],
    ["path", "M9 9h.01M15 9h.01"],
  ],
  trendUp: [
    ["path", "M16 7h6v6"],
    ["path", "m22 7-8.5 8.5-5-5L2 17"],
  ],
  trendDown: [
    ["path", "M16 17h6v-6"],
    ["path", "m22 17-8.5-8.5-5 5L2 7"],
  ],

  /* ---- Harakatlar ---- */
  plus: [["path", "M5 12h14M12 5v14"]],
  minus: [["path", "M5 12h14"]],
  close: [["path", "M18 6 6 18M6 6l12 12"]],
  edit: [
    ["path", "M12 20h9"],
    ["path", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"],
  ],
  trash: [
    ["path", "M3 6h18"],
    ["path", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"],
    ["path", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
    ["path", "M10 11v6M14 11v6"],
  ],
  search: [
    ["circle", 11, 11, 8],
    ["path", "m21 21-4.3-4.3"],
  ],
  filter: [["path", "M22 3H2l8 9.5V19l4 2v-8.5z"]],
  refresh: [
    ["path", "M3 12a9 9 0 0 1 9-9 9.8 9.8 0 0 1 6.7 2.7L21 8"],
    ["path", "M21 3v5h-5"],
    ["path", "M21 12a9 9 0 0 1-9 9 9.8 9.8 0 0 1-6.7-2.7L3 16"],
    ["path", "M8 16H3v5"],
  ],
  download: [
    ["path", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"],
    ["path", "m7 10 5 5 5-5"],
    ["path", "M12 15V3"],
  ],
  upload: [
    ["path", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"],
    ["path", "m17 8-5-5-5 5"],
    ["path", "M12 3v12"],
  ],
  send: [
    [
      "path",
      "M14.5 21.7a.5.5 0 0 0 .9 0l6.5-19a.5.5 0 0 0-.6-.6l-19 6.5a.5.5 0 0 0 0 .9l7.9 3.2a2 2 0 0 1 1.1 1.1z",
    ],
    ["path", "m21.9 2.1-11 11"],
  ],
  copy: [
    ["rect", 8, 8, 14, 14, 2],
    ["path", "M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"],
  ],
  print: [
    ["path", "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"],
    ["path", "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"],
    ["rect", 6, 14, 12, 8, 1],
  ],
  logout: [
    ["path", "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"],
    ["path", "m16 17 5-5-5-5"],
    ["path", "M21 12H9"],
  ],
  eye: [
    [
      "path",
      "M2 12.3a1 1 0 0 1 0-.7 10.8 10.8 0 0 1 20 0 1 1 0 0 1 0 .7 10.8 10.8 0 0 1-20 0",
    ],
    ["circle", 12, 12, 3],
  ],
  eyeOff: [
    ["path", "m15 18-.7-3.3"],
    ["path", "M2 8a10.6 10.6 0 0 0 20 0"],
    ["path", "m20 15-1.7-2M4 15l1.7-2M9 18l.7-3.3"],
  ],
  external: [
    ["path", "M15 3h6v6"],
    ["path", "M10 14 21 3"],
    ["path", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"],
  ],

  /* ---- Yo'nalish ---- */
  chevronDown: [["path", "m6 9 6 6 6-6"]],
  chevronUp: [["path", "m18 15-6-6-6 6"]],
  chevronLeft: [["path", "m15 18-6-6 6-6"]],
  chevronRight: [["path", "m9 18 6-6-6-6"]],
  arrowLeft: [["path", "m12 19-7-7 7-7"], ["path", "M19 12H5"]],
  arrowRight: [["path", "M5 12h14"], ["path", "m12 5 7 7-7 7"]],
  arrowUp: [["path", "m5 12 7-7 7 7"], ["path", "M12 19V5"]],
  arrowDown: [["path", "M12 5v14"], ["path", "m19 12-7 7-7-7"]],
  menu: [["path", "M4 6h16M4 12h16M4 18h16"]],
  more: [
    ["circle", 12, 12, 1],
    ["circle", 19, 12, 1],
    ["circle", 5, 12, 1],
  ],
  list: [["path", "M3 6h.01M8 6h13M3 12h.01M8 12h13M3 18h.01M8 18h13"]],

  /* ---- Rejim ---- */
  sun: [
    ["circle", 12, 12, 4],
    [
      "path",
      "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4",
    ],
  ],
  moon: [["path", "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"]],
};

/**
 * `null` qaytarish o'rniga ko'rinadigan belgi chiqaramiz: noto'g'ri yozilgan
 * nom jimgina yo'qolib ketsa, uni topish qiyin bo'ladi.
 */
const FALLBACK = ICONS.help;

export default function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  className = "",
  ...rest
}) {
  const parts = ICONS[name] || FALLBACK;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {parts.map((part, index) => {
        const [kind] = part;

        if (kind === "circle") {
          return (
            <circle key={index} cx={part[1]} cy={part[2]} r={part[3]} />
          );
        }

        if (kind === "rect") {
          return (
            <rect
              key={index}
              x={part[1]}
              y={part[2]}
              width={part[3]}
              height={part[4]}
              rx={part[5]}
            />
          );
        }

        return <path key={index} d={part[1]} />;
      })}
    </svg>
  );
}
