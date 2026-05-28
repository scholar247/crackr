export { MongoSubjectRepository as SubjectRepository } from './mongo/subject.repository';
import { MongoSubjectRepository } from './mongo/subject.repository';
export const subjectRepository = new MongoSubjectRepository();
