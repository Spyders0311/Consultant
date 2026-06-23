import { createEngineCalculateHandler } from '@/lib/server/pythonEngineProxy';

export const POST = createEngineCalculateHandler('/api/v1/worksheets/roi-analysis/calculate');
