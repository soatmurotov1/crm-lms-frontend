import { StatCard } from '@/components/ui/StatCard';
import { useTranslation } from 'react-i18next';
import type { Expense } from '@/features/expenses/types';
import { formatMoney } from '@/lib/money';

type MySettlementsSummaryPanelProps = {
  settlements: Expense[];
  total: number;
  isLoading: boolean;
};

export const MySettlementsSummaryPanel = ({
  settlements,
  total,
  isLoading,
}: MySettlementsSummaryPanelProps) => {
  const { t } = useTranslation();
  const openCount = settlements.filter(
    (row) => row.status === 'planned' || row.status === 'partially_paid',
  ).length;
  const remainingTotal = settlements.reduce(
    (sum, row) => sum + Number(row.remaining_amount),
    0,
  );

  return (
    <section
      aria-labelledby="my-settlements-summary-title"
      aria-busy={isLoading}
      className="grid gap-3 sm:grid-cols-3"
    >
      <StatCard
        label={
          <span id="my-settlements-summary-title">
            {t('my_settlements.summary.total')}
          </span>
        }
        value={isLoading ? '—' : total}
      />
      <StatCard
        label={t('my_settlements.summary.open')}
        value={isLoading ? '—' : openCount}
      />
      <StatCard
        label={t('my_settlements.summary.remaining')}
        value={isLoading ? '—' : formatMoney(remainingTotal)}
      />
    </section>
  );
};
