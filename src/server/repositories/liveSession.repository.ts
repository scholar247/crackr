export { MongoLiveSessionRepository as LiveSessionRepository } from './mongo/liveSession.repository';
import { MongoLiveSessionRepository } from './mongo/liveSession.repository';
export const liveSessionRepository = new MongoLiveSessionRepository();
