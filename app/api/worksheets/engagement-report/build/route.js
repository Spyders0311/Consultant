import { createEngineCalculateHandler } from '@/lib/server/pythonEngineProxy';

export const POST = createEngineCalculateHandler('/api/v1/worksheets/engagement-report/build');
