import Link from 'next/link';
import Icon from '@/components/ui/Icon';

/**
 * Placeholder page for worksheets that are cataloged but not ported yet.
 * Presentational; the dispatcher computes the live alternatives server-side.
 */
export default function ComingSoonPanel({ worksheet, clientId, alternatives = [] }) {
  return (
    <section className="panel coming-soon">
      <div className="coming-soon-header">
        <p className="eyebrow">{worksheet.group}</p>
        <h2>{worksheet.displayName}</h2>
        <span className="badge badge-soon">Coming soon</span>
      </div>

      <p>
        This worksheet is cataloged from{' '}
        <strong>{worksheet.sourceWorkbook || 'the BMS workbook library'}</strong> but has not been
        rebuilt as a guided workflow yet. The original sheet remains available in the source
        workbook, and its calculations will move here in a later port.
      </p>

      {alternatives.length > 0 && (
        <div className="coming-soon-alternatives">
          <h3>Available now in {worksheet.group}</h3>
          <div className="hub-rows">
            {alternatives.map((sheet) => (
              <Link
                key={sheet.key}
                href={`/workspace/${clientId}/analyst-wizard/sheets/${sheet.key}`}
                className="hub-row"
              >
                <Icon name="sheet" size={15} />
                <span className="hub-row-name">{sheet.displayName}</span>
                <span className="badge badge-live">Live</span>
                <Icon name="chevron-right" size={14} className="hub-row-chevron" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="actions" style={{ marginTop: 16 }}>
        <Link href={`/workspace/${clientId}/analyst-wizard`} className="btn btn-ghost">
          <Icon name="arrow-left" size={14} />
          All worksheets
        </Link>
      </div>
    </section>
  );
}
