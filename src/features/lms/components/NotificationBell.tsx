import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Bell } from '@phosphor-icons/react';
import { useUnreadNotifications } from '@/features/lms/api/lmsService';

/** Topbar'dagi bildirishnomalar tugmasi (o'qilmaganlar soni bilan). */
export const NotificationBell = () => {
  const { t } = useTranslation();
  const { data: unread = 0 } = useUnreadNotifications();
  const label =
    unread > 0
      ? t('lms.notifications.bell_unread', { count: unread })
      : t('lms.notifications.title');

  return (
    <Link
      to="/notifications"
      aria-label={label}
      title={label}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unread > 0 ? (
        <span className="absolute right-1.5 top-1.5 min-w-[1.125rem] rounded-full bg-destructive px-1 text-center text-[10px] font-semibold leading-[1.125rem] text-destructive-foreground">
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </Link>
  );
};
