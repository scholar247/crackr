'use client';

import { useState } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DIFFICULTY_COLORS, cn } from '@/lib/utils';

interface Option {
  key: string;
  text: string;
  isCorrect: boolean;
}

export function ConceptCheckCard({
  stem,
  options,
  explanation,
  difficulty,
}: {
  stem: string;
  options: Option[];
  explanation?: string | null;
  difficulty: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Concept Check</p>
        <Badge className={cn('ml-auto', DIFFICULTY_COLORS[difficulty])}>{difficulty}</Badge>
      </div>

      <p className="mt-4 text-sm font-medium text-foreground">{stem}</p>

      <div className="mt-4 space-y-2">
        {options.map((option) => {
          const isSelected = selected === option.key;
          const showResult = selected !== null;
          return (
            <button
              key={option.key}
              type="button"
              disabled={showResult}
              onClick={() => setSelected(option.key)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors',
                !showResult && 'border-border hover:border-primary/40 hover:bg-muted/40',
                showResult && option.isCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                showResult && isSelected && !option.isCorrect && 'border-destructive/50 bg-destructive/10',
                showResult && !isSelected && !option.isCorrect && 'border-border opacity-60'
              )}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-medium">
                {option.key}
              </span>
              <span className="flex-1 text-foreground">{option.text}</span>
              {showResult && option.isCorrect && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
              {showResult && isSelected && !option.isCorrect && <X className="h-4 w-4 shrink-0 text-destructive" />}
            </button>
          );
        })}
      </div>

      {selected !== null && explanation && (
        <p className="mt-4 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{explanation}</p>
      )}
    </div>
  );
}
