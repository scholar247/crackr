import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { meetsMinRole, assertInternalCallbackPath, type UserRole } from '@/lib/roles';

const PUBLIC_PATH_PREFIXES = [
  '/sign-in',
  '/api/auth',
  '/_next',
  '/favicon',
  // Crawlable / SEO files
  '/sitemap',
  '/robots.txt',
  // Public marketing site — accessible without login, must be indexed by Google
  '/exams',
  '/blogs',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms',
];

// Path prefix -> minimum role required to view it.
const ROLE_GATED_PREFIXES: [string, UserRole][] = [
  ['/admin', 'ADMIN'],
  ['/teacher', 'TEACHER'],
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname === '/' || PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // API routes enforce auth independently via requireAuth() at the route level (see
  // src/server/auth/require-auth.ts) — this is the same seam a future mobile client's
  // auth strategy would plug into, so the proxy deliberately stays out of the way here.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const signInUrl = new URL('/sign-in', req.url);
    const callbackPath = assertInternalCallbackPath(pathname);
    if (callbackPath) signInUrl.searchParams.set('callbackUrl', callbackPath);
    return NextResponse.redirect(signInUrl);
  }

  const userRole = session.user.role as UserRole;
  for (const [prefix, minRole] of ROLE_GATED_PREFIXES) {
    if (pathname.startsWith(prefix) && !meetsMinRole(userRole, minRole)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
