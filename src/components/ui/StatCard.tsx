import { isValidElement, type ReactNode } from 'react';
import { Card, type CardProps } from './card';
import { Skeleton } from './skeleton';
import { ArrowDownRight, ArrowUpRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface StatCardProps extends Omit<CardProps, 'title'> {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  icon?: ReactNode;
  tone?: 'primary' | 'warning' | 'success' | 'info';
  secondary?: ReactNode;
  meta?: ReactNode;
  delta?: ReactNode | { pct: number; down: boolean };
  isLoading?: boolean;
}

/** A single KPI; groups belong in a grid outside the surface. */
export function StatCard({
  label,
  value,
  unit,
  icon,
  meta,
  secondary,
  delta,
  tone,
  isLoading,
  className,
  onClick,
  onKeyDown,
  children,
  ...props
}: StatCardProps) {
  const change =
    delta &&
    typeof delta === 'object' &&
    !isValidElement(delta) &&
    'pct' in delta ? (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold tabular-nums',
          delta.down ? 'text-destructive' : 'text-success',
        )}
      >
        {delta.down ? (
          <ArrowDownRight className="h-3 w-3" />
        ) : (
          <ArrowUpRight className="h-3 w-3" />
        )}
        {delta.down ? '' : '+'}
        {delta.pct}%
      </span>
    ) : (
      (delta as ReactNode)
    );
  return (
    <Card
      {...props}
      className={cn(
        'relative overflow-hidden',
        onClick &&
          'cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      role={onClick ? 'button' : props.role}
      tabIndex={onClick ? 0 : props.tabIndex}
      onClick={onClick}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !event.defaultPrevented &&
          event.target === event.currentTarget &&
          onClick &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words text-xs leading-relaxed text-muted-foreground">
          {label}
        </p>
        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted/40 [&_svg]:h-4 [&_svg]:w-4',
              tone === 'warning'
                ? 'bg-warning/10 text-warning'
                : tone === 'success'
                  ? 'bg-success/10 text-success'
                  : tone === 'info'
                    ? 'bg-info/10 text-info'
                    : 'text-muted-foreground',
            )}
          >
            {icon}
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className="mt-2 break-words text-2xl font-bold leading-tight tabular-nums">
          {value}
          {unit && (
            <span className="ml-1 text-sm font-medium text-muted-foreground">
              {unit}
            </span>
          )}
        </p>
      )}
      {(meta || change || secondary) && (
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          {meta && <span>{meta}</span>}
          {change ?? secondary}
        </div>
      )}
      {children}
    </Card>
  );
}
