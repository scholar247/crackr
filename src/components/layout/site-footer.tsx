import Link from 'next/link';
import { Mail, MessageCircle, Send, Globe } from 'lucide-react';
import { Logo } from './logo';
import { SITE_NAME, SITE_EMAIL } from '@/lib/site-config';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <Link href="/" className="mb-3 flex shrink-0 items-center">
              <Logo width={144} height={30} />
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">
              Learn, practice, progress, crack — the modern toolkit for serious exam preparation.
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
              <SocialLink href={`mailto:${SITE_EMAIL}`} label="Email">
                <Mail className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          <FooterColumn title="Explore">
            <FooterLink href="/exams">Exams</FooterLink>
            <FooterLink href="/blogs">Blog</FooterLink>
          </FooterColumn>

          <FooterColumn title="Company">
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
            <FooterLink href="/privacy-policy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">© {year} {SITE_NAME}. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Learn · Practice · Progress · Crack</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">{title}</h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
    >
      {children}
    </a>
  );
}
