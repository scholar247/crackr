'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ClipboardCheck, RotateCcw, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BLANK, type StudyQuestion } from '@/lib/mind-map-study';

// A short multiple-choice test generated from the map (which topic a point belongs to, and
// number blanks in facts). Instant feedback per question, score at the end.
export function PracticeTest({
  title,
  questions,
  onAnswer,
  onFinish,
  onRetry,
  onClose,
}: {
  title: string;
  questions: StudyQuestion[];
  onAnswer: (q: StudyQuestion, correct: boolean) => void;
  onFinish: (score: number, total: number) => void;
  onRetry: () => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<StudyQuestion[]>([]);
  const q = questions[index];
  const finished = index >= questions.length;
  const dialogRef = useRef<HTMLDivElement>(null);

  const choose = (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    const correct = i === q.answer;
    if (correct) setScore((s) => s + 1);
    else setMissed((m) => [...m, q]);
    onAnswer(q, correct);
  };
  const next = () => {
    const last = index + 1 >= questions.length;
    if (last) onFinish(score, questions.length);
    setIndex((i) => i + 1);
    setPicked(null);
  };

  const handlers = useRef({ choose, next, onClose, picked, q });
  useEffect(() => {
    handlers.current = { choose, next, onClose, picked, q };
  });
  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const h = handlers.current;
      if (e.key === 'Escape') return h.onClose();
      if (!h.q) return;
      const n = Number(e.key);
      if (h.picked === null && n >= 1 && n <= h.q.options.length) h.choose(n - 1);
      else if (h.picked !== null && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        h.next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Practice test: ${title}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-3xl border border-border bg-card shadow-2xl outline-none motion-safe:animate-in motion-safe:slide-in-from-bottom-4 sm:rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">Test yourself · {title}</p>
            {!finished && (
              <p className="text-xs text-muted-foreground tabular-nums">
                Question {index + 1} of {questions.length} · {score} correct
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close test" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary motion-safe:transition-[width]" style={{ width: `${questions.length ? (Math.min(index + (picked !== null ? 1 : 0), questions.length) / questions.length) * 100 : 0}%` }} />
        </div>

        {!finished && q ? (
          <div className="overflow-y-auto p-5">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{q.kind === 'blank' ? 'Fill in the blank' : 'Where does it belong?'}</p>
            <p className="mt-1.5 text-lg leading-snug font-semibold text-foreground">
              {q.kind === 'blank'
                ? q.prompt.split(BLANK).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && <span className="mx-1 inline-block min-w-16 border-b-2 border-primary text-center text-primary">{picked !== null ? q.options[q.answer] : ' '}</span>}
                    </span>
                  ))
                : q.prompt}
            </p>
            <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Options">
              {q.options.map((o, i) => {
                const isAnswer = i === q.answer;
                const isPicked = i === picked;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={isPicked}
                    disabled={picked !== null}
                    onClick={() => choose(i)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors',
                      picked === null && 'border-border hover:border-primary/50 hover:bg-primary/5',
                      picked !== null && isAnswer && 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
                      picked !== null && isPicked && !isAnswer && 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300',
                      picked !== null && !isAnswer && !isPicked && 'border-border opacity-60',
                    )}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs tabular-nums">{i + 1}</span>
                    <span className="flex-1">{o}</span>
                    {picked !== null && isAnswer && <CheckCircle2 className="h-4 w-4 shrink-0" aria-label="Correct answer" />}
                    {picked !== null && isPicked && !isAnswer && <XCircle className="h-4 w-4 shrink-0" aria-label="Your answer" />}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="mt-4 flex items-start justify-between gap-3 motion-safe:animate-in motion-safe:fade-in">
                <p className={cn('text-sm', picked === q.answer ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground')}>
                  {picked === q.answer ? 'Correct! ' : ''}
                  {q.explanation}
                </p>
                <button type="button" onClick={next} className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  {index + 1 >= questions.length ? 'See score' : 'Next'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-y-auto p-6 text-center">
            <p className="text-4xl font-bold text-foreground tabular-nums">
              {score}/{questions.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{pct >= 80 ? 'Excellent — you know this chapter well!' : pct >= 50 ? 'Good going — revise the ones you missed.' : 'Keep at it — the flashcards will help these stick.'}</p>
            {missed.length > 0 && (
              <div className="mt-5 text-left">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Review these</p>
                <ul className="mt-2 space-y-2">
                  {missed.map((m) => (
                    <li key={m.id} className="rounded-lg border border-border p-3 text-sm text-foreground">
                      {m.explanation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-primary/40">
                <RotateCcw className="h-4 w-4" /> New test
              </button>
              <button type="button" onClick={onClose} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Back to the map
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
