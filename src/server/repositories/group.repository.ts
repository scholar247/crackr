export { MongoGroupRepository as GroupRepository } from './mongo/group.repository';
import { MongoGroupRepository } from './mongo/group.repository';
export const groupRepository = new MongoGroupRepository();
