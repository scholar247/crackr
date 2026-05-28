import type { MCQClient } from '@/types';

export interface MCQListResult {
  items: MCQClient[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export { MongoMCQRepository as MCQRepository } from './mongo/mcq.repository';
import { MongoMCQRepository } from './mongo/mcq.repository';
export const mcqRepository = new MongoMCQRepository();
