import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../theme/themeContext";
import Icon from "../ui/Icon";

/**
 * Barcha rollar (superadmin / admin / teacher / student) uchun umumiy qobiq.
 *
 * - Desktopda: chap tomonda `sticky` yon panel. Panel balandligi ekran
 *   balandligiga teng, menyu ro'yxati o'z ichida scroll bo'ladi, foydalanuvchi
 *   bloki esa doim pastda turadi.
 * - Telefonda: yon panel yashiriladi, o'rniga ekran pastida icon panel chiqadi.
 *   Menyu 4 tadan ko'p bo'lsa, qolganlari "Ko'proq" varag'iga tushadi.
 *
 * Menyu elementi: { key, label, shortLabel?, icon }
 * `icon` — `Icon` komponentidagi nom (masalan "students", "payments").
 */
export default function PanelLayout({
  brand = "EduCenter",
  brandIcon = "students",
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

  /*
    Profil menyusi ikki joyda chiqadi — desktopda yon panel pastida,
    telefonda sarlavha qatorida. Ikkalasi ham DOM'da turadi (biri CSS bilan
    yashiriladi), shuning uchun "tashqariga bosildi" tekshiruvi uchun
    har biriga alohida ref kerak: bitta ref ikkalasiga qo'yilsa, oxirgisi
    birinchisini bosib ketadi.
  */
  const sidebarProfileRef = useRef(null);
  const headerProfileRef = useRef(null);
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
        !sidebarProfileRef.current?.contains(event.target) &&
        !headerProfileRef.current?.contains(event.target)
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

  // Ochiq panel Escape bilan yopilsin — klaviatura bilan ishlaganda kerak.
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      setShowProfilePanel(false);
      setShowMoreSheet(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = (key) => {
    setShowMoreSheet(false);
    onSelect?.(key);
  };

  const profilePanel = (
    <div
      className={`absolute z-50 w-64 rounded-lg border p-1 ${theme.subpanel}`}
      role="menu"
    >
      <div className="px-3 py-2.5">
        <p className={`text-sm font-medium truncate ${theme.text}`}>
          {profileName}
        </p>
        <p className={`text-xs mt-0.5 truncate ${theme.soft}`}>
          {user?.phone || "Telefon kiritilmagan"}
        </p>
        {roleLabel && (
          <p className={`text-xs mt-1.5 ${theme.subtle}`}>{roleLabel}</p>
        )}
      </div>

      <div className="my-1 border-t border-line" />

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          setShowProfilePanel(false);
          onLogout?.();
        }}
        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm
          text-danger hover:bg-danger-soft transition-colors"
      >
        <Icon name="logout" size={16} />
        {logoutLabel}
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen flex ${theme.app}`}>
      {/* ---------------------------------------------------------------- */}
      {/* Yon panel (desktop)                                              */}
      {/* ---------------------------------------------------------------- */}
      <aside
        className={`hidden md:flex sticky top-0 h-screen w-[15rem] shrink-0 flex-col border-r ${theme.sidebar}`}
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md
              bg-accent text-accent-fg"
          >
            <Icon name={brandIcon} size={16} strokeWidth={2} />
          </span>
          <span className={`text-sm font-semibold tracking-tight ${theme.text}`}>
            {brand}
          </span>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 space-y-0.5">
          {menuItems.map((item) => {
            const isActive = activeKey === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelect(item.key)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-2
                  text-left text-sm transition-colors duration-100
                  ${isActive ? `${theme.active} font-medium` : `${theme.menu} ${theme.hover}`}`}
              >
                <Icon name={item.icon} size={17} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/*
          Foydalanuvchi bloki panelning pastida. Avval bu joyda to'q qizil
          "Chiqish" tugmasi turardi: qizil rang xavfli, qaytarib bo'lmaydigan
          harakat uchun saqlanishi kerak, tizimdan chiqish esa bunday emas —
          shuning uchun u profil menyusining ichiga ko'chirildi.
        */}
        <div
          className="relative shrink-0 border-t border-line p-2"
          ref={sidebarProfileRef}
        >
          <button
            type="button"
            onClick={() => setShowProfilePanel((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={showProfilePanel}
            className={`flex w-full items-center gap-2.5 rounded-md p-2 text-left
              transition-colors ${theme.hover}`}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                bg-surface-3 text-xs font-semibold text-fg"
            >
              {profileInitial}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-sm ${theme.text}`}>
                {profileName}
              </span>
              {roleLabel && (
                <span className={`block truncate text-xs ${theme.subtle}`}>
                  {roleLabel}
                </span>
              )}
            </span>
            <Icon
              name="chevronUp"
              size={14}
              className={`shrink-0 ${theme.subtle}`}
            />
          </button>

          {showProfilePanel && (
            <div className="absolute bottom-full left-2 right-2 mb-1">
              {profilePanel}
            </div>
          )}
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Asosiy ustun                                                      */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          Sarlavha qatori yopishqoq: uzun jadvalni pastga aylantirganda ham
          sahifa nomi va asosiy tugmalar ko'rinib turadi.
        */}
        <header
          className={`sticky top-0 z-30 border-b px-4 md:px-6 ${theme.sidebar}`}
        >
          <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 py-2.5 lg:flex-nowrap">
            <div className="order-1 flex min-w-0 items-center gap-2.5 md:hidden">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md
                  bg-accent text-accent-fg"
              >
                <Icon name={brandIcon} size={16} strokeWidth={2} />
              </span>
              <span className={`text-sm font-semibold ${theme.text}`}>
                {brand}
              </span>
            </div>

            <div className="order-3 w-full min-w-0 lg:order-1 lg:w-auto lg:flex-1">
              <h1
                className={`truncate text-[0.9375rem] font-semibold leading-5 ${theme.text}`}
              >
                {greeting}
              </h1>
              {subtitle && (
                <p className={`truncate text-xs mt-0.5 ${theme.soft}`}>
                  {subtitle}
                </p>
              )}
            </div>

            {(headerExtra || headerActions) && (
              <div className="order-4 flex w-full flex-wrap items-center gap-2 lg:order-2 lg:w-auto lg:shrink-0 lg:justify-end">
                {headerExtra}
                {headerActions}
              </div>
            )}

            <div className="order-2 ml-auto flex shrink-0 items-center gap-1.5 lg:order-3 lg:ml-0">
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className={`flex h-8 w-8 items-center justify-center rounded-md border
                  transition-colors ${theme.topBtn}`}
                aria-label={darkMode ? "Yorug' rejim" : "Tungi rejim"}
                title={darkMode ? "Yorug' rejim" : "Tungi rejim"}
              >
                <Icon name={darkMode ? "sun" : "moon"} size={16} />
              </button>

              {/* Desktopda profil yon panelning pastida — bu yerda takrorlanmaydi */}
              <div className="relative md:hidden" ref={headerProfileRef}>
                <button
                  type="button"
                  onClick={() => setShowProfilePanel((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={showProfilePanel}
                  className="flex h-8 w-8 items-center justify-center rounded-full
                    bg-surface-3 text-xs font-semibold text-fg"
                  title="Profil"
                >
                  {profileInitial}
                </button>

                {showProfilePanel && (
                  <div className="absolute right-0 top-10">{profilePanel}</div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 pb-24 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Pastki panel (telefon)                                            */}
      {/* ---------------------------------------------------------------- */}
      {showMoreSheet && (
        <div
          ref={moreSheetRef}
          className={`md:hidden fixed left-3 right-3 bottom-[4.25rem] z-40 rounded-lg border p-2 ${theme.subpanel}`}
        >
          <div className="grid grid-cols-3 gap-1">
            {restItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelect(item.key)}
                className={`flex flex-col items-center gap-1.5 rounded-md px-2 py-3 transition-colors
                  ${activeKey === item.key ? theme.active : `${theme.menu} ${theme.hover}`}`}
              >
                <Icon name={item.icon} size={18} />
                <span className="text-2xs font-medium leading-tight text-center">
                  {item.shortLabel || item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t ${theme.sidebar}
          px-1 pb-[env(safe-area-inset-bottom)]`}
      >
        <div className={`grid ${restItems.length ? "grid-cols-5" : "grid-cols-4"}`}>
          {primaryItems.map((item) => {
            const isActive = activeKey === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelect(item.key)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex min-w-0 flex-col items-center justify-center gap-1 py-2
                  transition-colors ${isActive ? "text-accent" : theme.menu}`}
              >
                {/* Aktiv bo'limni to'la bo'yalgan tugma emas, yupqa chiziq belgilaydi */}
                {isActive && (
                  <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-accent" />
                )}
                <Icon name={item.icon} size={19} />
                <span className="w-full truncate px-0.5 text-2xs font-medium leading-tight">
                  {item.shortLabel || item.label}
                </span>
              </button>
            );
          })}

          {restItems.length > 0 && (
            <button
              ref={moreButtonRef}
              type="button"
              onClick={() => setShowMoreSheet((prev) => !prev)}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-1 py-2
                transition-colors ${isRestActive || showMoreSheet ? "text-accent" : theme.menu}`}
            >
              {isRestActive && (
                <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-accent" />
              )}
              <Icon name="more" size={19} />
              <span className="w-full truncate px-0.5 text-2xs font-medium leading-tight">
                Ko'proq
              </span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
