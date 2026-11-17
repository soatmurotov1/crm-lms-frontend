import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowRight,
  GearSix,
  GraduationCap,
  ShieldCheck,
  UsersThree,
} from '@phosphor-icons/react';
import axiosInstance from '@/api/axiosInstance';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/authStore';
import {
  LEARNER_SECTIONS,
  type LearnerPortalSettings,
} from '@/features/learner/types';

const KEY = ['settings', 'learner-portal'] as const;

const ROLES = [
  'owner',
  'manager',
  'operator',
  'accountant',
  'teacher',
  'student',
] as const;

export default function SettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === 'owner' || role === 'dev';

  const portal = useQuery({
    queryKey: KEY,
    queryFn: async () =>
      (
        await axiosInstance.get<{ data: LearnerPortalSettings }>(
          '/settings/learner-portal',
        )
      ).data.data,
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<LearnerPortalSettings>) =>
      (
        await axiosInstance.patch<{ data: LearnerPortalSettings }>(
          '/settings/learner-portal',
          patch,
        )
      ).data.data,
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<LearnerPortalSettings>(KEY);
      if (prev) qc.setQueryData(KEY, { ...prev, ...patch });
      return { prev };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
      toast.error(t('learner.errors.generic'));
    },
    onSuccess: (data) => {
      qc.setQueryData(KEY, data);
      toast.success(t('settings.saved'));
    },
  });

  const s = portal.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav_sections.system')}
        icon={<GearSix aria-hidden />}
        title={t('settings.title')}
        description={t('settings.subtitle')}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card heading={t('settings.roles_title')}>
          <ul className="space-y-2.5 text-sm">
            {ROLES.map((r) => {
              const [name, rest] = t(`settings.roles.${r}`).split(' — ');
              return (
                <li key={r} className="flex gap-3">
                  <span className="w-28 shrink-0 font-medium">{name}</span>
                  <span className="text-muted-foreground">{rest}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card heading={t('settings.staff_title')}>
          <div className="flex h-full flex-col gap-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('settings.staff_desc')}
            </p>
            <div className="mt-auto flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/permission-templates">
                  <ShieldCheck aria-hidden /> {t('settings.open_templates')}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/users">
                  <UsersThree aria-hidden /> {t('settings.open_users')}{' '}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card
        heading={
          <span className="flex items-center gap-2">
            <GraduationCap aria-hidden className="size-5 text-primary" />
            {t('settings.learner_title')}
          </span>
        }
        description={t('settings.learner_desc')}
      >
        {!canEdit ? (
          <p className="mb-3 text-xs text-muted-foreground">
            {t('settings.owner_only')}
          </p>
        ) : null}
        {s ? (
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-lg bg-muted px-4 py-3">
              <span>
                <span className="block font-medium">
                  {t('settings.enabled')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('settings.enabled_desc')}
                </span>
              </span>
              <Switch
                aria-label={t('settings.enabled')}
                checked={s.enabled}
                disabled={!canEdit}
                onCheckedChange={(enabled) => update.mutate({ enabled })}
              />
            </label>
            <div className="grid gap-x-8 sm:grid-cols-2">
              {LEARNER_SECTIONS.map((section) => (
                <label
                  key={section}
                  className="flex items-center justify-between gap-4 border-b border-hair py-3"
                >
                  <span className={s.enabled ? '' : 'text-muted-foreground'}>
                    {t(`settings.sections.${section}`)}
                  </span>
                  <Switch
                    aria-label={t(`settings.sections.${section}`)}
                    checked={s[section]}
                    disabled={!canEdit || !s.enabled}
                    onCheckedChange={(value) =>
                      update.mutate({ [section]: value })
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {portal.isLoading ? '…' : t('learner.errors.generic')}
          </p>
        )}
      </Card>
    </div>
  );
}
