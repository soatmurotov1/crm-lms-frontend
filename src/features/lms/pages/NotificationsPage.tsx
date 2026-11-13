import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Bell, Checks, PaperPlaneTilt, Trash } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import PaginationControls from '@/components/ui/PaginationControls';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCan } from '@/hooks/useCan';
import { useAuthStore } from '@/store/authStore';
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import { cn } from '@/lib/utils';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/lms/api/lmsService';
import { SendNotificationDialog } from '@/features/lms/components/SendNotificationDialog';
import { ListLoading, formatDateTime } from '@/features/lms/components/LmsCommon';

const PAGE_SIZE = 20;

const NotificationsPage = () => {
  const { t } = useTranslation();
  const canSend = useCan('sendNotifications');
  const isAdmin = useAuthStore((state) =>
    ['dev', 'owner', 'manager'].includes(state.user?.role ?? ''),
  );
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [sendOpen, setSendOpen] = useState(false);
  const query = useNotifications({ unread: unreadOnly, page, limit: PAGE_SIZE });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const unread = query.data?.unread_count ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('lms.notifications.title')}
        description={t('lms.notifications.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              disabled={unread === 0 || markAll.isPending}
              onClick={() =>
                markAll.mutate(undefined, {
                  onSuccess: () => toast.success(t('lms.notifications.all_read')),
                  onError: (error) => mutationErrorToast(error, t),
                })
              }
            >
              <Checks className="h-4 w-4" aria-hidden="true" /> {t('lms.notifications.mark_all')}
            </Button>
            {canSend ? (
              <Button className="gap-2" onClick={() => setSendOpen(true)}>
                <PaperPlaneTilt className="h-4 w-4" aria-hidden="true" />
                {t('lms.notifications.send')}
              </Button>
            ) : null}
          </div>
        }
      />
      <Tabs
        value={unreadOnly ? 'unread' : 'all'}
        onValueChange={(value) => {
          setUnreadOnly(value === 'unread');
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">{t('lms.common.all')}</TabsTrigger>
          <TabsTrigger value="unread">
            {t('lms.notifications.unread')} {unread > 0 ? `(${unread})` : ''}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Card edgeToEdge className="overflow-hidden">
        {query.isLoading ? (
          <ListLoading />
        ) : query.isError ? (
          <EmptyState
            icon={Bell}
            title={t('lms.common.load_error')}
            action={{ label: t('common.retry'), onClick: () => void query.refetch() }}
          />
        ) : rows.length === 0 ? (
          <EmptyState icon={Bell} title={t('lms.notifications.empty_title')} />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li
                key={row.id}
                className={cn('flex gap-3 p-4', !row.read && 'bg-primary/5')}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
                    row.read ? 'bg-transparent' : 'bg-primary',
                  )}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{row.title}</p>
                    <Badge variant="outline">{t(`lms.notifications.type_${row.type}`, row.type)}</Badge>
                    {row.group_name ? (
                      <span className="text-xs text-muted-foreground">{row.group_name}</span>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{row.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.created_by_name ?? t('common.na')} · {formatDateTime(row.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  {!row.read ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={markRead.isPending}
                      onClick={() =>
                        markRead.mutate(row.id, {
                          onError: (error) => mutationErrorToast(error, t),
                        })
                      }
                    >
                      {t('lms.notifications.mark_read')}
                    </Button>
                  ) : null}
                  {row.is_mine || isAdmin ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('common.delete')}
                      disabled={remove.isPending}
                      onClick={() =>
                        remove.mutate(row.id, {
                          onSuccess: () => toast.success(t('lms.common.deleted')),
                          onError: (error) => mutationErrorToast(error, t),
                        })
                      }
                    >
                      <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {meta && meta.totalPages > 1 ? (
        <PaginationControls
          currentPage={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          onPageChange={setPage}
        />
      ) : null}
      {sendOpen ? <SendNotificationDialog onClose={() => setSendOpen(false)} /> : null}
    </div>
  );
};

export default NotificationsPage;
