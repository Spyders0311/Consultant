/** Worksheet source keys → latest-run API endpoints for stale-field detection. */
import { buildSourceRunEndpoints } from '@/lib/worksheets/worksheetRunRegistry';

export const SOURCE_RUN_ENDPOINTS = buildSourceRunEndpoints();

// Legacy aliases used by older snapshot prefill lookups.
SOURCE_RUN_ENDPOINTS['twelve-month-analysis-payroll'] =
  SOURCE_RUN_ENDPOINTS['12-month-analysis-payroll'];
SOURCE_RUN_ENDPOINTS['twelve-month-analysis-direct-labor'] =
  SOURCE_RUN_ENDPOINTS['12-month-analysis-direct-labor'];
SOURCE_RUN_ENDPOINTS['twelve-month-analysis-material'] =
  SOURCE_RUN_ENDPOINTS['12-month-analysis-material'];
SOURCE_RUN_ENDPOINTS['twelve-month-analysis-operating-exp'] =
  SOURCE_RUN_ENDPOINTS['12-month-analysis-operating-exp'];
SOURCE_RUN_ENDPOINTS['twelve-month-pl-comparisons'] =
  SOURCE_RUN_ENDPOINTS['12-month-p-l-comparisons'];
