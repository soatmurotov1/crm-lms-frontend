import { useEffect } from 'react';
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck,
  ChartBar,
  ClipboardText,
  Exam,
  House,
  SignOut,
  User,
  Wallet,
  type Icon,
} from '@phosphor-icons/react';
import { BrandMark } from '@/components/layout/BrandMark';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  fetchLearnerMe,
  learnerKeys,
  learnerLogoutRequest,
} from '@/features/learner/api/learnerApi';
import { useLearnerStore } from '@/features/learner/api/learnerStore';
import type { LearnerSection } from '@/features/learner/types';

type LearnerPath =
  | '/learner'
  | '/learner/schedule'
  | '/learner/courses'
  | '/learner/assignments'
  | '/learner/quizzes'
  | '/learner/grades'
  | '/learner/attendance'
  | '/learner/payments'
  | '/learner/notifications'
  | '/learner/profile';

const NAV: {
  to: LearnerPath;
  key: string;
  icon: Icon;
  section?: LearnerSection;
}[] = [
  { to: '/learner', key: 'dashboard', icon: House },
  {
    to: '/learner/schedule',
    key: 'schedule',
    icon: Calendar,
    section: 'schedule',
  },
  {
    to: '/learner/courses',
    key: 'courses',
    icon: BookOpen,
    section: 'courses',
  },
  {
    to: '/learner/assignments',
    key: 'assignments',
    icon: ClipboardText,
    section: 'assignments',
  },
  { to: '/learner/quizzes', key: 'quizzes', icon: Exam, section: 'quizzes' },
  { to: '/learner/grades', key: 'grades', icon: ChartBar, section: 'grades' },
  {
    to: '/learner/attendance',
    key: 'attendance',
    icon: CalendarCheck,
    section: 'attendance',
  },
  {
    to: '/learner/payments',
    key: 'payments',
    icon: Wallet,
    section: 'payments',
  },
  {
    to: '/learner/notifications',
    key: 'notifications',
    icon: Bell,
    section: 'notifications',
  },
  { to: '/learner/profile', key: 'profile', icon: User },
];

export function LearnerLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, setProfile, logout, isAuthenticated } = useLearnerStore();

  // Sahifa yangilanganda sessiya `learner_session` cookie orqali tiklanadi.
  const me = useQuery({
    queryKey: learnerKeys.me,
    queryFn: fetchLearnerMe,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (me.data) setProfile(me.data);
  }, [me.data, setProfile]);

  useEffect(() => {
    const status = (me.error as { response?: { status?: number } } | null)
      ?.response?.status;
    if (status === 401 || status === 403) logout();
  }, [me.error, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({
        to: '/login',
        search: { as: 'student' } as never,
        replace: true,
      });
    }
  }, [isAuthenticated, navigate]);

  const onLogout = async () => {
    await learnerLogoutRequest();
    logout();
    qc.removeQueries({ queryKey: learnerKeys.all });
  };

  const items = NAV.filter(
    (item) => !item.section || profile?.portal?.[item.section] !== false,
  );
  const isActive = (to: string) =>
    to === '/learner'
      ? pathname === '/learner' || pathname === '/learner/'
      : pathname.startsWith(to);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-hair bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size="sm" title="EduLMS" />
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">
              {t('learner.portal')}
              {profile?.organization_name
                ? ` · ${profile.organization_name}`
                : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher collapsed />
            <ThemeToggle collapsed />
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('learner.logout')}
              onClick={() => void onLogout()}
            >
              <SignOut aria-hidden />
              <span className="hidden sm:inline">{t('learner.logout')}</span>
            </Button>
          </div>
        </div>
        <nav
          aria-label={t('learner.portal')}
          className="border-t border-hair lg:hidden"
        >
          <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2">
            {items.map(({ to, key, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm',
                    isActive(to)
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                  {t(`learner.nav.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20">
            {profile ? (
              <div className="mb-4 px-3">
                <p className="truncate font-semibold">{profile.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.phone}
                </p>
              </div>
            ) : null}
            <nav aria-label={t('learner.portal')}>
              <ul className="space-y-0.5">
                {items.map(({ to, key, icon: Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                        isActive(to)
                          ? 'bg-muted font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon aria-hidden className="size-4" />
                      {t(`learner.nav.${key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
