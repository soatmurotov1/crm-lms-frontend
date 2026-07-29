import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./themeContext";
import { getThemeTokens } from "./tokens";

const THEME_STORAGE_KEY = "crm_theme_v1";

// Dark rejim avval admin dashboard keshi ichida saqlangan. Eski sozlama
// yo'qolmasligi uchun bir marta o'qib olamiz.
const LEGACY_ADMIN_CACHE_KEY = "crm_admin_dashboard_cache_v1";

const readStoredDarkMode = () => {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw !== null) return raw === "dark";

    const legacyRaw = localStorage.getItem(LEGACY_ADMIN_CACHE_KEY);
    if (!legacyRaw) return false;

    const parsed = JSON.parse(legacyRaw);
    return Boolean(parsed?.darkMode);
  } catch {
    return false;
  }
};

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(readStoredDarkMode);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, darkMode ? "dark" : "light");
    } catch {
      // Saqlash imkoni bo'lmasa ham ilova ishlashda davom etsin.
    }
  }, [darkMode]);

  /*
    Rejim Tailwind klasslari bilan beriladi, ya'ni CSS uni bilmaydi. Brauzer
    saqlangan parolni to'ldirganda maydon fonini o'zi bo'yaydi va buni faqat
    CSS orqali bekor qilish mumkin — shuning uchun rejimni <html> ga ham
    yozib qo'yamiz. `index.css` shu belgiga tayanadi.
  */
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode((prev) => !prev), []);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      toggleDarkMode,
      theme: getThemeTokens(darkMode),
    }),
    [darkMode, toggleDarkMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
