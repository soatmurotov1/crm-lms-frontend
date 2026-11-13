import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCourses } from '@/features/courses/api/courseService';
import { useGroups } from '@/features/groups/api/groupService';

export const NONE = '__none__';

export const ListLoading = ({ rows = 3 }: { rows?: number }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 p-4" role="status" aria-busy="true">
      <span className="sr-only">{t('common.loading')}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
};

const STATUS_TONE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-success/15 text-success',
  closed: 'bg-secondary text-secondary-foreground',
  submitted: 'bg-primary/15 text-primary',
  graded: 'bg-success/15 text-success',
  returned: 'bg-warning/15 text-warning',
  missing: 'bg-muted text-muted-foreground',
  needs_review: 'bg-warning/15 text-warning',
  not_started: 'bg-muted text-muted-foreground',
};

export const LmsStatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  return (
    <Badge
      variant="outline"
      className={cn('border-transparent font-medium', STATUS_TONE[status])}
    >
      {t(`lms.status.${status}`, status)}
    </Badge>
  );
};

export const PercentBar = ({
  value,
  className,
}: {
  value: number | null | undefined;
  className?: string;
}) => {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width]',
            pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-primary' : 'bg-warning',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
        {value === null || value === undefined ? '—' : `${Math.round(pct)}%`}
      </span>
    </div>
  );
};

export const FormField = ({
  id,
  label,
  required,
  children,
  hint,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} required={required}>
      {label}
    </Label>
    {children}
    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);

interface ScopeSelectProps {
  courseId: string;
  groupId: string;
  onCourseChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  disabled?: boolean;
  /** Filtr rejimida "Barchasi" variantini ko'rsatadi. */
  allowAll?: boolean;
  idPrefix: string;
}

/** Kurs va guruh tanlovi; guruh tanlansa — o'sha kursdagi guruhlar. */
export const CourseGroupSelects = ({
  courseId,
  groupId,
  onCourseChange,
  onGroupChange,
  disabled,
  allowAll,
  idPrefix,
}: ScopeSelectProps) => {
  const { t } = useTranslation();
  const { data: courses = [] } = useCourses();
  const { data: groups = [] } = useGroups();
  const visibleGroups = courseId
    ? groups.filter((group) => !group.course_id || group.course_id === courseId)
    : groups;
  const emptyLabel = allowAll ? t('lms.common.all') : t('lms.common.not_selected');

  return (
    <>
      <Select
        value={courseId || NONE}
        disabled={disabled}
        onValueChange={(value) => onCourseChange(value === NONE ? '' : value)}
      >
        <SelectTrigger id={`${idPrefix}-course`} aria-label={t('lms.common.course')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>
            {allowAll ? `${t('lms.common.course')}: ${emptyLabel}` : emptyLabel}
          </SelectItem>
          {courses.map((course) => (
            <SelectItem key={course.id} value={course.id}>
              {course.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={groupId || NONE}
        disabled={disabled}
        onValueChange={(value) => onGroupChange(value === NONE ? '' : value)}
      >
        <SelectTrigger id={`${idPrefix}-group`} aria-label={t('lms.common.group')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>
            {allowAll ? `${t('lms.common.group')}: ${emptyLabel}` : emptyLabel}
          </SelectItem>
          {visibleGroups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** `datetime-local` qiymati ↔ ISO. */
export const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const fromLocalInput = (value: string) =>
  value ? new Date(value).toISOString() : null;
