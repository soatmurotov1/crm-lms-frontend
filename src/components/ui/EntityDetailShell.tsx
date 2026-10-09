import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';

interface EntityDetailShellProps {
  onBack: () => void;
  backLabel: string;
  backHref?: string;
  isLoading: boolean;
  isError: boolean;
  errorTitle?: string;
  errorDescription?: string;
  errorIcon?: PhosphorIcon;
  onRetry?: () => void;
  retryLabel?: string;
  header?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

// Legacy header JSX remains untouched; structured slots use the PageHeader
// markup and classes without requiring changes to its string-only API.
export const EntityDetailShell = ({
  onBack,
  backLabel,
  backHref,
  isLoading,
  isError,
  errorTitle,
  errorDescription,
  errorIcon,
  onRetry,
  retryLabel,
  header,
  title,
  description,
  meta,
  actions,
  children,
}: EntityDetailShellProps) => {
  const { t } = useTranslation();
  const hasStructuredHeader = [title, description, meta, actions].some(
    (slot) => slot !== undefined && slot !== null,
  );

  return (
    <div className="space-y-4">
      <BackButton onClick={onBack} label={backLabel} href={backHref} />
      {isLoading ? (
        <div className="space-y-4" role="status" aria-busy="true">
          <span className="sr-only">{t('common.loading')}</span>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
        <EmptyState
          role="alert"
          icon={errorIcon}
          title={errorTitle ?? ''}
          description={errorDescription}
          action={
            onRetry ? (
              <Button variant="outline" onClick={onRetry}>
                {retryLabel}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {hasStructuredHeader ? (
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-hair pb-4">
              <div className="min-w-0 flex-[1_1_16rem]">
                {title != null && (
                  <h1 className="break-words font-heading text-2xl font-semibold leading-tight tracking-[-0.02em] text-balance sm:text-3xl">
                    {title}
                  </h1>
                )}
                {description != null && (
                  <div className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </div>
                )}
                {meta != null && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {meta}
                  </div>
                )}
              </div>
              {actions != null && (
                <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end [&>div]:max-w-full [&>div]:flex-wrap [&>button]:h-auto [&>button]:min-h-10 [&>button]:max-w-full [&>button]:whitespace-normal [&>a]:h-auto [&>a]:min-h-10 [&>a]:max-w-full [&>a]:whitespace-normal [&>div>button:not([aria-haspopup]):not([aria-label])]:h-auto [&>div>button:not([aria-haspopup]):not([aria-label])]:min-h-10 [&>div>button:not([aria-haspopup]):not([aria-label])]:max-w-full [&>div>button:not([aria-haspopup]):not([aria-label])]:whitespace-normal [&>div>a:not([aria-haspopup]):not([aria-label])]:h-auto [&>div>a:not([aria-haspopup]):not([aria-label])]:min-h-10 [&>div>a:not([aria-haspopup]):not([aria-label])]:max-w-full [&>div>a:not([aria-haspopup]):not([aria-label])]:whitespace-normal">
                  {actions}
                </div>
              )}
            </header>
          ) : (
            header
          )}
          {children}
        </>
      )}
    </div>
  );
};

const BackButton = ({
  onClick,
  label,
  href,
}: {
  onClick: () => void;
  label: string;
  href?: string;
}) => {
  const className =
    'inline-flex items-center gap-1.5 text-sm text-primary hover:underline print:hidden';
  const content = (
    <>
      <ArrowLeft className="h-4 w-4" /> {label}
    </>
  );
  return href !== undefined ? (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {content}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
};
