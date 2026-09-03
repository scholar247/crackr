import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { SITE_NAME } from '@/lib/site-config';

// Real names, real LinkedIn profiles — deliberately not framed as "instructors," since
// their public backgrounds are software engineering, not exam coaching. The honest claim
// is "we're the engineers who built this," not "we teach the syllabus."
const TEAM = [
  {
    name: 'Shivam Pradhan',
    role: 'Founder & Engineer',
    bio: 'Engineering builder across Kredivo Indonesia, PhonePe, Dailyhunt/Josh and Naukri.com — Info Edge. MNNIT Allahabad alum. Started building this to fix his own NIMCET/GATE prep experience.',
    linkedin: 'https://in.linkedin.com/in/scholar-shivam',
  },
  {
    name: 'Komal Agarwal',
    role: 'Engineering',
    bio: 'Software Engineer at Apollo247. MNNIT Allahabad alum.',
    linkedin: 'https://in.linkedin.com/in/komal-agarwal-50510a147',
  },
  {
    name: 'Saumya Pradhan',
    role: 'Engineering',
    bio: "RPA developer background at Accenture; MS from The University of Texas at Austin.",
    linkedin: 'https://in.linkedin.com/in/saumya-pradhan-718442105',
  },
];

export function Team() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-label-caps uppercase tracking-wider text-primary">Who&apos;s Building This</span>
          <h2 className="text-headline-lg mt-2 text-foreground">Founders &amp; Team</h2>
          <p className="text-body-md mx-auto mt-2 max-w-xl text-muted-foreground">
            {SITE_NAME} is built by a small team of engineers, not a content mill — every one of us has either sat for
            one of these exams or built the systems behind large-scale products.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {TEAM.map((member) => (
            <div key={member.name} className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-body-md font-semibold text-foreground">{member.name}</p>
                  <p className="text-body-sm text-primary">{member.role}</p>
                </div>
                <Link
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on LinkedIn`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <p className="text-body-sm mt-3 text-muted-foreground">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
