export { MongoCourseSubjectRepository as CourseSubjectRepository } from './mongo/courseSubject.repository';
import { MongoCourseSubjectRepository } from './mongo/courseSubject.repository';
export const courseSubjectRepository = new MongoCourseSubjectRepository();
