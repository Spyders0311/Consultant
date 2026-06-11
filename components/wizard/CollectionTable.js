'use client';

import { InputControl } from '@/components/wizard/FieldGrid';

/**
 * Editable row-collection table (extracted from WorkbookPortWizard).
 * Set collection.fixedRows to hide add/remove and keep the row count static
 * (year grids, fixed week tables).
 */
export default function CollectionTable({ collection, rows, onRowChange, onAddRow, onRemoveRow, disabled }) {
  const editable = !collection.fixedRows;

  return (
    <section className="workbook-port-collection">
      <div className="workbook-port-collection-header">
        <h2>{collection.label}</h2>
        {editable ? (
          <button
            type="button"
            className="ghost"
            onClick={onAddRow}
            disabled={disabled || rows.length >= collection.maxRows}
          >
            Add {collection.rowLabel}
          </button>
        ) : null}
      </div>
      <div className="table-wrap worksheet-grid-table">
        <table>
          <thead>
            <tr>
              {collection.rowHeader ? <th>{collection.rowHeader}</th> : null}
              {collection.fields.map((field) => (
                <th key={field.name}>{field.label}</th>
              ))}
              {editable ? <th>Remove</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${collection.key}-${rowIndex + 1}`}>
                {collection.rowHeader ? <td>{`${collection.rowLabel} ${rowIndex + 1}`}</td> : null}
                {collection.fields.map((field) => (
                  <td key={field.name}>
                    <InputControl
                      field={field}
                      value={row[field.name]}
                      onChange={(value) => onRowChange(rowIndex, field.name, value)}
                      disabled={disabled}
                    />
                  </td>
                ))}
                {editable ? (
                  <td>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => onRemoveRow(rowIndex)}
                      disabled={disabled || rows.length <= (collection.minRows || 1)}
                    >
                      Remove
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
