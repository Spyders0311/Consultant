import worksheetCatalog from '@/knowledge/workbooks/worksheet_catalog.json';
import { notFound } from 'next/navigation';

export default async function AnalystWizardSheetPlaceholderPage({ params }) {
  const { sheetKey } = await params;
  const worksheet = worksheetCatalog.find((entry) => entry.key === sheetKey);

  if (!worksheet) {
    notFound();
  }

  return (
    <section className="panel">
      <h2>{worksheet.sheetName}</h2>
      <p>Coming soon.</p>
    </section>
  );
}
