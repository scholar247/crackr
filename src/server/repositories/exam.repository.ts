export { MongoExamRepository as ExamRepository } from './mongo/exam.repository';
import { MongoExamRepository } from './mongo/exam.repository';
export const examRepository = new MongoExamRepository();
