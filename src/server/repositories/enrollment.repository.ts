export { MongoEnrollmentRepository as EnrollmentRepository } from './mongo/enrollment.repository';
import { MongoEnrollmentRepository } from './mongo/enrollment.repository';
export const enrollmentRepository = new MongoEnrollmentRepository();
