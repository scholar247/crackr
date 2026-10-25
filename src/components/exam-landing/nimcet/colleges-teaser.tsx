import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingSection, SectionHeader } from '@/components/exam-landing/shared/section-header';
import { OfficialSourceNote } from '@/components/exam-landing/shared/source-note';
import { NIMCET_PATH } from '@/content/exams/nimcet/guidance';
import { INSTITUTES_2026, instituteSeats } from '@/content/exams/nimcet/official';

export function CollegesTeaser() {
  const { institutes, totalSeats, year } = INSTITUTES_2026;
  return (
    <LandingSection id="colleges" muted>
      <SectionHeader
        eyebrow="Colleges"
        icon={<Building2 className="h-3.5 w-3.5" />}
        title="NITs and IIITs that admit through NIMCET"
        description={`For ${year}–${String(year + 1).slice(2)} admissions: ${institutes.length} institutes and ${totalSeats.toLocaleString('en-IN')} MCA seats in total.`}
        action={
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href={`${NIMCET_PATH}/colleges`}>
              Seats and fees <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
      <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {institutes.map((i) => (
          <li key={i.slug}>
            <Link
              href={`${NIMCET_PATH}/colleges#${i.slug}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span>
                <span className="block font-medium text-foreground">{i.name}</span>
                <span className="text-body-sm text-muted-foreground">{i.city}</span>
              </span>
              <span className="text-body-sm shrink-0 tabular-nums text-muted-foreground">{instituteSeats(i)} seats</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <OfficialSourceNote source={INSTITUTES_2026.source} />
        <Link href={`${NIMCET_PATH}/admission-counselling`} className="text-sm font-semibold text-primary hover:underline">
          How admission and counselling work →
        </Link>
      </div>
    </LandingSection>
  );
}
