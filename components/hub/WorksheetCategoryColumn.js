import WorksheetCard from '@/components/hub/WorksheetCard';
import { HUB_CATEGORY_LABELS } from '@/lib/worksheets/catalogMetadata';

/**
 * @param {{
 *   category: import('@/lib/worksheets/hubStatus').HubCategory,
 *   items: import('@/lib/worksheets/hubStatus').WorksheetHubStatusEntry[],
 * }} props
 */
export default function WorksheetCategoryColumn({ category, items }) {
  if (items.length === 0) {
    return null;
  }

  const label = HUB_CATEGORY_LABELS[category] || category;

  return (
    <section className="hub-category-column" aria-label={label}>
      <h3 className="hub-category-column__title">{label}</h3>
      <div className="hub-category-column__grid">
        {items.map((entry) => (
          <WorksheetCard key={entry.worksheetKey} entry={entry} />
        ))}
      </div>
    </section>
  );
}
