import Link from 'next/link';
import { ArrowRight, Database, FilePlus2 } from 'lucide-react';
import { SQL_TEMPLATES } from '@/lib/sql-playground/templates';

export function DatabaseSelector() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {SQL_TEMPLATES.map((template) => {
        const Icon = template.id === 'blank' ? FilePlus2 : Database;
        return (
          <Link
            key={template.id}
            href={`/sql-playground/${template.id}`}
            className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/60 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-foreground">{template.name}</h2>
                <p className="text-xs text-muted-foreground">SQLite</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{template.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
