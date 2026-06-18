import TwelveMonthAnalysisWizard from '@/components/TwelveMonthAnalysisWizard';
import { TWELVE_MONTH_ANALYSIS_CONFIGS } from '@/lib/worksheets/twelveMonthAnalysisConfigs';

export default function TwelveMonthMaterialWizard({ clientId }) {
  return (
    <TwelveMonthAnalysisWizard clientId={clientId} config={TWELVE_MONTH_ANALYSIS_CONFIGS['12-month-analysis-material']} />
  );
}
