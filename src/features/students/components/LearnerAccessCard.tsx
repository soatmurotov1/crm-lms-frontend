import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Key } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PasswordField } from '@/components/ui/password-field';
import { useUpsertLearnerAccount } from '@/features/students/api/studentService';

interface LearnerAccessCardProps {
  studentId: string;
  phone: string;
  hasAccount: boolean;
}

/** Xodim o'quvchiga kabinet parolini o'rnatadi (o'quvchi telefon + shu parol bilan kiradi). */
export function LearnerAccessCard({
  studentId,
  phone,
  hasAccount,
}: LearnerAccessCardProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(hasAccount);
  const valid = password.length >= 6 && /\d/.test(password);
  const upsert = useUpsertLearnerAccount(studentId);

  const submit = () =>
    upsert.mutate(password, {
      onSuccess: () => {
        toast.success(t('students_learner.saved'));
        setActive(true);
        setPassword('');
      },
      onError: (error: unknown) => {
        const message = (
          error as { response?: { data?: { error?: { message?: string } } } }
        )?.response?.data?.error?.message;
        toast.error(message ?? t('learner.errors.generic'));
      },
    });

  return (
    <Card
      className="mt-4"
      heading={
        <span className="flex items-center gap-2">
          <Key aria-hidden className="size-4" /> {t('students_learner.title')}
        </span>
      }
      description={t('students_learner.desc', { phone })}
      action={
        <span
          className={
            active
              ? 'rounded-md bg-success/15 px-2 py-0.5 text-xs font-medium text-success'
              : 'rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
          }
        >
          {active ? t('students_learner.has') : t('students_learner.none')}
        </span>
      }
    >
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) submit();
        }}
      >
        <div className="min-w-56 flex-1 space-y-1.5">
          <label htmlFor="learner-password" className="text-sm font-medium">
            {t('students_learner.password')}
          </label>
          <PasswordField
            id="learner-password"
            value={password}
            autoComplete="new-password"
            showLabel={t('common.show_password')}
            hideLabel={t('common.hide_password')}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {t('students_learner.min')}
          </p>
        </div>
        <Button
          type="submit"
          disabled={!valid || upsert.isPending}
          className="mb-5"
        >
          {active ? t('students_learner.update') : t('students_learner.set')}
        </Button>
      </form>
    </Card>
  );
}
