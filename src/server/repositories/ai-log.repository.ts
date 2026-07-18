export type { CreateLogInput } from './mongo/ai-log.repository';
export { MongoAILogRepository } from './mongo/ai-log.repository';
import { MongoAILogRepository } from './mongo/ai-log.repository';
export const aiLogRepository = new MongoAILogRepository();
