// Apply theme and saved language before React mounts to avoid FOUC.
(function () {
  try {
    var lang = (localStorage.getItem('lang') || '').slice(0, 2);
    if (lang === 'uz' || lang === 'ru' || lang === 'en') {
      document.documentElement.lang = lang;
    }
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    var theme =
      stored && stored !== 'system'
        ? stored
        : prefersDark
          ? 'dark'
          : 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
