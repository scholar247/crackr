export type { SeedListResult, CreateSeedInput } from './mongo/ai-seed.repository';
export { MongoContentSeedRepository } from './mongo/ai-seed.repository';
import { MongoContentSeedRepository } from './mongo/ai-seed.repository';
export const contentSeedRepository = new MongoContentSeedRepository();
