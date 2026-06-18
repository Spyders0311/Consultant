grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.client_workbook_port_runs,
  public.client_financial_snapshots,
  public.client_misc_direct_expense_runs,
  public.client_misc_indirect_expense_runs,
  public.client_twelve_month_pl_runs,
  public.client_twelve_month_analysis_runs
to authenticated;
