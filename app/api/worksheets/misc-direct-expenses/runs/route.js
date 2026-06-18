import { createWorksheetRunsHandlers } from '@/lib/server/worksheetRunsFactory';

const { GET, POST } = createWorksheetRunsHandlers('client_misc_direct_expense_runs', 'misc direct expense runs');
export { GET, POST };
