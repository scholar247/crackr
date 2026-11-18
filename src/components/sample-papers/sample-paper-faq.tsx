import { ChevronDown } from 'lucide-react';
import { JsonLd } from '@/components/exam-landing/shared/json-ld';
import { faqJsonLd, type Faq } from './seo';

// Native <details> accordion (no JS needed, answers stay in the HTML for crawlers) plus
// matching FAQPage structured data.
export function SamplePaperFaq({ title, faqs }: { title: string; faqs: Faq[] }) {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-32">
      <h2 id="faq-heading" className="text-headline-md text-foreground">
        {title}
      </h2>
      <div className="mt-5 divide-y divide-border rounded-2xl border border-border bg-card">
        {faqs.map((f) => (
          <details key={f.question} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground">
              <h3 className="text-body-md font-medium">{f.question}</h3>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="text-body-md mt-3 text-muted-foreground">{f.answer}</p>
          </details>
        ))}
      </div>
      <JsonLd data={faqJsonLd(faqs)} />
    </section>
  );
}
