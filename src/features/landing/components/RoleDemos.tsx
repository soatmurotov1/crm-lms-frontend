import { useState, type ReactNode } from 'react';
import { CheckCircle, House, Lock } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import {
  DEMO_LEARNER_SECTIONS,
  type DemoLearnerSection,
  type LearnerToggles,
} from '@/features/landing/lib/roleDemoData';
import { Switch } from '@/components/ui/switch';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

/* ------------------------------ Ma'lumotlar ------------------------------ */

const STAFF_ROLES = ['Menejer', 'Operator', 'Buxgalter', 'O‘qituvchi'] as const;

const STAFF_ACTIONS: { label: string; defaults: boolean[] }[] = [
  { label: 'O‘quvchi qo‘shish', defaults: [true, true, false, false] },
  { label: 'To‘lov qabul qilish', defaults: [true, true, true, false] },
  { label: 'Xarajatlarni ko‘rish', defaults: [true, false, true, false] },
  { label: 'Davomat belgilash', defaults: [true, true, false, true] },
  { label: 'Topshiriq va test', defaults: [true, false, false, true] },
  { label: 'Xodim qo‘shish', defaults: [true, false, false, false] },
];

const Tag = ({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'success' | 'warning' | 'info';
}) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium',
      tone === 'success' && 'bg-success/15 text-success',
      tone === 'warning' && 'bg-warning/20 text-warning-strong',
      tone === 'info' && 'bg-info/10 text-info',
      tone === 'muted' && 'bg-muted text-muted-foreground',
    )}
  >
    {children}
  </span>
);

/* ------------------------------ Administrator ----------------------------- */

const TODAY_PAYMENTS = [
  {
    name: 'Aziz Abdullayev',
    group: 'FE-101',
    amount: 600_000,
    method: 'Karta',
  },
  { name: 'Madina Karimova', group: 'ENG-A2', amount: 300_000, method: 'Naqd' },
  {
    name: 'Javohir Toshmatov',
    group: 'IELTS-7',
    amount: 450_000,
    method: 'Karta',
  },
];

function AdminTodayDemo() {
  const [called, setCalled] = useState<string[]>([]);
  const toCall = ['Doston Ismoilov', 'Behruz Nazarov', 'Kamola Umarova'];
  return (
    <Card heading="Bugun" action={<Tag>Namuna</Tag>}>
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Bugungi to‘lovlar
      </p>
      <ul className="mb-4 divide-y divide-hair">
        {TODAY_PAYMENTS.map((p) => (
          <li
            key={p.name}
            className="flex items-center justify-between gap-2 py-2 text-sm"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">
                {p.group} · {p.method}
              </span>
            </span>
            <span className="shrink-0 tabular-nums text-success">
              +{formatMoney(p.amount)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Qarzdorlarga qo‘ng‘iroq
      </p>
      <ul className="space-y-1.5">
        {toCall.map((name) => {
          const done = called.includes(name);
          return (
            <li key={name}>
              <button
                type="button"
                onClick={() =>
                  setCalled((c) =>
                    done ? c.filter((x) => x !== name) : [...c, name],
                  )
                }
                className="flex w-full items-center justify-between gap-2 rounded-md border border-hair px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span
                  className={cn(done && 'text-muted-foreground line-through')}
                >
                  {name}
                </span>
                {done ? (
                  <CheckCircle
                    aria-hidden
                    weight="fill"
                    className="size-4 text-success"
                  />
                ) : (
                  <Tag tone="warning">Qo‘ng‘iroq</Tag>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* -------------------------------- O'qituvchi ------------------------------- */

function TeacherWorkDemo() {
  const [graded, setGraded] = useState<Record<string, number>>({});
  const subs = [
    { id: 's1', name: 'Aziz Abdullayev', task: 'React: Todo ilova' },
    { id: 's2', name: 'Zarina Qosimova', task: 'React: Todo ilova' },
    { id: 's3', name: 'Nilufar Umarova', task: 'Flexbox mashqi' },
  ];
  return (
    <Card
      heading="Tekshirish kerak"
      action={
        <Tag tone="info">{subs.length - Object.keys(graded).length} ta</Tag>
      }
    >
      <ul className="space-y-2">
        {subs.map((s) => (
          <li key={s.id} className="rounded-md border border-hair p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {s.name}
                </span>
                <span className="text-xs text-muted-foreground">{s.task}</span>
              </span>
              {graded[s.id] ? (
                <Tag tone="success">{graded[s.id]}/10</Tag>
              ) : null}
            </div>
            {!graded[s.id] ? (
              <div className="mt-2 flex gap-1">
                {[6, 8, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setGraded((g) => ({ ...g, [s.id]: score }))}
                    className="flex-1 rounded-md bg-muted px-2 py-1 text-xs font-medium hover:bg-foreground hover:text-background"
                  >
                    {score} ball
                  </button>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        O‘qituvchi faqat o‘z guruhlarini ko‘radi.
      </p>
    </Card>
  );
}

/* --------------------------------- O'quvchi -------------------------------- */

function StudentPortalDemo({ toggles }: { toggles: LearnerToggles }) {
  const [active, setActive] = useState<'home' | DemoLearnerSection>('home');
  const nav = [
    { id: 'home' as const, label: 'Bosh sahifa', icon: House },
    ...DEMO_LEARNER_SECTIONS.filter((s) => toggles[s.id]),
  ];
  const current = active !== 'home' && !toggles[active] ? 'home' : active;

  return (
    <Card edgeToEdge className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-hair px-4 py-3">
        <div>
          <p className="font-semibold">O‘quvchi kabineti</p>
          <p className="text-xs text-muted-foreground">
            Sevara Rasulova · IELTS-7
          </p>
        </div>
        <Tag>Namuna</Tag>
      </div>
      <div className="grid md:grid-cols-[180px_1fr]">
        <nav className="flex gap-1 overflow-x-auto border-b border-hair p-2 md:flex-col md:border-b-0 md:border-r">
          {nav.map(({ id, label, icon: NavIcon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-left text-sm',
                current === id
                  ? 'bg-muted font-medium'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <NavIcon aria-hidden className="size-4" /> {label}
            </button>
          ))}
        </nav>
        <div className="min-h-64 p-4 text-sm">
          {current === 'home' ? (
            <div className="space-y-3">
              <p className="text-lg font-semibold">Salom, Sevara!</p>
              <div className="grid grid-cols-2 gap-2">
                {toggles.schedule ? (
                  <Mini label="Keyingi dars" value="Bugun 16:00" />
                ) : null}
                {toggles.assignments ? (
                  <Mini label="Bajarilmagan" value="1 topshiriq" />
                ) : null}
                {toggles.quizzes ? (
                  <Mini label="Ochiq test" value="1 ta" />
                ) : null}
                {toggles.payments ? (
                  <Mini label="Qarzdorlik" value={formatMoney(220_000)} />
                ) : null}
                {toggles.grades ? (
                  <Mini label="O‘rtacha baho" value="87%" />
                ) : null}
                {toggles.notifications ? (
                  <Mini label="Yangi xabar" value="1 ta" />
                ) : null}
              </div>
            </div>
          ) : current === 'schedule' ? (
            <ul className="space-y-2">
              {[
                'Sesh 16:00 · Amaliyot',
                'Pay 16:00 · Writing',
                'Shan 12:00 · Mock test',
              ].map((x) => (
                <li
                  key={x}
                  className="flex justify-between rounded-md border border-hair px-3 py-2"
                >
                  {x} <Tag tone="info">IELTS-7</Tag>
                </li>
              ))}
            </ul>
          ) : current === 'courses' ? (
            <div className="space-y-3">
              <p className="font-medium">IELTS 7.0+ tayyorlov</p>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-[62%] rounded-full bg-primary" />
              </div>
              <p className="text-xs text-muted-foreground">
                5/8 dars o‘qilgan · video va materiallar
              </p>
            </div>
          ) : current === 'assignments' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md border border-hair px-3 py-2">
                Writing Task 2 essay <Tag tone="warning">Bajarilmagan</Tag>
              </div>
              <div className="flex items-center justify-between rounded-md border border-hair px-3 py-2">
                Reading: True/False <Tag tone="success">9/10</Tag>
              </div>
            </div>
          ) : current === 'quizzes' ? (
            <div className="flex items-center justify-between rounded-md border border-hair px-3 py-2">
              Vocabulary quiz · 3 savol <Tag tone="success">100% · O‘tdi</Tag>
            </div>
          ) : current === 'grades' ? (
            <ul className="space-y-1.5">
              {[
                ['Vocabulary quiz', '100%'],
                ['Reading', '90%'],
                ['Listening mock', '72%'],
              ].map(([a, b]) => (
                <li
                  key={a}
                  className="flex justify-between border-b border-hair py-1.5"
                >
                  {a} <span className="font-semibold">{b}</span>
                </li>
              ))}
            </ul>
          ) : current === 'payments' ? (
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span>Kurs narxi</span>
                <b>{formatMoney(900_000)}</b>
              </div>
              <div className="flex justify-between">
                <span>To‘langan</span>
                <b className="text-success">{formatMoney(680_000)}</b>
              </div>
              <div className="flex justify-between">
                <span>Qarzdorlik</span>
                <b className="text-destructive">{formatMoney(220_000)}</b>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-hair p-3">
              <p className="font-medium">Mock imtihon</p>
              <p className="text-muted-foreground">
                Shanba kuni soat 10:00 da IELTS mock imtihon.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md bg-muted px-3 py-2">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

/* ------------------------------ Panellar tablari ----------------------------- */

const ROLE_TABS = [
  {
    id: 'admin',
    label: 'Administrator',
    hint: 'Menejer va operator: lidlar, to‘lovlar, jadval.',
  },
  {
    id: 'teacher',
    label: 'O‘qituvchi',
    hint: 'O‘z guruhlari: davomat, topshiriq, baho.',
  },
  {
    id: 'student',
    label: 'O‘quvchi',
    hint: 'Shaxsiy kabinet: telefon va parol bilan kiradi.',
  },
] as const;

export function RolePanelsDemo({
  toggles,
  admin,
  teacher,
}: {
  toggles: LearnerToggles;
  admin: ReactNode;
  teacher: ReactNode;
}) {
  const [tab, setTab] = useState<(typeof ROLE_TABS)[number]['id']>('admin');
  const current = ROLE_TABS.find((r) => r.id === tab)!;
  return (
    <div>
      <div
        role="tablist"
        aria-label="Panellar"
        className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1"
      >
        {ROLE_TABS.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={tab === r.id}
            onClick={() => setTab(r.id)}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              tab === r.id
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{current.hint}</p>
      <div className="mt-6">
        {tab === 'admin' ? (
          <div className="grid gap-5 lg:grid-cols-3">
            <AdminTodayDemo />
            {admin}
          </div>
        ) : tab === 'teacher' ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {teacher}
            <TeacherWorkDemo />
          </div>
        ) : (
          <StudentPortalDemo toggles={toggles} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Ruxsatlar ---------------------------------- */

export function PermissionsDemo({
  toggles,
  onToggle,
}: {
  toggles: LearnerToggles;
  onToggle: (id: DemoLearnerSection, value: boolean) => void;
}) {
  const [matrix, setMatrix] = useState(() =>
    STAFF_ACTIONS.map((a) => [...a.defaults]),
  );
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Card
        heading="Xodimlar ruxsatlari"
        action={<Tag>Markaz egasi</Tag>}
        edgeToEdge
        className="overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-hair text-xs text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Amal</th>
                {STAFF_ROLES.map((r) => (
                  <th key={r} className="px-2 py-2 font-medium">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAFF_ACTIONS.map((action, ai) => (
                <tr
                  key={action.label}
                  className="border-b border-hair last:border-0"
                >
                  <td className="px-4 py-2.5">{action.label}</td>
                  {STAFF_ROLES.map((role, ri) => {
                    const on = matrix[ai][ri];
                    return (
                      <td key={role} className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={`${role}: ${action.label}`}
                          onClick={() =>
                            setMatrix((m) =>
                              m.map((row, i) =>
                                i === ai
                                  ? row.map((v, j) => (j === ri ? !v : v))
                                  : row,
                              ),
                            )
                          }
                          className={cn(
                            'inline-flex size-7 items-center justify-center rounded-md transition-colors',
                            on
                              ? 'bg-success/15 text-success'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {on ? (
                            <CheckCircle
                              aria-hidden
                              weight="fill"
                              className="size-4"
                            />
                          ) : (
                            <Lock aria-hidden className="size-3.5" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 pb-4 pt-2 text-xs text-muted-foreground">
          Katakchani bosing — ruxsat beriladi yoki olinadi. Haqiqiy tizimda har
          bir xodimga alohida ham sozlanadi.
        </p>
      </Card>

      <Card
        heading="O‘quvchi kabineti bo‘limlari"
        action={<Tag>Markaz egasi</Tag>}
      >
        <ul className="divide-y divide-hair">
          {DEMO_LEARNER_SECTIONS.map(({ id, label, icon: SectionIcon }) => (
            <li key={id}>
              <label className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <SectionIcon
                    aria-hidden
                    className="size-4 text-muted-foreground"
                  />{' '}
                  {label}
                </span>
                <Switch
                  aria-label={label}
                  checked={toggles[id]}
                  onCheckedChange={(v) => onToggle(id, v)}
                />
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          O‘chirilgan bo‘lim yuqoridagi “O‘quvchi” panelida darhol yo‘qoladi.
        </p>
      </Card>
    </div>
  );
}
