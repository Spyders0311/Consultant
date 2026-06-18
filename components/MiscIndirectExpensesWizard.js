import MiscExpenseWizard from '@/components/MiscExpenseWizard';
import { INDIRECT_EXPENSE_CATEGORIES } from '@/lib/worksheets/plCategories';

export default function MiscIndirectExpensesWizard({ clientId }) {
  return (
    <MiscExpenseWizard
      clientId={clientId}
      worksheetKey="misc-indirect-expenses"
      title="MISC INDIRECT EXPENSES"
      description="Capture indirect and G&A expense detail for breakeven and operating expense rollups."
      categoryOptions={INDIRECT_EXPENSE_CATEGORIES}
      snapshotSource="misc-indirect-expenses"
    />
  );
}
