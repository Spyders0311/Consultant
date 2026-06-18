import { createWorksheetRunsHandlers } from '@/lib/server/worksheetRunsFactory';

const { GET, POST } = createWorksheetRunsHandlers('client_misc_indirect_expense_runs', 'misc indirect expense runs');
export { GET, POST };
