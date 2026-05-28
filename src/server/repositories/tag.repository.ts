export { MongoTagRepository as TagRepository } from './mongo/tag.repository';
import { MongoTagRepository } from './mongo/tag.repository';
export const tagRepository = new MongoTagRepository();
