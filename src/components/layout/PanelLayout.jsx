import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../theme/themeContext";

/**
 * Barcha rollar (superadmin / admin / teacher / student) uchun umumiy qobiq.
 *
 * - Desktopda: chap tomonda `sticky` yon panel. Panel balandligi ekran
 *   balandligiga teng, menyu ro'yxati o'z ichida scroll bo'ladi, "Chiqish"
 *   tugmasi esa doim pastda turadi va ekrandan tushib ketmaydi.
 * - Telefonda: yon panel yashiriladi, o'rniga ekran pastida icon panel chiqadi.
 *   Menyu 4 tadan ko'p bo'lsa, qolganlari "Ko'proq" varag'iga tushadi.
 */
export default function PanelLayout({
  brand = "EduCenter",
  brandIcon = "🎓",
  menuItems = [],
  activeKey,
  onSelect,
  greeting,
  subtitle,
  user,
  roleLabel,
  onLogout,
  headerExtra = null,
  headerActions = null,
  logoutLabel = "Chiqish",
  children,
}) {
  const { theme, darkMode, setDarkMode } = useTheme();
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const profileButtonRef = useRef(null);
  const profilePanelRef = useRef(null);
  const moreButtonRef = useRef(null);
  const moreSheetRef = useRef(null);

  const profileName = user?.fullName || user?.phone || "Foydalanuvchi";
  const profileInitial = String(profileName).trim().charAt(0).toUpperCase();

  const MOBILE_PRIMARY_COUNT = 4;
  const primaryItems = menuItems.slice(0, MOBILE_PRIMARY_COUNT);
  const restItems = menuItems.slice(MOBILE_PRIMARY_COUNT);
  const isRestActive = restItems.some((item) => item.key === activeKey);

  useEffect(() => {
    const handleOutside = (event) => {
      if (
        showProfilePanel &&
        !profilePanelRef.current?.contains(event.target) &&
        !profileButtonRef.current?.contains(event.target)
      ) {
        setShowProfilePanel(false);
      }

      if (
        showMoreSheet &&
        !moreSheetRef.current?.contains(event.target) &&
        !moreButtonRef.current?.contains(event.target)
      ) {
        setShowMoreSheet(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showProfilePanel, showMoreSheet]);

  const handleSelect = (key) => {
    setShowMoreSheet(false);
    onSelect?.(key);
  };

  return (
    <div className={`min-h-screen flex ${theme.app}`}>
      <aside
        className={`hidden md:flex sticky top-0 h-screen w-60 shrink-0 flex-col border-r p-4 ${theme.sidebar}`}
      >
        <h1 className="text-2xl font-bold text-violet-600 mb-6 shrink-0">
          {brand}
        </h1>

        <nav className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleSelect(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition cursor-pointer ${
                activeKey === item.key
                  ? theme.active
                  : `${theme.menu} ${theme.hover}`
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="font-medium text-sm truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={onLogout}
          className="shrink-0 mt-4 bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl cursor-pointer transition"
        >
          {logoutLabel}
        </button>
      </aside>

      <main className={`flex-1 min-w-0 p-4 pb-28 md:p-8 md:pb-8 ${theme.main}`}>
        {/*
          Telefonda: birinchi qatorda chapda brend, o'ngda tungi rejim va
          profil tugmalari turadi; salomlashuv va boshqa tugmalar pastga
          tushadi. Kattaroq ekranda esa hammasi bitta qatorga qaytadi.
        */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-4 mb-8 lg:flex-nowrap lg:gap-4">
          <h1 className="order-1 md:hidden min-w-0 flex-1 text-xl font-bold text-violet-600">
            {brandIcon} {brand}
          </h1>

          <div className="order-3 w-full min-w-0 lg:order-1 lg:w-auto lg:flex-1">
            <h2
              className={`text-xl md:text-2xl font-semibold truncate ${theme.text}`}
            >
              {greeting}
            </h2>
            {subtitle && (
              <p className={`text-sm mt-1 ${theme.soft}`}>{subtitle}</p>
            )}
          </div>

          {(headerExtra || headerActions) && (
            <div className="order-4 flex w-full flex-wrap items-center gap-3 lg:order-2 lg:w-auto lg:shrink-0 lg:justify-end">
              {headerExtra}

              {headerActions}
            </div>
          )}

          <div className="order-2 ml-auto flex items-center gap-3 shrink-0 lg:order-3 lg:ml-0">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border cursor-pointer ${theme.topBtn}`}
              aria-label={darkMode ? "Yorug' rejim" : "Tungi rejim"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={() => setShowProfilePanel((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold cursor-pointer"
                title="Profil"
              >
                {profileInitial}
              </button>

              {showProfilePanel && (
                <div
                  ref={profilePanelRef}
                  className={`absolute right-0 top-12 z-50 w-72 rounded-2xl border p-4 shadow-2xl ${theme.card} ${theme.rowBorder}`}
                >
                  <p
                    className={`text-xs uppercase tracking-wide ${theme.soft}`}
                  >
                    Profil
                  </p>
                  <h3 className={`text-base font-semibold mt-1 ${theme.text}`}>
                    {profileName}
                  </h3>
                  <p className={`text-sm mt-1 ${theme.soft}`}>
                    {user?.phone || "Telefon yo'q"}
                  </p>
                  {roleLabel && (
                    <p className={`text-xs mt-2 ${theme.soft}`}>
                      Rol: {roleLabel}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setShowProfilePanel(false);
                      onLogout?.();
                    }}
                    className="mt-4 w-full rounded-xl bg-red-500 hover:bg-red-600 text-white py-2.5 text-sm"
                  >
                    {logoutLabel}
                  </button>

                  <button
                    onClick={() => setShowProfilePanel(false)}
                    className={`mt-2 w-full rounded-xl border py-2.5 text-sm ${theme.topBtn}`}
                  >
                    Yopish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {children}
      </main>

      {/* Telefon uchun pastki icon panel */}
      {showMoreSheet && (
        <div
          ref={moreSheetRef}
          className={`md:hidden fixed left-3 right-3 bottom-[4.75rem] z-40 rounded-2xl border p-4 shadow-2xl ${theme.subpanel}`}
        >
          <div className="grid grid-cols-3 gap-2">
            {restItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key)}
                className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl transition ${
                  activeKey === item.key
                    ? theme.active
                    : `${theme.menu} ${theme.hover}`
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="text-[11px] font-medium text-center leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onLogout}
            className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm"
          >
            {logoutLabel}
          </button>
        </div>
      )}

      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t px-1 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] ${theme.sidebar}`}
      >
        <div
          className={`grid ${restItems.length ? "grid-cols-5" : "grid-cols-4"}`}
        >
          {primaryItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleSelect(item.key)}
              className={`min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition ${
                activeKey === item.key ? theme.active : theme.menu
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] leading-tight font-medium w-full truncate px-0.5">
                {item.shortLabel || item.label}
              </span>
            </button>
          ))}

          {restItems.length > 0 && (
            <button
              ref={moreButtonRef}
              onClick={() => setShowMoreSheet((prev) => !prev)}
              className={`min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition ${
                isRestActive || showMoreSheet ? theme.active : theme.menu
              }`}
            >
              <span className="text-lg leading-none">☰</span>
              <span className="text-[10px] leading-tight font-medium w-full truncate px-0.5">
                Ko'proq
              </span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
