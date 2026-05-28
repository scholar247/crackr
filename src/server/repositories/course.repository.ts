export { MongoCourseRepository as CourseRepository } from './mongo/course.repository';
import { MongoCourseRepository } from './mongo/course.repository';
export const courseRepository = new MongoCourseRepository();
