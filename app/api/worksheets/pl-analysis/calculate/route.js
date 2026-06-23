import { createEngineCalculateHandler } from '@/lib/server/pythonEngineProxy';

export const POST = createEngineCalculateHandler('/api/v1/worksheets/pl-analysis/calculate');
