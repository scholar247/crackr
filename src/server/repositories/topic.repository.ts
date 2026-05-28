export { MongoTopicRepository as TopicRepository } from './mongo/topic.repository';
import { MongoTopicRepository } from './mongo/topic.repository';
export const topicRepository = new MongoTopicRepository();
