'use client';

import { useMemo, useState } from 'react';
import WorksheetInput from '@/components/worksheet/WorksheetInput';
import { MATRIX_CONFIGS } from '@/lib/worksheets/matrixConfigs';
import useWorksheetShellForm from '@/lib/client/useWorksheetShellForm';

export default function MatrixQuestionnaireWizard({ clientId, sheetKey }) {
  const config = MATRIX_CONFIGS[sheetKey];
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const shellForm = useMemo(() => ({ responses }), [responses]);
  useWorksheetShellForm(shellForm);

  async function score() {
    setLoading(true);
    setError('');
    try {
      let sourceResponses = [];
      if (config.derivedFrom?.length) {
        for (const sourceKey of config.derivedFrom) {
          const res = await fetch(
            `/api/worksheets/matrix-questionnaire/runs?client_id=${encodeURIComponent(clientId)}&matrix_key=${sourceKey}&limit=1`,
          );
          const data = await res.json();
          const outputs = data.runs?.[0]?.outputs;
          if (outputs?.categoryScores) sourceResponses.push(...outputs.categoryScores);
        }
      }

      const response = await fetch('/api/worksheets/matrix-scoring/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matrixKey: sheetKey,
          questions: config.questions,
          responses,
          sourceResponses,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Scoring failed.');
      setResult(data.result);

      if (clientId && config.questions?.length) {
        await fetch('/api/worksheets/matrix-questionnaire/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            matrix_key: sheetKey,
            inputs: { responses },
            outputs: data.result,
          }),
        });
      }
    } catch (err) {
      setError(err.message || 'Unable to score matrix.');
    } finally {
      setLoading(false);
    }
  }

  if (config.derivedFrom?.length && !config.questions?.length) {
    return (
      <section className="wizard-shell">
        <header className="wizard-header">
          <h1>{config.title}</h1>
          <p>Aggregated from: {config.derivedFrom.join(', ')}</p>
        </header>
        <button type="button" disabled={loading} onClick={score}>
          {loading ? 'Loading...' : 'Generate from source questionnaires'}
        </button>
        {error ? <p className="wizard-error">{error}</p> : null}
        {result ? (
          <div className="wizard-kpis">
            <article>
              <span>Overall Score</span>
              <strong>{result.scorePct}%</strong>
            </article>
            {(result.categoryScores || []).map((row) => (
              <article key={row.category}>
                <span>{row.category}</span>
                <strong>{row.scorePct}%</strong>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <h1>{config.title}</h1>
      </header>
      {config.questions.map((question) => (
        <label key={question.id} className="wizard-field">
          <span>{question.label}</span>
          <select
            value={responses[question.id] || ''}
            onChange={(e) => setResponses((prev) => ({ ...prev, [question.id]: e.target.value }))}
          >
            <option value="">Select...</option>
            <option value="1">1 - Poor</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5 - Excellent</option>
          </select>
        </label>
      ))}
      <button type="button" disabled={loading} onClick={score}>
        {loading ? 'Scoring...' : 'Score & Save'}
      </button>
      {error ? <p className="wizard-error">{error}</p> : null}
      {result ? (
        <p className="wizard-meta">
          Score: {result.scorePct}% ({result.totalScore}/{result.maxScore})
        </p>
      ) : null}
    </section>
  );
}
