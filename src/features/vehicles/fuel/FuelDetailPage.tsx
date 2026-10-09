import { EntityDetailShell } from '@/components/ui/EntityDetailShell';
import { Card } from '@/components/ui/card';
import { useCan } from '@/hooks/useCan';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  Car,
  Buildings,
  Speedometer,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  Warning,
} from '@phosphor-icons/react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  useFuel,
  useFuelMutation,
  fuelAction,
  uploadFuelEvidence,
  fuelImage,
} from './service';
import FuelForm from './FuelForm';

const STATUS_CONFIG: Record<
  string,
  { icon: typeof CheckCircle; className: string }
> = {
  approved: {
    icon: CheckCircle,
    className: 'gap-1 border-border bg-success/10 text-success',
  },
  submitted: {
    icon: Clock,
    className: 'gap-1 border-border bg-warning/10 text-warning',
  },
  rejected: {
    icon: XCircle,
    className: 'gap-1 border-border bg-destructive/10 text-destructive',
  },
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status];
  if (config) {
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3.5 w-3.5" weight="fill" />
        {t(`fuel.${status}`)}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      {t(`fuel.${status}`)}
    </Badge>
  );
}

function Evidence({
  id,
  evidenceId,
  slot,
}: {
  id: string;
  evidenceId: string;
  slot: string;
}) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { t } = useTranslation();
  useEffect(() => {
    const c = new AbortController();
    let objectUrl = '';
    void fuelImage(id, evidenceId, c.signal)
      .then((blob) => {
        if (!c.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch(() => {
        if (!c.signal.aborted) setFailed(true);
      });
    return () => {
      c.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, evidenceId, attempt]);
  return url ? (
    <img
      src={url}
      alt={t(`fuel.${slot}`)}
      className="max-h-72 w-full rounded-lg object-contain bg-black/5 dark:bg-white/5"
    />
  ) : failed ? (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        setFailed(false);
        setAttempt((v) => v + 1);
      }}
    >
      {t('common.retry')}
    </Button>
  ) : (
    <Skeleton className="h-24 rounded-lg" />
  );
}

function Upload({
  id,
  slot,
  busy,
}: {
  id: string;
  slot: string;
  busy: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const upload = useFuelMutation(async () => {
    if (file) await uploadFuelEvidence(id, slot, file, setProgress);
  });
  return (
    <div className="space-y-2">
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        aria-label={t(`fuel.${slot}`)}
        disabled={upload.isPending}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      {file && (
        <Button
          size="sm"
          disabled={upload.isPending}
          onClick={async () => {
            busy(true);
            try {
              await upload.mutateAsync(undefined);
              setFile(null);
            } catch {
              /* preserve selected image for retry */
            } finally {
              busy(false);
            }
          }}
        >
          {t(upload.isError ? 'common.retry' : 'fuel.upload')}
        </Button>
      )}
      {upload.isPending && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      )}
    </div>
  );
}

export default function FuelDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const mayUpdate = useCan('fuel.update');
  const maySubmit = useCan('fuel.submit');
  const mayReview = useCan('fuel.review');
  const mayCancel = useCan('fuel.cancel');
  const mayReadExpense = useCan('expenses.read');
  const query = useFuel(id);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string[]>([]);
  const setEditorBusy = useCallback((value: boolean) => {
    setBusy((old) =>
      value
        ? old.includes('editor')
          ? old
          : [...old, 'editor']
        : old.filter((item) => item !== 'editor'),
    );
  }, []);
  const mutation = useFuelMutation(
    ({ action, body }: { action: string; body: unknown }) =>
      fuelAction(id, action, body),
  );

  if (query.isLoading || !query.data) {
    return (
      <EntityDetailShell
        backHref="/vehicle-fuel"
        onBack={() => void navigate({ to: '/vehicle-fuel' })}
        backLabel={t('fuel.title')}
        isLoading={query.isLoading}
        isError={!query.data}
        errorTitle={t('common.error')}
        onRetry={() => void query.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  const row = query.data;
  const edit =
    mayUpdate &&
    ['draft', 'rejected'].includes(row.status) &&
    row.author_id === user?.id;
  const reviewer = mayReview;

  return (
    <EntityDetailShell
      backHref="/vehicle-fuel"
      onBack={() => void navigate({ to: '/vehicle-fuel' })}
      backLabel={t('fuel.title')}
      isLoading={false}
      isError={false}
      title={
        <span className="inline-flex items-center gap-2">
          <Buildings className="h-5 w-5 text-muted-foreground" />
          {row.station_name}
        </span>
      }
      meta={
        <>
          <StatusBadge status={row.status} />{' '}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary tracking-wide">
              <Car className="h-3.5 w-3.5" />
              {row.vehicle_plate}
            </span>
            {row.source_status === 'source_verified' && (
              <Badge
                variant="outline"
                className="text-[10px] gap-0.5 text-success border-border bg-success/10"
              >
                <Receipt className="h-2.5 w-2.5" />
                {t('fuel.tax_verified')}
              </Badge>
            )}
          </div>
        </>
      }
    >
      <Card>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">
              {t('fuel.occurred_at')}
            </dt>
            <dd className="font-medium tabular-nums">
              {new Date(row.occurred_at).toLocaleString('uz-UZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t('fuel.odometer_km')}
            </dt>
            <dd className="font-medium tabular-nums flex items-center gap-1">
              <Speedometer className="h-3.5 w-3.5 text-muted-foreground" />
              {row.odometer_km?.toLocaleString()} km
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t('fuel.funding_source')}
            </dt>
            <dd className="font-medium">{t(`fuel.${row.funding_source}`)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t('fuel.source_status')}
            </dt>
            <dd className="font-medium">{t(`fuel.${row.source_status}`)}</dd>
          </div>
        </dl>
      </Card>

      {row.source_data && (
        <Card asChild>
          <section
            aria-label={t('fuel.original_receipt')}
            className=" space-y-3 "
          >
            <h2 className="font-heading text-base font-semibold">
              {t('fuel.original_receipt')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('fuel.source_comparison_hint')}
            </p>
            {row.source_data.seller_name && (
              <p className="text-sm font-medium">
                {row.source_data.seller_name}
              </p>
            )}
            {row.source_data.seller_tin && (
              <p className="text-sm">
                {t('fuel.tax_id')}:{' '}
                <span className="font-medium tabular-nums">
                  {row.source_data.seller_tin}
                </span>
              </p>
            )}
            {row.source_data.total && (
              <p className="text-sm">
                {t('fuel.receipt_total')}:{' '}
                <strong className="tabular-nums">
                  {row.source_data.total}
                </strong>
              </p>
            )}
            {row.source_data.reason && (
              <p role="status" className="text-sm">
                {t(`fuel.source_reasons.${row.source_data.reason}`, {
                  defaultValue: t('fuel.manual_review'),
                })}
              </p>
            )}
            {row.source_data.warnings?.map((warning) => (
              <p
                className="text-sm font-medium text-destructive"
                role="alert"
                key={warning}
              >
                <Warning className="mr-1 inline h-3.5 w-3.5" />
                {t(`fuel.source_reasons.${warning}`, {
                  defaultValue: t('fuel.manual_review'),
                })}
              </p>
            ))}
            {row.source_data.lines?.map((line) => (
              <div
                key={line.index}
                className="rounded-md bg-muted/40 p-3 text-sm"
              >
                <p className="font-medium">{line.name}</p>
                <p className="text-muted-foreground">
                  {t('fuel.quantity')}: {line.quantity}{' '}
                  {line.unit ?? t('common.na')} · {t('fuel.line_total')}:{' '}
                  <span className="tabular-nums">{line.line_total}</span>
                </p>
                <p className="text-muted-foreground">
                  {t('fuel.mxik')}: {line.mxik || t('common.na')}
                </p>
              </div>
            ))}
          </section>
        </Card>
      )}
      {!row.source_data && (
        <Card className=" ">
          <p className="text-sm text-muted-foreground">
            {t('fuel.manual_review')}
          </p>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">
          {t('fuel.selected_fuel')}
        </h2>
        {edit ? (
          <FuelForm
            key={row.id}
            row={row}
            onBusy={setEditorBusy}
            disabled={
              mutation.isPending || busy.some((item) => item !== 'editor')
            }
          />
        ) : (
          <div className="grid gap-3">
            {row.lines.map((line, i) => (
              <Card className=" flex items-center justify-between " key={i}>
                <div className="space-y-0.5">
                  <span className="text-sm font-medium">
                    {line.name || t(`fuel.${line.fuel_type}`)}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {t(`fuel.${line.fuel_type}`)} · {line.quantity}{' '}
                    {t(`fuel.${line.unit}`)} ×{' '}
                    {Number(line.unit_price).toLocaleString()}
                  </p>
                </div>
                <span className="font-bold tabular-nums text-foreground">
                  {Number(line.line_total).toLocaleString()}{' '}
                  {t('common.currency')}
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {['receipt', 'odometer'].map((slot) => (
          <Card key={slot} asChild>
            <section className=" space-y-3 ">
              <h2 className="font-heading text-sm font-semibold">
                {t(`fuel.${slot}`)}
              </h2>
              {row.evidence
                .filter((e) => e.slot === slot)
                .map((e) => (
                  <Evidence key={e.id} id={id} evidenceId={e.id} slot={slot} />
                ))}
              {edit && (
                <Upload
                  id={id}
                  slot={slot}
                  busy={(value) =>
                    setBusy((old) =>
                      value ? [...old, slot] : old.filter((v) => v !== slot),
                    )
                  }
                />
              )}
            </section>
          </Card>
        ))}
      </div>

      {(edit || reviewer || maySubmit || mayCancel) && (
        <Card asChild>
          <section className=" space-y-4 ">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t('fuel.reason')}</span>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {maySubmit &&
                row.author_id === user?.id &&
                row.status === 'draft' && (
                  <Button
                    disabled={
                      mutation.isPending ||
                      busy.length > 0 ||
                      !['receipt', 'odometer'].every((s) =>
                        row.evidence.some((e) => e.slot === s),
                      )
                    }
                    onClick={() =>
                      mutation.mutate({ action: 'submit', body: {} })
                    }
                  >
                    {t('fuel.submit')}
                  </Button>
                )}
              {reviewer &&
                row.status === 'submitted' &&
                ['approve', 'reject'].map((decision) => (
                  <Button
                    key={decision}
                    variant={decision === 'approve' ? 'default' : 'outline'}
                    disabled={
                      mutation.isPending || busy.length > 0 || !reason.trim()
                    }
                    onClick={() =>
                      mutation.mutate({
                        action: 'review',
                        body: { decision, reason },
                      })
                    }
                  >
                    {t(`fuel.${decision}`)}
                  </Button>
                ))}
              {mayCancel && row.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  disabled={
                    mutation.isPending || busy.length > 0 || !reason.trim()
                  }
                  onClick={() =>
                    mutation.mutate({ action: 'cancel', body: { reason } })
                  }
                >
                  {t('fuel.cancel')}
                </Button>
              )}
            </div>
          </section>
        </Card>
      )}

      {row.expense_id && mayReadExpense && (
        <Link
          to="/expenses/$id"
          params={{ id: row.expense_id }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {t('fuel.expense_link')}
        </Link>
      )}

      {row.history && row.history.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-base font-semibold">
            {t('fuel.history')}
          </h2>
          {row.history.map((review) => (
            <Card key={review.id} className=" space-y-2 ">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs">
                  {t(`fuel.${review.action}`)}
                </Badge>
                {review.reason && (
                  <span className="text-muted-foreground">{review.reason}</span>
                )}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {new Date(review.created_at).toLocaleString('uz-UZ')}
                </span>
              </div>
              {review.changes?.before && review.changes?.after && (
                <dl className="space-y-1 text-xs">
                  {(
                    [
                      'odometer_km',
                      'occurred_at',
                      'funding_source',
                      'lines',
                    ] as const
                  ).map((field) => {
                    const aliases = {
                      odometer_km: 'odometerKm',
                      occurred_at: 'occurredAt',
                      funding_source: 'fundingSource',
                      lines: 'lines',
                    };
                    const before = review.changes?.before?.[field];
                    const after = review.changes?.after?.[aliases[field]];
                    if (
                      JSON.stringify(before) === JSON.stringify(after) ||
                      after === undefined
                    )
                      return null;
                    const describe = (value: unknown): string =>
                      Array.isArray(value)
                        ? value
                            .map((line) =>
                              typeof line === 'object' && line
                                ? Object.values(line).join(' · ')
                                : String(line),
                            )
                            .join('; ')
                        : String(value ?? 'N/A');
                    return (
                      <div key={field} className="flex gap-2">
                        <dt className="font-medium text-muted-foreground min-w-[80px]">
                          {t(`fuel.${field === 'lines' ? 'line' : field}`)}
                        </dt>
                        <dd className="break-words text-foreground">
                          <span className="text-destructive line-through">
                            {describe(before)}
                          </span>
                          {' → '}
                          <span className="text-success">
                            {describe(after)}
                          </span>
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              )}
            </Card>
          ))}
        </section>
      )}
    </EntityDetailShell>
  );
}
