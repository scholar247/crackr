import { LayoutDashboard, GraduationCap, Newspaper, Settings, type LucideIcon } from 'lucide-react';
import type { UserRole } from '@/lib/roles';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const TEACHER_NAV: NavItem[] = [
  { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/curriculum', label: 'Curriculum & Exams', icon: GraduationCap },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper },
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
