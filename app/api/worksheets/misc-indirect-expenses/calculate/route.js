import { createEngineCalculateHandler } from '@/lib/server/pythonEngineProxy';

export const POST = createEngineCalculateHandler('/api/v1/worksheets/misc-indirect-expenses/calculate');
