import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';
import BasicClientInfoWizard from '@/components/BasicClientInfoWizard';
import BalanceSheetComparisonsWizard from '@/components/BalanceSheetComparisonsWizard';
import BreakevenWizard from '@/components/BreakevenWizard';
import CurrentFinancialInformationWizard from '@/components/CurrentFinancialInformationWizard';
import PLComparisonsWizard from '@/components/PLComparisonsWizard';
import WorkingCapitalWizard from '@/components/WorkingCapitalWizard';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function AnalystWizardSheetPlaceholderPage({ params }) {
  const { sheetKey, clientId } = await params;
  const worksheet = worksheetCatalog.find((entry) => entry.key === sheetKey);
  let initialClientInfo = null;

  if (!worksheet) {
    notFound();
  }

  if (sheetKey === 'basic-client-info') {
    const supabase = await createClient();
    const { data: client } = await supabase
      .from('clients')
      .select('company_name, industry')
      .eq('id', clientId)
      .maybeSingle();

    initialClientInfo = {
      companyName: client?.company_name || '',
      industry: client?.industry || '',
    };
    return <BasicClientInfoWizard clientId={clientId} initialClientInfo={initialClientInfo} />;
  }

  if (sheetKey === 'breakeven-analysis') {
    return <BreakevenWizard clientId={clientId} />;
  }
  if (sheetKey === 'working-capital-analysis') {
    return <WorkingCapitalWizard clientId={clientId} />;
  }
  if (sheetKey === 'p-l-comparisons') {
    return <PLComparisonsWizard clientId={clientId} />;
  }
  if (sheetKey === 'balance-sht-comparisons') {
    return <BalanceSheetComparisonsWizard clientId={clientId} />;
  }
  if (sheetKey === 'current-financial-information') {
    return <CurrentFinancialInformationWizard clientId={clientId} />;
  }

  return (
    <section className="panel">
      <h2>{worksheet.sheetName}</h2>
      <p>Coming soon.</p>
    </section>
  );
}
