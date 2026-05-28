'use client';

import { cn } from '@/lib/utils';
import { ContentBlockRenderer } from './content-block-renderer';
import type { MCQOption } from '@/types';
import { Check, X } from 'lucide-react';

interface AnswerSelectorProps {
  options: MCQOption[];
  questionType: 'SINGLE' | 'MULTIPLE';
  selectedIds: string[];
  onSelect: (optionId: string) => void;
  submitted?: boolean;
  disabled?: boolean;
}

export function AnswerSelector({
  options,
  questionType,
  selectedIds,
  onSelect,
  submitted,
  disabled,
}: AnswerSelectorProps) {
  return (
    <div className="space-y-3">
      {options.map((option, i) => {
        const isSelected = selectedIds.includes(option.id);
        const isCorrect = option.isCorrect;
        const label = ['A', 'B', 'C', 'D', 'E', 'F'][i];

        let stateClass = '';
        if (submitted) {
          if (isCorrect) stateClass = 'border-success bg-success/10 animate-pulse-green';
          else if (isSelected && !isCorrect) stateClass = 'border-destructive bg-destructive/10 animate-shake';
          else stateClass = 'border-border opacity-60';
        } else if (isSelected) {
          stateClass = 'border-primary bg-primary/10 selected';
        }

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled || (submitted ?? false)}
            onClick={() => !disabled && !submitted && onSelect(option.id)}
            className={cn(
              'answer-option w-full flex gap-3 items-start rounded-xl border p-4 text-left transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:cursor-default',
              !submitted && !disabled && 'hover:border-primary/50 cursor-pointer',
              stateClass
            )}
            aria-pressed={isSelected}
            aria-label={`Option ${label}`}
          >
            {/* Option label */}
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold border',
                isSelected && !submitted ? 'border-primary bg-primary text-primary-foreground' :
                submitted && isCorrect ? 'border-success bg-success text-success-foreground' :
                submitted && isSelected && !isCorrect ? 'border-destructive bg-destructive text-destructive-foreground' :
                'border-border bg-muted text-muted-foreground'
              )}
            >
              {submitted && isCorrect ? (
                <Check className="h-4 w-4" />
              ) : submitted && isSelected && !isCorrect ? (
                <X className="h-4 w-4" />
              ) : (
                label
              )}
            </span>

            {/* Option content */}
            <div className="flex-1 min-w-0 text-sm pt-0.5">
              <ContentBlockRenderer blocks={option.content} />
            </div>

            {/* Multiple choice indicator */}
            {!submitted && (
              <span
                className={cn(
                  'shrink-0 flex h-5 w-5 items-center justify-center rounded border transition-colors mt-0.5',
                  questionType === 'MULTIPLE'
                    ? isSelected ? 'border-primary bg-primary' : 'border-border'
                    : isSelected ? 'rounded-full border-primary bg-primary' : 'rounded-full border-border'
                )}
                aria-hidden="true"
              >
                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
