import type { Metadata } from 'next';
import { Mail } from 'lucide-react';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Contact us</h1>
      <p className="mt-4 text-muted-foreground">Have a question, found a bug, or want to partner with us? Reach out.</p>
      <a
        href="mailto:hello@scholar247.org"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <Mail className="h-4 w-4" />
        hello@scholar247.org
      </a>
    </main>
  );
}
