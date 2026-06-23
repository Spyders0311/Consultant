import TwelveMonthPayrollWizard from '@/components/TwelveMonthPayrollWizard';
import TwelveMonthDirectLaborWizard from '@/components/TwelveMonthDirectLaborWizard';
import TwelveMonthMaterialWizard from '@/components/TwelveMonthMaterialWizard';
import TwelveMonthOperatingExpWizard from '@/components/TwelveMonthOperatingExpWizard';
import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';
import BasicClientInfoWizard from '@/components/BasicClientInfoWizard';
import BalanceSheetComparisonsWizard from '@/components/BalanceSheetComparisonsWizard';
import BreakevenWizard from '@/components/BreakevenWizard';
import ClientGoalsWizard from '@/components/ClientGoalsWizard';
import CurrentFinancialInformationWizard from '@/components/CurrentFinancialInformationWizard';
import DerivedPlWizard from '@/components/DerivedPlWizard';
import DerivedRatiosWizard from '@/components/DerivedRatiosWizard';
import DerivedRoiWizard from '@/components/DerivedRoiWizard';
import EngagementReportWizard from '@/components/EngagementReportWizard';
import FiveYearProjectionsWizard from '@/components/FiveYearProjectionsWizard';
import FormDocumentWizard from '@/components/FormDocumentWizard';
import FourYearHistoryWizard from '@/components/FourYearHistoryWizard';
import MatrixQuestionnaireWizard from '@/components/MatrixQuestionnaireWizard';
import MiscDirectExpensesWizard from '@/components/MiscDirectExpensesWizard';
import MiscIndirectExpensesWizard from '@/components/MiscIndirectExpensesWizard';
import PLComparisonsWizard from '@/components/PLComparisonsWizard';
import TwelveMonthPLComparisonsWizard from '@/components/TwelveMonthPLComparisonsWizard';
import ValuationWizard from '@/components/ValuationWizard';
import WorkingCapitalWizard from '@/components/WorkingCapitalWizard';
import WorkbookPortWizard from '@/components/WorkbookPortWizard';
import IntegratedWorksheetPage from '@/components/workspace/IntegratedWorksheetPage';
import { DERIVED_PL_CONFIGS } from '@/lib/worksheets/derivedPlConfigs';
import { DERIVED_RATIO_CONFIGS } from '@/lib/worksheets/derivedRatioConfigs';
import { CLIENT_GOALS_CONFIGS, FORM_DOCUMENT_CONFIGS } from '@/lib/worksheets/formDocumentConfigs';
import { MATRIX_CONFIGS } from '@/lib/worksheets/matrixConfigs';
import { REPORT_SECTION_CONFIGS } from '@/lib/worksheets/reportSectionConfigs';
import { ROI_ANALYSIS_CONFIGS } from '@/lib/worksheets/roiAnalysisConfigs';
import { VALUATION_CONFIGS } from '@/lib/worksheets/valuationConfigs';
import { WORKBOOK_PORT_CONFIGS } from '@/lib/workbookPortConfigs';
import { WORKBOOK_PORT_KEYS } from '@/lib/workbookPortKeys';
import { mapClientRowToFiveYearBaseline, mapClientRowToProfile } from '@/lib/worksheets/clientBaselines';
import { ALL_INTEGRATED_WORKSHEET_KEYS, DEPRECATED_WORKSHEET_KEYS } from '@/lib/worksheets/catalogMetadata';
import { getHubStatusItemForWorksheet } from '@/lib/server/hubStatus';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

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

  if (DEPRECATED_WORKSHEET_KEYS.has(sheetKey)) {
    return (
      <section className="panel">
        <h2>{worksheet.sheetName}</h2>
        <p>This legacy navigation tab is replaced by the Analyst Worksheet Hub.</p>
      </section>
    );
  }

  const supabase = await createClient();
  const { data: client } = await supabase.from('clients').select(CLIENT_SELECT).eq('id', clientId).maybeSingle();

  const isIntegrated = ALL_INTEGRATED_WORKSHEET_KEYS.has(sheetKey);
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
  if (DERIVED_PL_CONFIGS[sheetKey]) {
    return wrap(<DerivedPlWizard clientId={clientId} sheetKey={sheetKey} />);
  }
  if (ROI_ANALYSIS_CONFIGS[sheetKey]) {
    return wrap(<DerivedRoiWizard clientId={clientId} sheetKey={sheetKey} />);
  }
  if (REPORT_SECTION_CONFIGS[sheetKey]) {
    return wrap(<EngagementReportWizard clientId={clientId} sheetKey={sheetKey} clientRow={client} />);
  }
  if (MATRIX_CONFIGS[sheetKey]) {
    return wrap(<MatrixQuestionnaireWizard clientId={clientId} sheetKey={sheetKey} />);
  }
  if (VALUATION_CONFIGS[sheetKey]) {
    return wrap(<ValuationWizard clientId={clientId} sheetKey={sheetKey} clientRow={client} />);
  }
  if (CLIENT_GOALS_CONFIGS[sheetKey]) {
    return wrap(<ClientGoalsWizard clientId={clientId} sheetKey={sheetKey} />);
  }
  if (FORM_DOCUMENT_CONFIGS[sheetKey]) {
    return wrap(<FormDocumentWizard clientId={clientId} sheetKey={sheetKey} clientRow={client} />);
  }

  const nativeWizards = {
    'basic-client-info': (
      <BasicClientInfoWizard clientId={clientId} initialClientInfo={mapClientRowToProfile(client)} />
    ),
    'breakeven-analysis': <BreakevenWizard clientId={clientId} />,
    'working-capital-analysis': <WorkingCapitalWizard clientId={clientId} />,
    'p-l-comparisons': <PLComparisonsWizard clientId={clientId} clientRow={client} />,
    'balance-sht-comparisons': <BalanceSheetComparisonsWizard clientId={clientId} clientRow={client} />,
    'current-financial-information': <CurrentFinancialInformationWizard clientId={clientId} />,
    '5-year-projections': (
      <FiveYearProjectionsWizard clientId={clientId} initialBaseline={mapClientRowToFiveYearBaseline(client)} />
    ),
    'misc-direct-expenses': <MiscDirectExpensesWizard clientId={clientId} />,
    'misc-indirect-expenses': <MiscIndirectExpensesWizard clientId={clientId} />,
    '12-month-p-l-comparisons': <TwelveMonthPLComparisonsWizard clientId={clientId} />,
    '12-month-analysis-payroll': <TwelveMonthPayrollWizard clientId={clientId} />,
    '12-month-analysis-direct-labor': <TwelveMonthDirectLaborWizard clientId={clientId} />,
    '12-month-analysis-material': <TwelveMonthMaterialWizard clientId={clientId} />,
    '12-month-analysis-operating-exp': <TwelveMonthOperatingExpWizard clientId={clientId} />,
    '4-year-history-auto': <FourYearHistoryWizard clientId={clientId} clientRow={client} />,
  };

  if (nativeWizards[sheetKey]) {
    return wrap(nativeWizards[sheetKey]);
  }

  return (
    <section className="panel">
      <h2>{worksheet.sheetName}</h2>
      <p>Coming soon.</p>
    </section>
  );
}
