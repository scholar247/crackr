import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Target, Users, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about scholar247 — the free EdTech platform built to help students crack competitive exams like JEE, NEET, NIMCET, UPSC and more.',
};

const pillars = [
  {
    icon: BookOpen,
    title: 'Comprehensive Content',
    body: 'Thousands of MCQs across subjects, mapped to the exact syllabus of each exam — authored and reviewed by subject-matter experts.',
  },
  {
    icon: Target,
    title: 'Exam-Focused Practice',
    body: 'Practice by exam, subject, topic, or difficulty. Filter previous year papers and attempt full-length mocks timed to the real exam pattern.',
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    body: 'Detailed explanations with every answer. Track accuracy, time per question, and weak areas across every session.',
  },
  {
    icon: Users,
    title: 'Built for Every Student',
    body: 'Free to use, no paywalls on practice. Whether you are starting out or giving one last attempt, scholar247 is here.',
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">About scholar247</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We believe every student deserves access to high-quality exam preparation — free of cost.
          scholar247 is built to make that a reality.
        </p>
      </section>

      {/* Mission */}
      <section className="rounded-2xl border border-border bg-muted/30 p-8 space-y-3">
        <h2 className="text-2xl font-semibold">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed">
          Competitive exams are the gateway to top colleges and careers in India, yet quality preparation
          resources remain expensive and inaccessible for millions. Our mission is simple: level the
          playing field by putting the best practice tools in every student&apos;s pocket, completely free.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          We started with NIMCET and are rapidly expanding to cover JEE, NEET, UPSC, Banking, and
          more — building a single platform where students prepare smarter, not just harder.
        </p>
      </section>

      {/* Pillars */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">What We Offer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Start Practising Today</h2>
        <p className="text-muted-foreground">No sign-up required to explore. Create a free account to save progress.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/exams"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse Exams
          </Link>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Browse Subjects
          </Link>
        </div>
      </section>
    </div>
  );
}
