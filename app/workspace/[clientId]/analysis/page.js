import { redirect } from 'next/navigation';
import ExecutiveAnalysisDashboard from '@/components/analysis/ExecutiveAnalysisDashboard';
import { createClient } from '@/lib/supabase/server';
import { isConsultant } from '@/lib/supabase/auth';
import { buildExecutiveAnalysis } from '@/lib/reports/executiveAnalysis';

export default async function WorkspaceAnalysisPage({ params }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!isConsultant(user)) {
    redirect('/login?error=unauthorized');
  }

  const { clientId } = await params;
  const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).maybeSingle();

  if (!client) {
    redirect('/dashboard/clients');
  }

  const report = await buildExecutiveAnalysis(supabase, clientId);

  return <ExecutiveAnalysisDashboard report={report} clientId={clientId} />;
}
