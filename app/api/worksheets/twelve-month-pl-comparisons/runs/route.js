import { createWorksheetRunsHandlers } from '@/lib/server/worksheetRunsFactory';

const { GET, POST } = createWorksheetRunsHandlers('client_twelve_month_pl_runs', 'twelve month P&L runs');
export { GET, POST };
