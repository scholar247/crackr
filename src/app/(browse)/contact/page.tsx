import type { Metadata } from 'next';
import { Mail, MessageSquare, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the scholar247 team. We respond to all queries within 48 hours.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <section className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
        <p className="text-lg text-muted-foreground">
          Have a question, found a bug, or want to contribute content? We&apos;d love to hear from you.
        </p>
      </section>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border p-6 text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h3 className="font-semibold text-sm">Email</h3>
          <a
            href="mailto:join.scholar247@gmail.com"
            className="text-sm text-primary hover:underline break-all"
          >
            join.scholar247@gmail.com
          </a>
        </div>

        <div className="rounded-xl border border-border p-6 text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h3 className="font-semibold text-sm">Content &amp; Feedback</h3>
          <p className="text-sm text-muted-foreground">Report errors or suggest questions via email</p>
        </div>

        <div className="rounded-xl border border-border p-6 text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h3 className="font-semibold text-sm">Response Time</h3>
          <p className="text-sm text-muted-foreground">We reply within 48 hours on business days</p>
        </div>
      </div>

      {/* Topics */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What can we help with?</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            'Reporting an incorrect question or answer',
            'Requesting a new exam, subject, or topic',
            'Partnership or content contribution enquiries',
            'Technical bugs or account issues',
            'General feedback about the platform',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Direct CTA */}
      <section className="rounded-2xl border border-border bg-muted/30 p-8 text-center space-y-4">
        <h2 className="text-xl font-semibold">Send us a message</h2>
        <p className="text-sm text-muted-foreground">
          The fastest way to reach us is by email. Click below to open your mail client.
        </p>
        <a
          href="mailto:join.scholar247@gmail.com?subject=scholar247 Enquiry"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Mail className="h-4 w-4" />
          Email us
        </a>
      </section>
    </div>
  );
}
