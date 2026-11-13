import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom has no ResizeObserver; several Radix primitives (Checkbox, Popover
// size measurement, etc.) call it on mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub;

// jsdom has no layout engine, so scrollIntoView is unimplemented — cmdk
// (CommandPalette) calls it when an item becomes selected.
window.HTMLElement.prototype.scrollIntoView = () => {};
window.scrollTo = () => {};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => str,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// LMS bloklari (kurs/o'quvchi tablari, dashboard bloki, topbar qo'ng'irog'i)
// o'z so'rovlarini yuboradi. Boshqa feature'larning testlari ularni
// sinamaydi — shu sabab global ravishda bo'sh komponentlar bilan almashtiriladi.
vi.mock('@/features/lms/api/widgets', () => ({
  CourseCurriculumPanel: () => null,
  CourseEnrollmentsPanel: () => null,
  StudentProgressPanel: () => null,
  LmsOverview: () => null,
  NotificationBell: () => null,
}));
