import TwelveMonthPayrollWizard from '@/components/TwelveMonthPayrollWizard';
import TwelveMonthDirectLaborWizard from '@/components/TwelveMonthDirectLaborWizard';
import TwelveMonthMaterialWizard from '@/components/TwelveMonthMaterialWizard';
import TwelveMonthOperatingExpWizard from '@/components/TwelveMonthOperatingExpWizard';
import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';
import BasicClientInfoWizard from '@/components/BasicClientInfoWizard';
import BalanceSheetComparisonsWizard from '@/components/BalanceSheetComparisonsWizard';
import BreakevenWizard from '@/components/BreakevenWizard';
import CurrentFinancialInformationWizard from '@/components/CurrentFinancialInformationWizard';
import DerivedRatiosWizard from '@/components/DerivedRatiosWizard';
import FiveYearProjectionsWizard from '@/components/FiveYearProjectionsWizard';
import FourYearHistoryWizard from '@/components/FourYearHistoryWizard';
import MiscDirectExpensesWizard from '@/components/MiscDirectExpensesWizard';
import MiscIndirectExpensesWizard from '@/components/MiscIndirectExpensesWizard';
import PLComparisonsWizard from '@/components/PLComparisonsWizard';
import TwelveMonthPLComparisonsWizard from '@/components/TwelveMonthPLComparisonsWizard';
import WorkingCapitalWizard from '@/components/WorkingCapitalWizard';
import WorkbookPortWizard from '@/components/WorkbookPortWizard';
import IntegratedWorksheetPage from '@/components/workspace/IntegratedWorksheetPage';
import { DERIVED_RATIO_CONFIGS } from '@/lib/worksheets/derivedRatioConfigs';
import { WORKBOOK_PORT_CONFIGS } from '@/lib/workbookPortConfigs';
import { WORKBOOK_PORT_KEYS } from '@/lib/workbookPortKeys';
import { mapClientRowToFiveYearBaseline, mapClientRowToProfile } from '@/lib/worksheets/clientBaselines';
import { DERIVED_WORKSHEET_KEYS, NATIVE_WORKSHEET_KEYS } from '@/lib/worksheets/catalogMetadata';
import { getHubStatusItemForWorksheet } from '@/lib/server/hubStatus';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

const INTEGRATED_WORKSHEET_KEYS = new Set([...NATIVE_WORKSHEET_KEYS, ...DERIVED_WORKSHEET_KEYS]);

const customWorksheets = Object.fromEntries(
  [...WORKBOOK_PORT_KEYS].map((key) => [
    key,
    {
      key,
      sheetName: WORKBOOK_PORT_CONFIGS[key]?.title || key,
      category: 'analyst-wizard',
      integrationStatus: 'workbook-port',
      hubCategory: 'financial-analysis',
      description: WORKBOOK_PORT_CONFIGS[key]?.description || 'Workbook port bridge.',
    },
  ]),
);

const CLIENT_SELECT =
  'id, company_name, industry, horizon_years, current_annual_revenue, cogs_percent, revenue_growth_percent, fixed_payroll, fixed_rent_utilities, fixed_other, fixed_expense_growth_percent, market_growth_percent, target_market_share_percent, inflation_percent, tax_rate_percent, discount_rate_percent, primary_contact_name, primary_contact_email, primary_contact_phone, location_city, location_state, profile_notes, ein, entity_type, address_line1, address_line2, address_postal_code, client_profile';

/**
 * @param {string} clientId
 * @param {string} sheetKey
 * @param {string} title
 * @param {import('@/lib/worksheets/hubStatus').WorksheetHubLifecycleStatus} status
 * @param {import('react').ReactNode} children
 */
function wrapIntegratedWorksheet(clientId, sheetKey, title, status, children) {
  return (
    <IntegratedWorksheetPage clientId={clientId} worksheetKey={sheetKey} title={title} status={status}>
      {children}
    </IntegratedWorksheetPage>
  );
}

export default async function AnalystWizardSheetPlaceholderPage({ params }) {
  const { sheetKey, clientId } = await params;
  const worksheet = worksheetCatalog.find((entry) => entry.key === sheetKey) || customWorksheets[sheetKey];

  if (!worksheet) {
    notFound();
  }

  const supabase = await createClient();
  const { data: client } = await supabase.from('clients').select(CLIENT_SELECT).eq('id', clientId).maybeSingle();

  const isIntegrated = INTEGRATED_WORKSHEET_KEYS.has(sheetKey);
  let shellStatus = /** @type {import('@/lib/worksheets/hubStatus').WorksheetHubLifecycleStatus} */ ('not_started');

  if (isIntegrated) {
    const hubItem = await getHubStatusItemForWorksheet(clientId, sheetKey, supabase);
    shellStatus = hubItem?.status || 'not_started';
  }

  const wrap = (content) =>
    isIntegrated
      ? wrapIntegratedWorksheet(clientId, sheetKey, worksheet.sheetName, shellStatus, content)
      : content;

  if (WORKBOOK_PORT_KEYS.has(sheetKey)) {
    return <WorkbookPortWizard clientId={clientId} workbookKey={sheetKey} />;
  }

  if (DERIVED_RATIO_CONFIGS[sheetKey]) {
    return wrap(<DerivedRatiosWizard clientId={clientId} sheetKey={sheetKey} clientRow={client} />);
  }

  if (sheetKey === 'basic-client-info') {
    return wrap(
      <BasicClientInfoWizard clientId={clientId} initialClientInfo={mapClientRowToProfile(client)} />,
    );
  }
  if (sheetKey === 'breakeven-analysis') {
    return wrap(<BreakevenWizard clientId={clientId} />);
  }
  if (sheetKey === 'working-capital-analysis') {
    return wrap(<WorkingCapitalWizard clientId={clientId} />);
  }
  if (sheetKey === 'p-l-comparisons') {
    return wrap(<PLComparisonsWizard clientId={clientId} clientRow={client} />);
  }
  if (sheetKey === 'balance-sht-comparisons') {
    return wrap(<BalanceSheetComparisonsWizard clientId={clientId} clientRow={client} />);
  }
  if (sheetKey === 'current-financial-information') {
    return wrap(<CurrentFinancialInformationWizard clientId={clientId} />);
  }
  if (sheetKey === '5-year-projections') {
    return wrap(
      <FiveYearProjectionsWizard clientId={clientId} initialBaseline={mapClientRowToFiveYearBaseline(client)} />,
    );
  }
  if (sheetKey === 'misc-direct-expenses') {
    return wrap(<MiscDirectExpensesWizard clientId={clientId} />);
  }
  if (sheetKey === 'misc-indirect-expenses') {
    return wrap(<MiscIndirectExpensesWizard clientId={clientId} />);
  }
  if (sheetKey === '12-month-p-l-comparisons') {
    return wrap(<TwelveMonthPLComparisonsWizard clientId={clientId} />);
  }
  if (sheetKey === '12-month-analysis-payroll') {
    return wrap(<TwelveMonthPayrollWizard clientId={clientId} />);
  }
  if (sheetKey === '12-month-analysis-direct-labor') {
    return wrap(<TwelveMonthDirectLaborWizard clientId={clientId} />);
  }
  if (sheetKey === '12-month-analysis-material') {
    return wrap(<TwelveMonthMaterialWizard clientId={clientId} />);
  }
  if (sheetKey === '12-month-analysis-operating-exp') {
    return wrap(<TwelveMonthOperatingExpWizard clientId={clientId} />);
  }
  if (sheetKey === '4-year-history-auto') {
    return wrap(<FourYearHistoryWizard clientId={clientId} clientRow={client} />);
  }

  return (
    <section className="panel">
      <h2>{worksheet.sheetName}</h2>
      <p>Coming soon.</p>
    </section>
  );
}
