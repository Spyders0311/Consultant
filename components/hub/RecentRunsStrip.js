'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';

function relativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * "Continue where you left off" — latest saved runs across every worksheet.
 * Renders nothing while loading or when the client has no saved runs yet.
 */
export default function RecentRunsStrip({ clientId, sheetNames }) {
  const [runs, setRuns] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/worksheets/recent-runs?client_id=${clientId}&limit=6`);
        const data = await response.json();
        if (!cancelled && response.ok && data.ok) {
          setRuns(data.runs);
        }
      } catch {
        // The hub works fine without the strip.
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!runs?.length) {
    return null;
  }

  return (
    <section className="recent-runs" aria-label="Recent runs">
      <h3>Continue where you left off</h3>
      <div className="recent-runs-strip">
        {runs.map((run) => (
          <Link
            key={`${run.sheetKey}-${run.runId}`}
            href={`/workspace/${clientId}/analyst-wizard/sheets/${run.sheetKey}`}
            className="recent-run-card"
          >
            <Icon name="clock" size={14} />
            <span className="recent-run-name">{sheetNames[run.sheetKey] || run.sheetKey}</span>
            <span className="recent-run-time">{relativeTime(run.createdAt)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
