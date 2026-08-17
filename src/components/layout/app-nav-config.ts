import { LayoutDashboard, GraduationCap, Newspaper, ListChecks, Users, Dumbbell, ClipboardList, Settings, type LucideIcon } from 'lucide-react';
import type { UserRole } from '@/lib/roles';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Communities is deliberately NOT here — it moved out of the authenticated dashboard
// shell into its own public route group (src/app/(communities)), linked from the site's
// main nav (see communities-header.tsx) instead of this sidebar.
const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mocks', label: 'Mock Tests', icon: ClipboardList },
  { href: '/practice', label: 'Practice', icon: Dumbbell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const TEACHER_NAV: NavItem[] = [
  { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mocks', label: 'Mock Tests', icon: ClipboardList },
  { href: '/practice', label: 'Practice', icon: Dumbbell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/curriculum', label: 'Curriculum & Exams', icon: GraduationCap },
  { href: '/admin/questions', label: 'Question Bank', icon: ListChecks },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper },
  { href: '/mocks', label: 'Mock Tests', icon: ClipboardList },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/practice', label: 'Practice', icon: Dumbbell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

// One role-aware config driving a single shell component, instead of three duplicated
// sidebar components (admin/student/teacher) each hand-maintaining their own link list.
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  STUDENT: STUDENT_NAV,
  TEACHER: TEACHER_NAV,
  ADMIN: ADMIN_NAV,
  SUPER_ADMIN: ADMIN_NAV,
};
