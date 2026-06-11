import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Per-table key resolution: fixed tables map to one worksheet key; keyed
// tables carry the worksheet key in a column.
const RUN_TABLES = [
  { table: 'client_breakeven_runs', sheetKey: 'breakeven-analysis' },
  { table: 'client_working_capital_runs', sheetKey: 'working-capital-analysis' },
  { table: 'client_pl_comparisons_runs', sheetKey: 'p-l-comparisons' },
  { table: 'client_balance_sheet_comparisons_runs', sheetKey: 'balance-sht-comparisons' },
  { table: 'client_basic_client_info_runs', sheetKey: 'basic-client-info' },
  { table: 'client_current_financial_information_runs', sheetKey: 'current-financial-information' },
  { table: 'client_five_year_projections_runs', sheetKey: '5-year-projections' },
  { table: 'client_weekly_cash_flow_runs', sheetKey: 'weekly-cash-flow' },
  { table: 'client_flexible_budget_variance_runs', sheetKey: 'flexible-budget-variance' },
  { table: 'client_advanced_analyst_sheet_runs', keyColumn: 'sheet_key' },
  { table: 'client_workbook_port_runs', keyColumn: 'workbook_key' },
];

function parseLimit(rawLimit) {
  const parsed = Number.parseInt(rawLimit || '8', 10);
  if (!Number.isFinite(parsed)) return 8;
  return Math.min(Math.max(parsed, 1), 20);
}

export async function GET(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id') || searchParams.get('clientId');
  if (!clientId) {
    return NextResponse.json({ ok: false, error: 'Missing client_id.' }, { status: 400 });
  }

  const limit = parseLimit(searchParams.get('limit'));

  const perTable = await Promise.all(
    RUN_TABLES.map(async ({ table, sheetKey, keyColumn }) => {
      const columns = keyColumn ? `id, created_at, ${keyColumn}` : 'id, created_at';
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error || !data) {
        return [];
      }

      return data.map((row) => ({
        sheetKey: keyColumn ? row[keyColumn] : sheetKey,
        runId: row.id,
        createdAt: row.created_at,
      }));
    }),
  );

  const runs = perTable
    .flat()
    .filter((run) => run.sheetKey)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, limit);

  return NextResponse.json({ ok: true, runs });
}
