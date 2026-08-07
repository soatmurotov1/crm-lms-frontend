import { useState } from "react";
import { useTheme } from "../../theme/themeContext";

/**
 * Parol maydoni — o'ng chetida "ko'z" tugmasi bilan.
 *
 * Panel formalarida (xodim, o'quvchi, o'qituvchi, tashkilot) bir xil
 * ko'rinishda ishlatiladi, shuning uchun tugma va uning belgilari shu yerda
 * bir marta yozilgan.
 */
export default function PasswordInput({
  name = "password",
  value,
  onChange,
  placeholder = "Parol",
  autoComplete = "new-password",
  className = "",
  ...rest
}) {
  const { theme, darkMode } = useTheme();
  const [visible, setVisible] = useState(false);

  // "Ko'z" tugmasi maydon foniga singib ketmasligi uchun aylana fon beriladi —
  // login sahifasidagi tugma bilan bir xil ko'rinish.
  const toggleTone = darkMode
    ? "text-slate-200 bg-white/10 hover:bg-white/20"
    : "text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200";

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full rounded-xl border px-4 py-3 pr-12 outline-none min-w-0 ${theme.input} ${className}`}
        {...rest}
      />

      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full flex items-center justify-center transition-colors cursor-pointer ${toggleTone}`}
        aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
        title={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
      >
        {visible ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 3L21 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M10.58 10.58a2 2 0 002.83 2.83"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M9.88 5.09A9.5 9.5 0 0112 4.9c4.5 0 8.06 3.2 9.5 7.1a13.2 13.2 0 01-2.7 4.06M6.2 6.2A13.1 13.1 0 002.5 12c1.44 3.9 5 7.1 9.5 7.1 1.4 0 2.72-.3 3.9-.85"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.5 12C3.94 8.1 7.5 4.9 12 4.9s8.06 3.2 9.5 7.1c-1.44 3.9-5 7.1-9.5 7.1S3.94 15.9 2.5 12z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
      </button>
    </div>
  );
}
