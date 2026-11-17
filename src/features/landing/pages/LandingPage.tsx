import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowCounterClockwise,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Buildings,
  CalendarCheck,
  CheckCircle,
  Exam,
  Funnel,
  Moon,
  Sun,
  Users,
  Wallet,
} from '@phosphor-icons/react';
import { BrandMark } from '@/components/layout/BrandMark';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { formatMoney, groupSep } from '@/lib/money';
import { cn } from '@/lib/utils';
import {
  DEMO_BRANCHES,
  DEMO_DEBTORS,
  DEMO_GROUP_STUDENTS,
  DEMO_LEAD_STAGES,
  DEMO_REVENUE,
  DEMO_SCHEDULE,
  DEMO_STUDENTS,
  type DemoAttendance,
  type DemoBranchId,
} from '@/features/landing/lib/demoData';
import {
  PermissionsDemo,
  RolePanelsDemo,
} from '@/features/landing/components/RoleDemos';
import {
  DEFAULT_LEARNER_TOGGLES,
  type LearnerToggles,
} from '@/features/landing/lib/roleDemoData';

/** Demo hisob sozlangan bo'lsa — login sahifasi demo rejimida ochiladi. */
const HAS_DEMO_ACCOUNT = Boolean(import.meta.env.VITE_DEMO_EMAIL);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full border border-hair px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
    {children}
  </span>
);

const OpenDemoButton = ({ className }: { className?: string }) =>
  HAS_DEMO_ACCOUNT ? (
    <Button asChild size="lg" className={cn('px-6 font-semibold', className)}>
      <a href="/login?demo=1">
        Demoni ochish <ArrowUpRight aria-hidden />
      </a>
    </Button>
  ) : (
    <Button asChild size="lg" className={cn('px-6 font-semibold', className)}>
      <a href="#demo">
        Demoni ochish <ArrowUpRight aria-hidden />
      </a>
    </Button>
  );

/* ------------------------------ Rahbar paneli ----------------------------- */

const SAMPLE_PAYMENT = 300_000;

function OwnerPanelDemo() {
  const [branch, setBranch] = useState<DemoBranchId | 'all'>('all');
  const [paid, setPaid] = useState<Record<string, number>>({});

  const inBranch = <T extends { branch: DemoBranchId }>(rows: T[]) =>
    branch === 'all' ? rows : rows.filter((r) => r.branch === branch);

  const debtors = inBranch(DEMO_DEBTORS)
    .map((d) => ({ ...d, debt: d.debt - (paid[d.id] ?? 0) }))
    .filter((d) => d.debt > 0);

  const extraRevenue = (id: DemoBranchId) =>
    DEMO_DEBTORS.filter((d) => d.branch === id).reduce(
      (sum, d) => sum + (paid[d.id] ?? 0),
      0,
    );

  const branches = DEMO_BRANCHES.filter(
    (b) => branch === 'all' || b.id === branch,
  ).map((b) => ({
    ...b,
    revenue: DEMO_REVENUE[b.id] + extraRevenue(b.id),
    students: DEMO_STUDENTS[b.id],
  }));
  const revenue = branches.reduce((s, b) => s + b.revenue, 0);
  const students = branches.reduce((s, b) => s + b.students, 0);
  const debt = debtors.reduce((s, d) => s + d.debt, 0);
  const maxRevenue = Math.max(...branches.map((b) => b.revenue));
  const next = debtors[0];

  return (
    <Card edgeToEdge>
      <div className="flex items-start justify-between gap-4 border-b border-hair px-5 py-4">
        <div>
          <p className="font-semibold">Rahbar paneli</p>
          <p className="text-xs text-muted-foreground">
            Namuna o‘quv markazi · joriy oy
          </p>
        </div>
        <span className="text-xs font-medium text-info">Interaktiv namuna</span>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Filialni tanlang</p>
          <div
            role="tablist"
            aria-label="Filial"
            className="flex gap-1 rounded-lg bg-muted p-1"
          >
            {[{ id: 'all' as const, name: 'Barchasi' }, ...DEMO_BRANCHES].map(
              (b) => (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={branch === b.id}
                  onClick={() => setBranch(b.id)}
                  className={cn(
                    'flex-auto whitespace-nowrap rounded-md px-1.5 py-2 text-xs font-medium transition-colors sm:px-2 sm:text-sm',
                    branch === b.id
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {b.name}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowDownLeft aria-hidden className="text-success" /> Tushum
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums sm:text-2xl">
              {groupSep(revenue)}
            </p>
            <p className="text-xs text-muted-foreground">so‘m</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpRight aria-hidden className="text-destructive" />{' '}
              Qarzdorlik
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-destructive sm:text-2xl">
              {groupSep(debt)}
            </p>
            <p className="text-xs text-muted-foreground">so‘m</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users aria-hidden /> O‘quvchilar
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums sm:text-2xl">
              {students}
            </p>
            <p className="text-xs text-muted-foreground">faol</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            Filiallar tushumi
          </p>
          {branches.map((b) => (
            <div key={b.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{b.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatMoney(b.revenue)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${(b.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Qarzdorlar · {debtors.length}
          </p>
          <ul className="divide-y divide-hair rounded-lg border border-hair">
            {debtors.length === 0 ? (
              <li className="flex items-center gap-2 px-3 py-3 text-sm text-success">
                <CheckCircle aria-hidden /> Qarzdorlar yo‘q
              </li>
            ) : (
              debtors.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{d.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {d.group}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-destructive">
                    {formatMoney(d.debt)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm">
            To‘lovni qayd eting — tushum va qarzdorlik qanday o‘zgarishini
            ko‘ring.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={!next}
              onClick={() =>
                next &&
                setPaid((p) => ({
                  ...p,
                  [next.id]:
                    (p[next.id] ?? 0) + Math.min(SAMPLE_PAYMENT, next.debt),
                }))
              }
            >
              {next
                ? `${formatMoney(Math.min(SAMPLE_PAYMENT, next.debt))} · ${next.name.split(' ')[0]}`
                : 'Hammasi to‘langan'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPaid({});
                setBranch('all');
              }}
            >
              <ArrowCounterClockwise aria-hidden /> Qayta boshlash
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          To‘qima ma’lumotlar. O‘zgarishlar saqlanmaydi.
        </p>
      </div>
    </Card>
  );
}

/* -------------------------------- Davomat -------------------------------- */

const ATTENDANCE_LABEL: Record<DemoAttendance, string> = {
  present: 'Keldi',
  late: 'Kechikdi',
  absent: 'Kelmadi',
};
const ATTENDANCE_NEXT: Record<DemoAttendance, DemoAttendance> = {
  present: 'late',
  late: 'absent',
  absent: 'present',
};
const ATTENDANCE_CLASS: Record<DemoAttendance, string> = {
  present: 'bg-success/15 text-success',
  late: 'bg-warning/20 text-warning-strong',
  absent: 'bg-destructive/10 text-destructive',
};

function AttendanceDemo() {
  const [rows, setRows] = useState(DEMO_GROUP_STUDENTS);
  const present = rows.filter((r) => r.status !== 'absent').length;
  const percent = Math.round((present / rows.length) * 100);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-semibold">FE-101 · Davomat</p>
          <p className="text-xs text-muted-foreground">
            Bugun · 09:00 · J. Karimov
          </p>
        </div>
        <span className="text-2xl font-semibold tabular-nums">{percent}%</span>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3">
            <span className="truncate text-sm">{r.name}</span>
            <button
              type="button"
              onClick={() =>
                setRows((all) =>
                  all.map((x) =>
                    x.id === r.id
                      ? { ...x, status: ATTENDANCE_NEXT[x.status] }
                      : x,
                  ),
                )
              }
              className={cn(
                'w-24 shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                ATTENDANCE_CLASS[r.status],
              )}
            >
              {ATTENDANCE_LABEL[r.status]}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Holatni o‘zgartirish uchun bosing. Namuna ma’lumot.
      </p>
    </Card>
  );
}

/* ------------------------------- Lidlar ---------------------------------- */

function LeadsDemo() {
  const max = DEMO_LEAD_STAGES[0].count;
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">Murojaatdan shartnomagacha</p>
        <Badge>Namuna</Badge>
      </div>
      <div className="space-y-3">
        {DEMO_LEAD_STAGES.map((s) => (
          <div key={s.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{s.name}</span>
              <span className="font-semibold tabular-nums">{s.count}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-info"
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg bg-muted p-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Murojaat</p>
          <p className="font-medium">F. Saidova</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Manba</p>
          <p className="font-medium">Instagram</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Keyingi aloqa</p>
          <p className="font-medium">Bugun 15:30</p>
        </div>
      </div>
    </Card>
  );
}

function ScheduleDemo() {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">Dars jadvali</p>
        <Badge>Namuna</Badge>
      </div>
      <ul className="space-y-2">
        {DEMO_SCHEDULE.map((l) => (
          <li
            key={`${l.day}-${l.time}`}
            className="flex items-center gap-3 rounded-lg border border-hair p-3"
          >
            <span className="w-20 shrink-0 text-xs text-muted-foreground">
              {l.day}
              <span className="block text-base font-semibold text-foreground tabular-nums">
                {l.time}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {l.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {l.group} · {l.teacher}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* --------------------------------- Sahifa -------------------------------- */

const FEATURES = [
  {
    icon: Users,
    title: 'O‘quvchilar va guruhlar',
    text: 'Har bir o‘quvchining kartasi: guruh, to‘lov, davomat va baholar bir joyda.',
  },
  {
    icon: Wallet,
    title: 'To‘lov va qarzdorlik',
    text: 'Kim qancha to‘lagan, kim qarzdor — filial kesimida darhol ko‘rinadi.',
  },
  {
    icon: CalendarCheck,
    title: 'Jadval va davomat',
    text: 'Haftalik shablondan darslar avtomatik yaratiladi, davomat bir bosishda.',
  },
  {
    icon: BookOpen,
    title: 'Kurslar va o‘quv dasturi',
    text: 'Modul → dars → materiallar. Video, fayl va havolalar bilan.',
  },
  {
    icon: Exam,
    title: 'Topshiriq va testlar',
    text: 'Savollar banki, avtomatik baholash, natijalar va baholar jurnali.',
  },
  {
    icon: Funnel,
    title: 'Lidlar (CRM)',
    text: 'Murojaat manbasi, bosqich, mas’ul xodim va keyingi aloqa vaqti.',
  },
  {
    icon: Buildings,
    title: 'Filiallar va rollar',
    text: 'Rahbar, menejer, operator, buxgalter, o‘qituvchi — har kimga o‘z huquqi.',
  },
  {
    icon: ArrowDownLeft,
    title: 'Xarajatlar',
    text: 'Ijara, reklama, o‘qituvchi hisob-kitobi — pul qayerga ketayotganini ko‘ring.',
  },
];

const FAQ = [
  [
    'Demoda nimani ko‘raman?',
    'Rahbar paneli, to‘lovlar, davomat, jadval va lidlar — barchasi to‘qima (namuna) ma’lumotlar bilan. Hech narsa saqlanmaydi.',
  ],
  [
    'Demo bilan haqiqiy tizimning farqi nima?',
    'Demo — namuna markaz. Haqiqiy tizimda o‘z filiallaringiz, o‘quvchilaringiz va xodimlaringiz bilan ishlaysiz.',
  ],
  [
    'Nechta filial bilan ishlash mumkin?',
    'Cheklov yo‘q. Rahbar barcha filiallarni, menejer esa faqat o‘z filialini ko‘radi.',
  ],
  [
    'Excel’dagi ma’lumotlarni ko‘chirsa bo‘ladimi?',
    'Ha, o‘quvchilar va lidlar ro‘yxatini import/eksport qilish mumkin.',
  ],
];

const LandingPage = () => {
  const { theme, toggle } = useTheme();
  const [learnerToggles, setLearnerToggles] = useState<LearnerToggles>(
    DEFAULT_LEARNER_TOGGLES,
  );

  useEffect(() => {
    const prev = document.title;
    document.title = 'EduLMS — o‘quv markazlari uchun boshqaruv tizimi';
    document.documentElement.lang = 'uz';
    return () => {
      document.title = prev;
    };
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-hair bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <BrandMark size="sm" title="EduLMS" />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">Kirish</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Yorug‘ rejim' : 'Tungi rejim'}
            >
              {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
            </Button>
            <OpenDemoButton className="h-10 px-4" />
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-20">
          <div className="lg:sticky lg:top-28">
            <Badge>O‘quv markazlari uchun CRM va LMS</Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              O‘quv markazingiz holati.{' '}
              <span className="text-primary">Bir qarashda.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              Tushum, qarzdorlik, davomat va filiallar — bitta tizimda. Yondagi
              namuna panelni o‘zingiz sinab ko‘ring.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <OpenDemoButton />
              <Button asChild size="lg" variant="outline" className="px-6">
                <Link to="/login">
                  Tizimga kirish <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Demo: namuna o‘quv markazi, to‘qima ma’lumotlar.
            </p>
          </div>
          <div id="demo" className="scroll-mt-24">
            <OwnerPanelDemo />
          </div>
        </section>

        <section className="border-y border-hair bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight">
              Telegram guruhlari, Excel va daftarlar o‘rniga — bitta platforma.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <Card key={title}>
                  <Icon aria-hidden className="size-6 text-primary" />
                  <p className="mt-4 font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="panels"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
        >
          <h2 className="text-3xl font-semibold tracking-tight">
            Har bir rolga — o‘z paneli.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Rahbar, administrator, o‘qituvchi va o‘quvchi — har biri faqat
            o‘ziga keraklisini ko‘radi. Panellarni almashtirib sinab ko‘ring.
          </p>
          <div className="mt-8">
            <RolePanelsDemo
              toggles={learnerToggles}
              admin={
                <>
                  <LeadsDemo />
                  <ScheduleDemo />
                </>
              }
              teacher={
                <>
                  <AttendanceDemo />
                  <ScheduleDemo />
                </>
              }
            />
          </div>
        </section>

        <section className="border-t border-hair bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">
              Kim nima qila olishini markaz egasi hal qiladi.
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Xodimlarga ruxsat bering yoki oling, o‘quvchi kabinetidagi
              bo‘limlarni yoqing-o‘chiring.
            </p>
            <div className="mt-8">
              <PermissionsDemo
                toggles={learnerToggles}
                onToggle={(id, value) =>
                  setLearnerToggles((prev) => ({ ...prev, [id]: value }))
                }
              />
            </div>
          </div>
        </section>

        <section className="border-t border-hair bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">
              Ko‘p beriladigan savollar
            </h2>
            <Card edgeToEdge className="mt-8 divide-y divide-hair">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {q}
                    <span
                      aria-hidden
                      className="text-xl text-muted-foreground transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {a}
                  </p>
                </details>
              ))}
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">
            O‘quv markazingiz holatini bir joyda ko‘ring.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <OpenDemoButton />
            <Button asChild size="lg" variant="outline" className="px-6">
              <Link to="/login">Tizimga kirish</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-hair">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>© {year} EduLMS</span>
          <span>Sahifadagi barcha raqamlar namuna (to‘qima) ma’lumotlar.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
