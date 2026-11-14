import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs, type Crumb } from '@/components/exam-landing/shared/breadcrumbs';

export interface RelatedLink {
  label: string;
  description: string;
  href: string;
}

// Frame for every sample-paper page: breadcrumbs (+ BreadcrumbList JSON-LD), the page's
// single H1 and intro, the body, then related links so no page is a dead end.
export function SamplePaperShell({
  crumbs,
  eyebrow,
  title,
  intro,
  aside,
  related,
  relatedTitle,
  children,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  intro: ReactNode;
  aside?: ReactNode;
  related: RelatedLink[];
  relatedTitle: string;
  children: ReactNode;
}) {
  return (
    <main>
      <header className="bg-background">
        <div className="mx-auto max-w-page px-4 pt-6 pb-8 sm:px-6 lg:px-8">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              {eyebrow && <p className="text-label-caps uppercase tracking-wider text-primary">{eyebrow}</p>}
              <h1 className="text-headline-xl mt-1 text-foreground max-sm:text-[2rem] max-sm:leading-10">{title}</h1>
              <div className="text-body-lg mt-3 text-muted-foreground">{intro}</div>
            </div>
            {aside}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-page space-y-12 px-4 pb-14 sm:px-6 lg:px-8">{children}</div>

      {related.length > 0 && (
        <section aria-labelledby="related-links" className="border-t border-border bg-surface-container-lowest">
          <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8">
            <h2 id="related-links" className="text-headline-md text-foreground">
              {relatedTitle}
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="group flex h-full items-start justify-between gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span>
                      <span className="block font-semibold text-foreground">{s.label}</span>
                      <span className="text-body-sm mt-1 block text-muted-foreground">{s.description}</span>
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}

/** Structured data block — `<` escaped so content can't close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
