import type { Metadata } from 'next';
import { TerminalSquare } from 'lucide-react';
import { DatabaseSelector } from '@/components/sql-playground/database-selector';

export const metadata: Metadata = {
  title: 'SQL Playground',
  description: 'Practise SQL in your browser against ready-made sample databases.',
};

export default function SqlPlaygroundPage() {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <TerminalSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">SQL Playground</h1>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick a sample database and start writing queries. Every run starts from a fresh copy, so feel free to
          insert, update or drop anything.
        </p>
      </div>
      <DatabaseSelector />
    </div>
  );
}
