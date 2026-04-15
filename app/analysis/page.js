import AnalysisPanel from '../../components/AnalysisPanel';

export default function AnalysisPage() {
  return (
    <section className="panel">
      <h2>Analysis</h2>
      <p>
        Enter engagement inputs below. All proprietary formulas are executed only on
        backend API routes for IP protection.
      </p>
      <AnalysisPanel />
    </section>
  );
}
