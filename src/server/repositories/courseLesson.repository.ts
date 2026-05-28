export { MongoCourseLessonRepository as CourseLessonRepository } from './mongo/courseLesson.repository';
import { MongoCourseLessonRepository } from './mongo/courseLesson.repository';
export const courseLessonRepository = new MongoCourseLessonRepository();
