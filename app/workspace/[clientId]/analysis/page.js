import AnalysisPanel from '@/components/AnalysisPanel';

export default function WorkspaceAnalysisPage() {
  return (
    <section className="panel">
      <h2>Analysis</h2>
      <p>
        Analysis worksheet. Enter the core financial inputs for this client. Proprietary math stays server-side for IP
        protection.
      </p>
      <AnalysisPanel />
    </section>
  );
}
