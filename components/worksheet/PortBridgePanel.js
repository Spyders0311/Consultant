'use client';

import { useState } from 'react';
import { getPortBridgesForWorksheet } from '@/lib/worksheets/portBridges';

export default function PortBridgePanel({ clientId, worksheetKey, onApplyPatch, label = 'Import from workbook port' }) {
  const bridges = getPortBridgesForWorksheet(worksheetKey);
  const [loadingKey, setLoadingKey] = useState('');
  const [error, setError] = useState('');
  const [audit, setAudit] = useState('');

  if (!bridges.length || !clientId) return null;

  async function importFromPort(portKey, bridge) {
    setLoadingKey(portKey);
    setError('');
    setAudit('');

    try {
      const response = await fetch(
        `/api/worksheets/workbook-ports/runs?client_id=${encodeURIComponent(clientId)}&workbook_key=${encodeURIComponent(portKey)}&limit=1`,
        { cache: 'no-store' },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to load port run.');

      const run = data.runs?.[0];
      if (!run) throw new Error(`No saved ${bridge.label} port run found.`);

      const patch = bridge.mapFromRun(run);
      if (!patch || Object.keys(patch).length === 0) {
        throw new Error('Port run has no mappable fields for this worksheet.');
      }

      await onApplyPatch(patch, portKey);
      setAudit(`Imported from ${portKey} run.`);
    } catch (err) {
      setError(err.message || 'Port import failed.');
    } finally {
      setLoadingKey('');
    }
  }

  return (
    <div className="port-bridge-panel">
      <p className="wizard-meta">{label}</p>
      <div className="wizard-history-actions">
        {bridges.map((bridge) => (
          <button
            key={bridge.portKey}
            type="button"
            className="ghost"
            disabled={Boolean(loadingKey)}
            onClick={() => importFromPort(bridge.portKey, bridge)}
          >
            {loadingKey === bridge.portKey ? 'Importing...' : bridge.portKey}
          </button>
        ))}
      </div>
      {audit ? <p className="wizard-meta">{audit}</p> : null}
      {error ? <p className="wizard-error">{error}</p> : null}
    </div>
  );
}
