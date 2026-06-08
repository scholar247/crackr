import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/types';

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes — never redirect
  if (
    pathname === '/' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    // Public browse pages — accessible without login
    pathname.startsWith('/exams') ||
    pathname.startsWith('/subjects') ||
    pathname.startsWith('/pyp') ||
    pathname.startsWith('/courses')
  ) {
    return NextResponse.next();
  }

  // API routes handle auth independently
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Not authenticated — redirect to sign-in
  if (!session?.user) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  const userRole = session.user.role as UserRole;
  const isAdmin = ADMIN_ROLES.includes(userRole);

  // Admin routes — require admin role
  if (pathname.startsWith('/admin')) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Onboarding gate is handled server-side in the student layout (reads Firestore
  // directly) so it is never stale. The proxy only enforces auth + role access.

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
