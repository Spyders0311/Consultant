function cleanText(value) {
  return String(value || '').trim();
}

const config = {
  key: 'basic-client-info',
  kicker: 'Analyst Program',
  title: 'Basic Client Info',
  description:
    'Capture and normalize core client profile details, save run history, and export a PDF snapshot.',
  source: null,
  api: {
    calculate: '/api/worksheets/basic-client-info/calculate',
    runs: '/api/worksheets/basic-client-info/runs',
  },
  pdf: { model: 'basic-client-info', filename: 'bms-basic-client-info-report.pdf' },
  submitLabel: 'Calculate+Save',
  initialOverrides: (initialData) => ({
    companyName: initialData?.companyName || '',
    industry: initialData?.industry || '',
  }),
  fields: {
    companyName: { label: 'Company Name', type: 'text', placeholder: 'Acme Services LLC' },
    industry: { label: 'Industry', type: 'text', placeholder: 'Commercial Services' },
    locationCity: { label: 'Location City', type: 'text', placeholder: 'Chicago' },
    locationState: { label: 'Location State', type: 'text', placeholder: 'IL' },
    primaryContactName: { label: 'Primary Contact Name', type: 'text', placeholder: 'Jane Doe' },
    primaryContactEmail: { label: 'Primary Contact Email', type: 'email', placeholder: 'jane@acme.com' },
    primaryContactPhone: { label: 'Primary Contact Phone', type: 'text', placeholder: '(312) 555-0100' },
    notes: {
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Optional context for consultant prep.',
      fullWidth: true,
    },
  },
  steps: [
    {
      id: 'company',
      title: 'Company Profile',
      hint: 'Set core company and location details.',
      fieldNames: ['companyName', 'industry', 'locationCity', 'locationState'],
      validate: (form) => cleanText(form.companyName).length > 0 || cleanText(form.industry).length > 0,
    },
    {
      id: 'contact',
      title: 'Primary Contact',
      hint: 'Capture who we should coordinate with.',
      fieldNames: ['primaryContactName', 'primaryContactEmail', 'primaryContactPhone', 'notes'],
      validate: (form) =>
        cleanText(form.primaryContactName).length > 0 ||
        cleanText(form.primaryContactEmail).length > 0 ||
        cleanText(form.primaryContactPhone).length > 0,
    },
    {
      id: 'review',
      title: 'Review & Run',
      hint: 'Generate normalized output and save run.',
      fieldNames: [
        'companyName',
        'industry',
        'primaryContactName',
        'primaryContactEmail',
        'primaryContactPhone',
        'locationCity',
        'locationState',
        'notes',
      ],
    },
  ],
  results: {
    render: (result) => (
      <>
        <h2 style={{ marginTop: 0 }}>Normalized Summary</h2>
        <div className="wizard-kpis">
          <article>
            <span>Company</span>
            <strong>{result.companyName || 'n/a'}</strong>
          </article>
          <article>
            <span>Industry</span>
            <strong>{result.industry || 'n/a'}</strong>
          </article>
          <article>
            <span>Primary Contact</span>
            <strong>{result.primaryContactName || 'n/a'}</strong>
          </article>
          <article>
            <span>Location</span>
            <strong>{[result.locationCity, result.locationState].filter(Boolean).join(', ') || 'n/a'}</strong>
          </article>
        </div>

        <div className="card" style={{ marginBottom: 10 }}>
          <h3 style={{ marginTop: 0 }}>Summary Block</h3>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {result.summaryBlock || 'n/a'}
          </pre>
        </div>

        {Array.isArray(result.warnings) && result.warnings.length > 0 ? (
          <ul className="warnings">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="wizard-meta" style={{ marginTop: 0 }}>
            No contact warnings.
          </p>
        )}
      </>
    ),
  },
  history: {},
};

export default config;
