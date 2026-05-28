export { MongoCourseTopicRepository as CourseTopicRepository } from './mongo/courseTopic.repository';
import { MongoCourseTopicRepository } from './mongo/courseTopic.repository';
export const courseTopicRepository = new MongoCourseTopicRepository();
