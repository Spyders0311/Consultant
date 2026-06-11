/**
 * Static read-only table for review steps that confirm grid input
 * (the 4-year comparison wizards).
 */
export default function ReviewTable({ rows, columns }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`review-${index + 1}`}>
              {columns.map((column) => (
                <td key={column.key}>{column.format ? column.format(row[column.key]) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
