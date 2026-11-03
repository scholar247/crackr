// The sample databases a user can open in the SQL playground. This list is also the
// server's whitelist: the API only ever loads a template whose id appears here, so the id
// can never be used to read an arbitrary file.
export interface SqlTemplate {
  id: string;
  name: string;
  description: string;
}

export const SQL_TEMPLATES: SqlTemplate[] = [
  { id: 'blank', name: 'Blank Database', description: 'An empty database. Create your own tables from scratch.' },
  { id: 'northwind', name: 'Northwind', description: 'The classic trading sample: customers, orders, products and suppliers.' },
  { id: 'ecommerce', name: 'E-commerce', description: 'An online store: products, orders, payments, shipments and reviews.' },
  { id: 'banking', name: 'Banking', description: 'Branches, customers, accounts, cards, loans and transfers.' },
  { id: 'company', name: 'Company', description: 'Departments, employees, projects, salaries and assignments.' },
  { id: 'hr_management', name: 'HR Management', description: 'Employees, attendance, leave requests, payroll and reviews.' },
  { id: 'college', name: 'College', description: 'Departments, students, faculty, courses and the library.' },
  { id: 'university', name: 'University', description: 'Students, faculty, courses, sections, exams and results.' },
  { id: 'studentportal', name: 'Student Portal', description: 'Student profiles, academic records, attendance and fees.' },
  { id: 'librarysystem', name: 'Library', description: 'Books, members, issues, fines and book requests.' },
  { id: 'hospital', name: 'Hospital', description: 'Doctors, patients, appointments, prescriptions and bills.' },
  { id: 'hotel_management', name: 'Hotel Management', description: 'Hotels, rooms, guests, bookings and services.' },
  { id: 'movie_booking', name: 'Movie Booking', description: 'Movies, theaters, shows, seats and tickets.' },
  { id: 'airway', name: 'Airways', description: 'Airlines, flights, passengers, reservations and crew.' },
  { id: 'social_media', name: 'Social Media', description: 'Users, posts, comments, likes, friendships and groups.' },
];

export const SQL_TEMPLATE_IDS = SQL_TEMPLATES.map((t) => t.id) as [string, ...string[]];

export function findSqlTemplate(id: string): SqlTemplate | undefined {
  return SQL_TEMPLATES.find((t) => t.id === id);
}

// Keep in sync with the server limits in src/server/services/sql-playground/executor.ts.
export const SQL_MAX_LENGTH = 50_000;
export const SQL_MAX_ROWS = 1_000;
export const SQL_TIMEOUT_MS = 5_000;
