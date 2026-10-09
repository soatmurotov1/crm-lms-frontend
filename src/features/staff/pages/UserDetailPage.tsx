import { Card } from '@/components/ui/card';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Warning, ShieldCheck } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { EntityDetailShell } from '@/components/ui/EntityDetailShell';
import { DataCard } from '@/components/ui/DataCard';
import { useUser } from '@/features/staff/api/userService';
import { useUrlTab } from '@/hooks/useUrlTab';
import { useCanManageStaffAccess } from '@/hooks/useCan';
import UserAccessPanel from '@/features/staff/components/UserAccessPanel';

// Which list page a given role's users are managed from — used for the back
// link and the row-click origin, since one UserDetailPage serves all three.
const backTargetByRole: Record<
  string,
  { path: '/teachers' | '/operators' | '/users'; labelKey: string }
> = {
  teacher: { path: '/teachers', labelKey: 'teachers.title' },
  operator: { path: '/operators', labelKey: 'operators.title' },
};

const UserDetailPage = () => {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const canManageAccess = useCanManageStaffAccess();
  const [tab, setTab] = useUrlTab(
    ['info', 'groups', 'students', 'access'] as const,
    'info',
  );

  const { data: user, isLoading, isError } = useUser(id);

  const backTarget = user
    ? (backTargetByRole[user.role] ?? {
        path: '/users',
        labelKey: 'users.title',
      })
    : { path: '/users', labelKey: 'users.title' };

  if (isLoading || isError || !user) {
    return (
      <EntityDetailShell
        onBack={() => navigate({ to: backTarget.path })}
        backLabel={t(backTarget.labelKey)}
        isLoading={isLoading}
        isError={isError || !user}
        errorTitle={isError ? t('common.error') : t('common.not_found')}
        errorIcon={isError ? Warning : ShieldCheck}
      />
    );
  }

  const visibleTab =
    tab === 'access' && !canManageAccess
      ? 'info'
      : tab === 'groups' && user.role !== 'teacher'
        ? 'info'
        : tab === 'students' && user.role !== 'operator'
          ? 'info'
          : tab;

  return (
    <EntityDetailShell
      onBack={() => navigate({ to: backTarget.path })}
      backLabel={t(backTarget.labelKey)}
      isLoading={false}
      isError={false}
      title={user.name || user.email}
      description={
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{user.phone || t('common.na')}</span>
          <span>·</span>
          <span>{user.branch_name ?? t('common.na')}</span>
        </div>
      }
      meta={
        <Badge variant={user.is_active !== false ? 'secondary' : 'destructive'}>
          {user.is_active !== false ? t('common.active') : t('common.inactive')}
        </Badge>
      }
    >
      <Tabs value={visibleTab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="info">{t('common.tab_info')}</TabsTrigger>
          {canManageAccess && (
            <TabsTrigger value="access">{t('access.title')}</TabsTrigger>
          )}
          {user.role === 'teacher' && (
            <TabsTrigger value="groups">{t('groups.title')}</TabsTrigger>
          )}
          {user.role === 'operator' && (
            <TabsTrigger value="students">
              {t('users.detail.tab_registered_students')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="info">
          <Card asChild>
            <dl className=" grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Field
                label={t('users.name_label')}
                value={user.name || t('common.na')}
              />
              <Field label={t('common.email')} value={user.email} />
              <Field
                label={t('users.detail.phone')}
                value={user.phone || t('common.na')}
              />
              <Field
                label={t('users.detail.role')}
                value={t(`roles.${user.role}`, { defaultValue: user.role })}
              />
              <Field
                label={t('users.detail.branch')}
                value={user.branch_name ?? t('common.na')}
              />
              <Field
                label={t('users.detail.referred_students_count')}
                value={String(user.referred_students_count ?? 0)}
                referredByUserId={user.id}
              />
            </dl>
          </Card>
        </TabsContent>

        {canManageAccess && (
          <TabsContent value="access">
            <UserAccessPanel key={user.id} user={user} />
          </TabsContent>
        )}

        {user.role === 'teacher' && (
          <TabsContent value="groups">
            {(user.groups ?? []).length === 0 ? (
              <EmptyState title={t('groups.not_found')} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(user.groups ?? []).map((g) => (
                  <DataCard
                    key={g.id}
                    title={g.name}
                    onClick={() =>
                      navigate({
                        to: '/groups/$id',
                        params: { id: g.id },
                      })
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {user.role === 'operator' && (
          <TabsContent value="students">
            {(user.registered_students ?? []).length === 0 ? (
              <EmptyState title={t('students.not_found')} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(user.registered_students ?? []).map((s) => (
                  <DataCard
                    key={s.id}
                    title={s.name}
                    onClick={() =>
                      navigate({
                        to: '/students/$id',
                        params: { id: s.id },
                      })
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </EntityDetailShell>
  );
};

const Field = ({
  label,
  value,
  referredByUserId,
}: {
  label: string;
  value: React.ReactNode;
  referredByUserId?: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
      {label}
    </dt>
    <dd>
      {referredByUserId ? (
        <Link
          to="/students"
          search={{ referred_by_user_id: referredByUserId }}
          className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {value}
        </Link>
      ) : (
        value
      )}
    </dd>
  </div>
);

export default UserDetailPage;
