'use client';

import { useState, type ReactNode } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizOption {
  key: string;
  text: string;
}

interface QuizPreviewCardProps {
  /** Small tag above the question — a subject name ("Mathematics") or a status tag ("Live Challenge"). */
  eyebrow: string;
  eyebrowIcon?: ReactNode;
  /** Rendered as a tinted "01:30 Timed" badge when `timedBadge` is true, otherwise quiet text. */
  timer: string;
  timedBadge?: boolean;
  /** Only exam-page usage has a title separate from the eyebrow tag. */
  title?: string;
  question: ReactNode;
  options: QuizOption[];
  /** Key of the correct option — selecting it reveals the solution; anything else just marks wrong. */
  correctKey: string;
  solution?: ReactNode;
  /** Gradient top border + tag-pill eyebrow styling, used on exam landing pages. */
  glow?: boolean;
  className?: string;
}

export function QuizPreviewCard({
  eyebrow,
  eyebrowIcon,
  timer,
  timedBadge = false,
  title,
  question,
  options,
  correctKey,
  solution,
  glow = false,
  className,
}: QuizPreviewCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const answeredCorrectly = selected === correctKey;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl transition-colors hover:border-primary/30',
        glow && 'glow-top-border',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <span
          className={cn(
            'inline-flex items-center gap-1.5',
            glow
              ? 'text-label-caps rounded-full bg-secondary/10 px-2.5 py-1 uppercase text-secondary'
              : 'text-label-caps uppercase text-muted-foreground'
          )}
        >
          {eyebrowIcon}
          {eyebrow}
        </span>
        {timedBadge ? (
          <span className="text-label-caps inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1.5 uppercase text-destructive">
            {timer}
          </span>
        ) : (
          <span className="text-body-sm text-muted-foreground">{timer}</span>
        )}
      </div>

      {title && <h3 className="text-headline-md mb-4 text-foreground">{title}</h3>}

      <p className="text-body-lg mb-5 text-foreground">{question}</p>

      <div className="flex flex-col gap-2.5">
        {options.map((opt) => {
          const isSelected = selected === opt.key;
          const isCorrectOpt = opt.key === correctKey;
          return (
            <button
              key={opt.key}
              type="button"
              disabled={answered}
              onClick={() => setSelected(opt.key)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border p-4 text-left text-body-md transition-all',
                !answered && 'border-border bg-muted/50 text-foreground hover:bg-muted',
                answered && !isSelected && 'border-border bg-muted/50 text-foreground opacity-50',
                answered && isSelected && isCorrectOpt && 'border-secondary/50 bg-secondary/10 text-foreground ring-1 ring-secondary/50',
                answered && isSelected && !isCorrectOpt && 'border-destructive/50 bg-destructive/10 text-foreground'
              )}
            >
              <span>
                <span className="mr-1.5 font-mono text-muted-foreground">{opt.key})</span>
                {opt.text}
              </span>
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                  isSelected && isCorrectOpt && 'border-transparent bg-secondary text-background',
                  isSelected && !isCorrectOpt && 'border-transparent bg-destructive text-background',
                  !isSelected && 'border-input'
                )}
              >
                {isSelected && isCorrectOpt && <Check className="h-3.5 w-3.5" />}
                {isSelected && !isCorrectOpt && <X className="h-3.5 w-3.5" />}
              </span>
            </button>
          );
        })}
      </div>

      {answeredCorrectly && solution && (
        <div className="animate-in fade-in slide-in-from-bottom-2 mt-4 border-t border-border pt-4 duration-300">
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-secondary" />
              <span className="text-label-caps uppercase text-secondary">AI Solution Breakdown</span>
            </div>
            <p className="text-body-sm text-muted-foreground">{solution}</p>
          </div>
        </div>
      )}
    </div>
  );
}
