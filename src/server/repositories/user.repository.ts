export { MongoUserRepository as UserRepository } from './mongo/user.repository';
import { MongoUserRepository } from './mongo/user.repository';
export const userRepository = new MongoUserRepository();
