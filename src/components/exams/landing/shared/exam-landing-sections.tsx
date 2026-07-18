import Link from 'next/link';
import type { ComponentType } from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/**
 * Presentational building blocks shared by every custom exam landing page.
 * "Custom landing page" means custom copy, data, and section order per exam —
 * not custom markup for a hero/FAQ/CTA that looks the same everywhere. These
 * stay server-renderable (no 'use client'): the only client-side leaf is the
 * pre-built Accordion, imported as-is rather than re-implemented here.
 */

export function ExamHero({
  eyebrow,
  title,
  description,
  primaryCtaLabel = 'Start Practicing Free',
  primaryCtaHref = '#practice',
  secondaryCtaLabel,
  secondaryCtaHref,
  stats,
}: {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  stats: { label: string; value: string }[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <Badge variant="secondary" className="mb-4">
          {eyebrow}
        </Badge>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
          {title}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href={primaryCtaHref}>
              {primaryCtaLabel}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
          {secondaryCtaLabel && secondaryCtaHref && (
            <Button asChild variant="outline" size="lg">
              <Link href={secondaryCtaHref}>{secondaryCtaLabel}</Link>
            </Button>
          )}
        </div>
        <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="text-2xl font-bold tracking-tight">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function ExamHighlights({
  title,
  items,
}: {
  title: string;
  items: { icon: ComponentType<{ className?: string }>; title: string; description: string }[];
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
      <h2 className="text-2xl font-bold tracking-tight mb-8">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function ExamSyllabus({
  title,
  groups,
}: {
  title: string;
  groups: { name: string; topics: string[]; weight?: string }[];
}) {
  return (
    <section className="bg-muted/30 border-y border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-bold tracking-tight mb-8">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Card key={group.name}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-semibold">{group.name}</h3>
                  {group.weight && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {group.weight}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.topics.map((topic) => (
                    <span
                      key={topic}
                      className="text-xs rounded-full bg-background border border-border px-2.5 py-1 text-muted-foreground"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export interface ExamFaqItem {
  question: string;
  answer: string;
}

/**
 * Renders the FAQ accordion and emits matching FAQPage JSON-LD in the same
 * place, so the visible copy and the structured data can never drift apart.
 */
export function ExamFaq({ title, items }: { title: string; items: ExamFaqItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14">
      <h2 className="text-2xl font-bold tracking-tight mb-6">{title}</h2>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={item.question} value={`faq-${i}`}>
            <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}

export function ExamFinalCta({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <section className="border-t border-border bg-primary/5">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        <p className="mt-3 text-muted-foreground">{description}</p>
        <Button asChild size="lg" className="mt-6">
          <Link href={ctaHref}>
            {ctaLabel}
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
