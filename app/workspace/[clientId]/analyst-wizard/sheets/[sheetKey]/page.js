import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';
import BreakevenWizard from '@/components/BreakevenWizard';
import { notFound } from 'next/navigation';

export default async function AnalystWizardSheetPlaceholderPage({ params }) {
  const { sheetKey, clientId } = await params;
  const worksheet = worksheetCatalog.find((entry) => entry.key === sheetKey);

  if (!worksheet) {
    notFound();
  }

  if (sheetKey === 'breakeven-analysis') {
    return <BreakevenWizard clientId={clientId} />;
  }

  return (
    <section className="panel">
      <h2>{worksheet.sheetName}</h2>
      <p>Coming soon.</p>
    </section>
  );
}
