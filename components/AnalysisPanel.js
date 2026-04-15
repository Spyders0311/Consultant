'use client';

import { useState } from 'react';

export default function AnalysisPanel() {
  const [inputs, setInputs] = useState({
    hours: 40,
    hourlyRate: 200,
    complexityIndex: 1.2,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function onInputChange(event) {
    const { name, value } = event.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  }

  async function runCalculation(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/formulas/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: Number(inputs.hours),
          hourlyRate: Number(inputs.hourlyRate),
          complexityIndex: Number(inputs.complexityIndex),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate analysis score.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadReport() {
    if (!result) {
      setError('Run calculation before generating a PDF report.');
      return;
    }

    setError('');
    const response = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'BMS Analysis Report',
        summary: result,
      }),
    });

    if (!response.ok) {
      setError('Unable to generate report PDF.');
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bms-analysis-report.pdf';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <form onSubmit={runCalculation}>
        <div className="input-row">
          <label>
            Hours
            <input
              type="number"
              min="0"
              step="1"
              name="hours"
              value={inputs.hours}
              onChange={onInputChange}
            />
          </label>

          <label>
            Hourly Rate
            <input
              type="number"
              min="0"
              step="1"
              name="hourlyRate"
              value={inputs.hourlyRate}
              onChange={onInputChange}
            />
          </label>

          <label>
            Complexity Index
            <input
              type="number"
              min="0"
              step="0.1"
              name="complexityIndex"
              value={inputs.complexityIndex}
              onChange={onInputChange}
            />
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Calculating...' : 'Run Protected Analysis'}
        </button>
      </form>

      {result ? (
        <div className="result">
          <strong>Backend Result:</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          <button type="button" onClick={downloadReport}>
            Generate Printable PDF
          </button>
        </div>
      ) : null}

      {error ? <p>{error}</p> : null}
    </>
  );
}
