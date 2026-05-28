/**
 * Base repository types. Concrete implementations live in mongo/ subdirectory.
 * To add a new database backend, create a parallel <db>/ subdirectory and
 * update each repository's main file to import from it.
 */

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
