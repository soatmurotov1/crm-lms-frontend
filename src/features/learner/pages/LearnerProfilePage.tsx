import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PasswordField } from '@/components/ui/password-field';
import { useLearnerChangePassword } from '@/features/learner/api/learnerApi';
import { useLearnerStore } from '@/features/learner/api/learnerStore';
import {
  LearnerPageHeader,
  errorMessage,
} from '@/features/learner/components/LearnerUi';

export default function LearnerProfilePage() {
  const { t } = useTranslation();
  const profile = useLearnerStore((s) => s.profile);
  const change = useLearnerChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');

  const rows: [string, string | null | undefined][] = [
    [t('learner.profile.phone'), profile?.phone],
    [t('learner.profile.branch'), profile?.branch_name],
    [t('learner.profile.center'), profile?.organization_name],
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <LearnerPageHeader
        title={profile?.full_name ?? t('learner.profile.title')}
        subtitle={t('learner.profile.title')}
      />
      <Card>
        <dl className="divide-y divide-hair">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-4 py-2.5 text-sm"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card heading={t('learner.profile.change_password')}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            change.mutate(
              { currentPassword: current, newPassword: next },
              {
                onSuccess: () => {
                  toast.success(t('learner.profile.saved'));
                  setCurrent('');
                  setNext('');
                },
                onError: (err) =>
                  toast.error(errorMessage(err, t('learner.errors.generic'))),
              },
            );
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="lp-current" className="text-sm font-medium">
              {t('learner.profile.current')}
            </label>
            <PasswordField
              showLabel={t('common.show_password')}
              hideLabel={t('common.hide_password')}
              id="lp-current"
              value={current}
              autoComplete="current-password"
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lp-new" className="text-sm font-medium">
              {t('learner.profile.new')}
            </label>
            <PasswordField
              showLabel={t('common.show_password')}
              hideLabel={t('common.hide_password')}
              id="lp-new"
              value={next}
              autoComplete="new-password"
              onChange={(e) => setNext(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('learner.profile.new_hint')}
            </p>
          </div>
          <Button
            type="submit"
            disabled={change.isPending || !current || next.length < 6}
          >
            {t('learner.profile.save')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
