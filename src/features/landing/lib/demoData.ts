// To'qima (namuna) ma'lumotlar — bosh sahifadagi interaktiv demo uchun.
// Haqiqiy mijozlarga tegishli emas, serverga yuborilmaydi va saqlanmaydi.

export type DemoBranchId = 'yunusobod' | 'chilonzor' | 'sergeli';

export type DemoDebtor = {
  id: string;
  name: string;
  group: string;
  branch: DemoBranchId;
  debt: number;
};

export const DEMO_BRANCHES: { id: DemoBranchId; name: string }[] = [
  { id: 'yunusobod', name: 'Yunusobod' },
  { id: 'chilonzor', name: 'Chilonzor' },
  { id: 'sergeli', name: 'Sergeli' },
];

export const DEMO_REVENUE: Record<DemoBranchId, number> = {
  yunusobod: 24_600_000,
  chilonzor: 18_900_000,
  sergeli: 9_300_000,
};

export const DEMO_STUDENTS: Record<DemoBranchId, number> = {
  yunusobod: 148,
  chilonzor: 112,
  sergeli: 57,
};

export const DEMO_DEBTORS: DemoDebtor[] = [
  {
    id: 'd1',
    name: 'Javohir Toshmatov',
    group: 'FE-101',
    branch: 'yunusobod',
    debt: 600_000,
  },
  {
    id: 'd2',
    name: 'Sevara Rasulova',
    group: 'IELTS-7',
    branch: 'chilonzor',
    debt: 450_000,
  },
  {
    id: 'd3',
    name: 'Doston Ismoilov',
    group: 'MATH-11',
    branch: 'sergeli',
    debt: 500_000,
  },
  {
    id: 'd4',
    name: 'Kamola Umarova',
    group: 'ENG-A2',
    branch: 'yunusobod',
    debt: 300_000,
  },
  {
    id: 'd5',
    name: 'Behruz Nazarov',
    group: 'PY-01',
    branch: 'chilonzor',
    debt: 800_000,
  },
];

export type DemoAttendance = 'present' | 'late' | 'absent';

export const DEMO_GROUP_STUDENTS: {
  id: string;
  name: string;
  status: DemoAttendance;
}[] = [
  { id: 's1', name: 'Aziz Abdullayev', status: 'present' },
  { id: 's2', name: 'Madina Karimova', status: 'present' },
  { id: 's3', name: 'Ulug‘bek Sobirov', status: 'late' },
  { id: 's4', name: 'Zarina Qosimova', status: 'present' },
  { id: 's5', name: 'Sherzod Ahmedov', status: 'absent' },
  { id: 's6', name: 'Nilufar Umarova', status: 'present' },
];

export const DEMO_LEAD_STAGES = [
  { name: 'Yangi murojaat', count: 18 },
  { name: 'Bog‘lanildi', count: 11 },
  { name: 'Sinov darsi', count: 6 },
  { name: 'Shartnoma', count: 4 },
];

export const DEMO_SCHEDULE = [
  {
    day: 'Dushanba',
    time: '09:00',
    title: 'Frontend (React)',
    group: 'FE-101',
    teacher: 'J. Karimov',
  },
  {
    day: 'Dushanba',
    time: '14:00',
    title: 'General English',
    group: 'ENG-A2',
    teacher: 'D. Rahimova',
  },
  {
    day: 'Chorshanba',
    time: '11:00',
    title: 'IELTS Writing',
    group: 'IELTS-7',
    teacher: 'M. Yusupova',
  },
  {
    day: 'Juma',
    time: '16:00',
    title: 'Matematika',
    group: 'MATH-11',
    teacher: 'B. Aliyev',
  },
];
