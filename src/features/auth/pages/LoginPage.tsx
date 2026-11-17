import { Card } from '@/components/ui/card';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useRouter } from '@tanstack/react-router';
import { CircleNotch, Moon, Sun } from '@phosphor-icons/react';
import { useLogin } from '@/features/auth/api/authService';
import { queryClient, resetAuthSessionState } from '@/lib/queryClient';
import { preconnectApi } from '@/lib/preconnectApi';
import { ensureI18n } from '@/i18n/ensure';
import { BrandMark } from '@/components/layout/BrandMark';
import { useTheme } from '@/hooks/useTheme';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from '@/components/ui/password-field';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse } from '@/features/staff/types';
import { getDefaultAuthenticatedRoute } from '@/lib/defaultAuthenticatedRoute';
import { getLoginCopy, readLoginLang } from '@/features/auth/lib/loginCopy';
import { learnerLogin } from '@/features/learner/api/learnerApi';
import { useLearnerStore } from '@/features/learner/api/learnerStore';
import { cn } from '@/lib/utils';

type LoginMode = 'staff' | 'student';

const initialMode = (): LoginMode =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('as') === 'student'
    ? 'student'
    : 'staff';

type FieldErrors = {
  email?: string;
  password?: string;
};

const errorResponse = (error: unknown) =>
  (error as { response?: { status?: number } } | null)?.response;

const notify = (kind: 'success' | 'error', message: string) => {
  void import('sonner')
    .then(({ toast }) => toast[kind](message))
    .catch(() => undefined);
};

// Bosh sahifadagi "Demoni ochish" → /login?demo=1. Demo hisob .env orqali
// berilgan bo'lsa, maydonlar oldindan to'ldiriladi.
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? '';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? '';
const isDemoRequest = () =>
  Boolean(DEMO_EMAIL) &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('demo') === '1';

const LoginPage = () => {
  const lang = useMemo(() => readLoginLang(), []);
  const copy = useMemo(() => getLoginCopy(lang), [lang]);
  const { theme, toggle } = useTheme();
  const demo = useMemo(() => isDemoRequest(), []);
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [studentPending, setStudentPending] = useState(false);
  const setLearnerSession = useLearnerStore((s) => s.setSession);
  const isStudent = mode === 'student';
  const [email, setEmail] = useState(demo ? DEMO_EMAIL : '');
  const [password, setPassword] = useState(demo ? DEMO_PASSWORD : '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const location = useLocation();
  const login = useLogin();
  const busy = login.isPending || studentPending;
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasCleanedInitialSession = useRef(false);
  const hasPreconnected = useRef(false);
  const emailId = 'login-email';
  const passwordId = 'login-password';

  const warmApiConnection = useCallback(() => {
    if (hasPreconnected.current) return;
    hasPreconnected.current = true;
    preconnectApi();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    // Always start a direct /login visit from a clean auth state so stale
    // persisted sessions cannot bounce the user away from the form.
    if (hasCleanedInitialSession.current) return;
    hasCleanedInitialSession.current = true;

    const hasCachedQueries = queryClient.getQueryCache().getAll().length > 0;
    if (isAuthenticated || hasCachedQueries) {
      logout();
      resetAuthSessionState(queryClient);
    }
  }, [isAuthenticated, logout]);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Kirish | EduLMS';
    return () => {
      document.title = prev;
    };
  }, []);

  const handleError = useCallback(
    (error: unknown) => {
      const response = errorResponse(error);
      if (response?.status === 429) {
        notify('error', copy.rateLimit);
      } else if (response?.status === 403) {
        notify('error', copy.companyInactive);
      } else if (!response) {
        notify('error', copy.networkError);
      } else {
        setFormError(copy.error);
      }
    },
    [copy],
  );

  const onSuccess = useCallback(
    (data: AuthResponse) => {
      notify('success', copy.success);
      const from =
        'from' in location.state && typeof location.state.from === 'string'
          ? location.state.from
          : undefined;
      const target =
        data.user.role !== 'accountant' && from && from !== '/login'
          ? from
          : getDefaultAuthenticatedRoute(data.user);
      void ensureI18n()
        .catch(() => undefined)
        .then(() => {
          void router.navigate({ href: target, replace: true });
        });
    },
    [copy.success, location.state, router],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (email.length === 0) nextErrors.email = copy.required;
    if (password.length === 0) nextErrors.password = copy.required;
    setFieldErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    warmApiConnection();
    if (isStudent) {
      setStudentPending(true);
      learnerLogin(email.trim(), password.trim())
        .then(async ({ token, user }) => {
          setLearnerSession(token, user);
          notify('success', copy.success);
          await ensureI18n().catch(() => undefined);
          await router.navigate({ href: '/learner', replace: true });
        })
        .catch((error: unknown) => {
          const response = errorResponse(error);
          if (response?.status === 429) notify('error', copy.rateLimit);
          else if (response?.status === 403) setFormError(copy.studentClosed);
          else if (!response) notify('error', copy.networkError);
          else setFormError(copy.studentError);
        })
        .finally(() => setStudentPending(false));
      return;
    }
    login.mutate(
      { email, password: password.trim() },
      { onSuccess, onError: handleError },
    );
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background px-5 py-6 sm:px-10 sm:py-8 lg:px-14">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-b border-hair pb-5">
        <BrandMark size="sm" title={copy.appTitle} />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={theme === 'dark' ? copy.themeLight : copy.themeDark}
          className="size-12 shrink-0 focus-visible:ring-foreground"
        >
          {theme === 'dark' ? (
            <Sun aria-hidden="true" />
          ) : (
            <Moon aria-hidden="true" />
          )}
        </Button>
      </header>

      <main
        aria-labelledby="login-title"
        className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 py-8 sm:py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20"
      >
        <section
          className="hidden min-w-0 lg:block"
          aria-labelledby="login-workspace-title"
        >
          <p className="mb-6 text-sm font-medium text-muted-foreground">
            {copy.workspaceLabel}
          </p>
          <h2
            id="login-workspace-title"
            className="max-w-md text-4xl font-semibold leading-tight tracking-tight"
          >
            {copy.workspaceTitle}
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
            {copy.workspaceDescription}
          </p>
        </section>

        <Card className="mx-auto w-full max-w-md ">
          <div
            role="tablist"
            aria-label={copy.title}
            className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
          >
            {(['staff', 'student'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => {
                  setMode(value);
                  setEmail('');
                  setPassword('');
                  setFormError(null);
                  setFieldErrors({});
                }}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  mode === value
                    ? 'bg-background text-foreground shadow-none'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {value === 'staff' ? copy.tabStaff : copy.tabStudent}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h1
              id="login-title"
              className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl"
            >
              {copy.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {isStudent ? copy.studentDescription : copy.formDescription}
            </p>
          </div>

          {demo ? (
            <Alert className="mb-5 border-border px-3.5 py-3 text-sm leading-relaxed">
              Demo hisob: <b>{DEMO_EMAIL}</b> / <b>{DEMO_PASSWORD}</b> — namuna
              o‘quv markazi. "{copy.submit}" tugmasini bosing.
            </Alert>
          ) : null}

          <span role="status" aria-live="polite" className="sr-only">
            {busy ? copy.submitting : ''}
          </span>

          <form
            onSubmit={onSubmit}
            onFocus={warmApiConnection}
            className="space-y-5"
            aria-busy={busy}
          >
            <div className="space-y-2">
              <label
                htmlFor={emailId}
                className={
                  fieldErrors.email
                    ? 'text-sm font-medium leading-none text-destructive'
                    : 'text-sm font-medium leading-none'
                }
              >
                {isStudent ? copy.phoneLabel : copy.emailLabel}
              </label>
              <Input
                id={emailId}
                value={email}
                type={isStudent ? 'tel' : 'email'}
                autoComplete={isStudent ? 'tel' : 'email'}
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={
                  fieldErrors.email ? `${emailId}-error` : undefined
                }
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFormError(null);
                  setFieldErrors((current) =>
                    current.email ? { ...current, email: undefined } : current,
                  );
                }}
                placeholder={
                  isStudent ? copy.phonePlaceholder : copy.emailPlaceholder
                }
                className="h-12 border-muted-foreground bg-background/50 px-3.5 focus-visible:ring-foreground md:text-base"
              />
              {fieldErrors.email ? (
                <p
                  id={`${emailId}-error`}
                  className="text-sm font-medium text-destructive"
                >
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 [&_button]:h-12 [&_button]:w-12 [&_button]:rounded-md [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-foreground">
              <label
                htmlFor={passwordId}
                className={
                  fieldErrors.password
                    ? 'text-sm font-medium leading-none text-destructive'
                    : 'text-sm font-medium leading-none'
                }
              >
                {copy.passwordLabel}
              </label>
              <PasswordField
                id={passwordId}
                value={password}
                autoComplete="current-password"
                showLabel={copy.showPassword}
                hideLabel={copy.hidePassword}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={
                  fieldErrors.password ? `${passwordId}-error` : undefined
                }
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFormError(null);
                  setFieldErrors((current) =>
                    current.password
                      ? { ...current, password: undefined }
                      : current,
                  );
                }}
                placeholder={copy.passwordPlaceholder}
                className="h-12 border-muted-foreground bg-background/50 pl-3.5 pr-12 focus-visible:ring-foreground md:text-base"
              />
              {fieldErrors.password ? (
                <p
                  id={`${passwordId}-error`}
                  className="text-sm font-medium text-destructive"
                >
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>
            {formError && (
              <Alert
                variant="destructive"
                className="border-border bg-destructive/5 px-3.5 py-3 text-sm leading-relaxed dark:border-border"
              >
                {formError}
              </Alert>
            )}
            <Button
              type="submit"
              className="h-12 w-full text-base font-semibold focus-visible:ring-foreground"
              disabled={busy}
            >
              {busy ? (
                <CircleNotch
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : null}
              {busy ? copy.submitting : copy.submit}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default LoginPage;
