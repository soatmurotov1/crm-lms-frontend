/**
 * LMS'ning boshqa feature'lar (kurs, o'quvchi, dashboard, layout) ichiga
 * joylanadigan bloklari. Feature chegarasi qoidasi bo'yicha boshqa feature
 * faqat `api/` yoki `types.ts` orqali import qiladi — shu sabab bu yerdan.
 */
export { CurriculumEditor as CourseCurriculumPanel } from '@/features/lms/components/CurriculumEditor';
export { EnrollmentsPanel as CourseEnrollmentsPanel } from '@/features/lms/components/EnrollmentsPanel';
export { StudentProgressPanel } from '@/features/lms/components/StudentProgressPanel';
export { LmsOverview } from '@/features/lms/components/LmsOverview';
export { NotificationBell } from '@/features/lms/components/NotificationBell';
