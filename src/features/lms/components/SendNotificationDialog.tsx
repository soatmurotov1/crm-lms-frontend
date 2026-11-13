import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import { useAuthStore } from '@/store/authStore';
import { useGroups } from '@/features/groups/api/groupService';
import { useSendNotification } from '@/features/lms/api/lmsService';
import type { NotificationAudience, NotificationType } from '@/features/lms/types';
import { FormField } from './LmsCommon';

const TYPES: NotificationType[] = ['info', 'lesson', 'homework', 'warning', 'payment', 'system'];

export const SendNotificationDialog = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const isTeacher = useAuthStore((state) => state.user?.role === 'teacher');
  const send = useSendNotification();
  const { data: groups = [] } = useGroups();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const [audience, setAudience] = useState<NotificationAudience>(isTeacher ? 'group' : 'all');
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const audiences: NotificationAudience[] = isTeacher
    ? ['group']
    : ['all', 'teachers', 'students', 'group'];

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !message.trim()) return setError(t('lms.notifications.required'));
    if (audience === 'group' && !groupId) return setError(t('lms.notifications.group_required'));
    setError(null);
    send.mutate(
      {
        title: title.trim(),
        message: message.trim(),
        type,
        audience,
        group_id: audience === 'group' ? groupId : undefined,
      },
      {
        onSuccess: () => {
          toast.success(t('lms.notifications.sent'));
          onClose();
        },
        onError: (err) => mutationErrorToast(err, t),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !send.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('lms.notifications.send')}</DialogTitle>
          <DialogDescription>{t('lms.notifications.send_desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="notification-audience" label={t('lms.notifications.audience')}>
              <Select
                value={audience}
                onValueChange={(value) => setAudience(value as NotificationAudience)}
              >
                <SelectTrigger id="notification-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audiences.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`lms.notifications.audience_${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="notification-type" label={t('lms.notifications.type')}>
              <Select value={type} onValueChange={(value) => setType(value as NotificationType)}>
                <SelectTrigger id="notification-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`lms.notifications.type_${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          {audience === 'group' ? (
            <FormField id="notification-group" label={t('lms.common.group')} required>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id="notification-group">
                  <SelectValue placeholder={t('common.select_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}
          <FormField id="notification-title" label={t('lms.common.title')} required>
            <Input
              id="notification-title"
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
            />
          </FormField>
          <FormField id="notification-message" label={t('lms.notifications.message')} required>
            <Textarea
              id="notification-message"
              rows={4}
              maxLength={5000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </FormField>
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={send.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={send.isPending}>
              {send.isPending ? t('common.saving') : t('lms.notifications.send')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
