export type { BlogListResult } from './mongo/blog.repository';
export { MongoBlogRepository } from './mongo/blog.repository';
import { MongoBlogRepository } from './mongo/blog.repository';
export const blogRepository = new MongoBlogRepository();
