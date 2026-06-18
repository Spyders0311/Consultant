import MiscExpenseWizard from '@/components/MiscExpenseWizard';
import { DIRECT_EXPENSE_CATEGORIES } from '@/lib/worksheets/plCategories';

export default function MiscDirectExpensesWizard({ clientId }) {
  return (
    <MiscExpenseWizard
      clientId={clientId}
      worksheetKey="misc-direct-expenses"
      title="MISC DIRECT EXPENSES"
      description="Capture direct cost detail that feeds P&L comparisons and breakeven analysis."
      categoryOptions={DIRECT_EXPENSE_CATEGORIES}
      snapshotSource="misc-direct-expenses"
    />
  );
}
