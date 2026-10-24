import { ChevronDown, HelpCircle } from 'lucide-react';
import { LandingSection, SectionHeader } from './section-header';

export interface Faq {
  question: string;
  answer: string;
}

// Native <details> accordion (works without JS) plus FAQPage structured data, so the same
// answers can surface in search results and answer engines.
export function FaqSection({ id = 'faq', title, faqs }: { id?: string; title: string; faqs: Faq[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };

  return (
    <LandingSection id={id}>
      <SectionHeader eyebrow="FAQ" icon={<HelpCircle className="h-3.5 w-3.5" />} title={title} />
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {faqs.map((f) => (
          <details key={f.question} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground">
              {f.question}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="text-body-md mt-3 text-muted-foreground">{f.answer}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </LandingSection>
  );
}
