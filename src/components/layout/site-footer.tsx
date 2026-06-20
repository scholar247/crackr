'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, MessageCircle, Send, Globe } from 'lucide-react';

/**
 * Footer visibility rules
 *
 * ── Show footer on ──
 *   - Exact paths listed in `SHOW_EXACT`
 *   - Anything starting with a prefix in `SHOW_PREFIXES`
 *
 * ── Hide footer on ──
 *   - Exact paths in `HIDE_EXACT`     (overrides show rules)
 *   - Prefix matches in `HIDE_PREFIXES` (overrides show rules)
 *
 * Add or remove entries here as the site grows — no per-page wiring needed.
 */

const SHOW_EXACT = new Set<string>([
  '/',
  '/subjects',
  '/exams',
  '/pyp',
  '/courses',
  '/courses/nimcet',
  '/sign-in',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
]);

const SHOW_PREFIXES: string[] = [
  '/subjects/',
  '/exams/',
  '/pyp/',
  // public marketing course pages (NOT enrolled/learn views)
];

const HIDE_EXACT = new Set<string>([]);

const HIDE_PREFIXES: string[] = [
  '/dashboard',
  '/admin',
  '/teacher',
  '/practice',
  '/mocks',
  '/tests',
  '/progress',
  '/settings',
  '/help',
  '/syllabus',
  '/study-plan',
  '/my-courses',
  '/onboarding',
  '/exam',
  '/nimcet',
  // Enrolled course player lives at /courses/<id>/learn — hide there
  '/courses/', // hidden by default for any nested course view
];

function shouldShowFooter(pathname: string): boolean {
  // Hide rules win over show rules
  if (HIDE_EXACT.has(pathname)) return false;
  if (HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    // Allow the public marketing pages that are also under /courses/
    if (pathname === '/courses' || pathname === '/courses/nimcet') return true;
    return false;
  }

  if (SHOW_EXACT.has(pathname)) return true;
  if (SHOW_PREFIXES.some((p) => pathname.startsWith(p))) return true;

  return false;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (!shouldShowFooter(pathname)) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Top grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center shrink-0 mb-3">
              <NextImage
                src="/logo.svg"
                alt="scholar247"
                width={144}
                height={30}
                className="dark:invert"
              />
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Learn, practice, progress, crack — the modern toolkit for serious
              exam preparation. Built for JEE, NEET, NIMCET, UPSC and more.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <SocialLink href="https://twitter.com" label="Twitter / X">
                <Send className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="https://linkedin.com" label="LinkedIn">
                <Globe className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="https://discord.gg" label="Discord">
                <MessageCircle className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="mailto:hello@scholar247.org" label="Email">
                <Mail className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          {/* Explore */}
          <FooterColumn title="Explore">
            <FooterLink href="/subjects">Subjects</FooterLink>
            <FooterLink href="/exams">Exams</FooterLink>
            <FooterLink href="/pyp">Previous Year Papers</FooterLink>
            <FooterLink href="/courses">Courses</FooterLink>
          </FooterColumn>

          {/* Product */}
          <FooterColumn title="Product">
            <FooterLink href="/dashboard">Dashboard</FooterLink>
            <FooterLink href="/practice">Practice</FooterLink>
            <FooterLink href="/mocks">Mock Tests</FooterLink>
            <FooterLink href="/progress">Progress</FooterLink>
          </FooterColumn>

          {/* Company */}
          <FooterColumn title="Company">
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </FooterColumn>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} scholar247. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with care for learners — Learn · Practice · Progress · Crack
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-3">
        {title}
      </h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
    >
      {children}
    </a>
  );
}

