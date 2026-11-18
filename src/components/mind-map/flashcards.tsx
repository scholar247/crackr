'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BLANK, type Flashcard } from '@/lib/mind-map-study';
import { GRADES, isDue, previewInterval, type Grade, type SrsCard } from '@/lib/spaced-repetition';

const NEW_PER_SESSION = 20;

function intervalLabel(days: number) {
  if (days < 1) return 'now';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

/** Due cards first (most overdue first), then up to NEW_PER_SESSION new ones. */
export function sessionQueue(cards: Flashcard[], progress: Readonly<Record<string, SrsCard>>, today: number): Flashcard[] {
  const due = cards.filter((c) => progress[c.id] && isDue(progress[c.id], today)).sort((a, b) => progress[a.id].due - progress[b.id].due);
  const fresh = cards.filter((c) => !progress[c.id]).slice(0, NEW_PER_SESSION);
  return [...due, ...fresh];
}

// Spaced-repetition flashcards for a map (or one topic / starred nodes). Flip with a tap or
// Space, grade with the buttons or keys 1–4. "Again" brings the card back this session.
export function Flashcards({
  title,
  cards,
  progress,
  today,
  onGrade,
  onClose,
}: {
  title: string;
  cards: Flashcard[];
  progress: Readonly<Record<string, SrsCard>>;
  today: number;
  onGrade: (id: string, grade: Grade) => void;
  onClose: () => void;
}) {
  const [queue, setQueue] = useState(() => sessionQueue(cards, progress, today));
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState({ reviewed: 0, again: 0 });
  const [total, setTotal] = useState(queue.length);
  const card = queue[0];
  const dialogRef = useRef<HTMLDivElement>(null);

  const nextDue = useMemo(() => {
    const future = cards.map((c) => progress[c.id]?.due).filter((d): d is number => d !== undefined && d > today);
    return future.length ? Math.min(...future) - today : null;
  }, [cards, progress, today]);

  const gradeCard = (g: Grade) => {
    if (!card) return;
    onGrade(card.id, g);
    setDone((d) => ({ reviewed: d.reviewed + 1, again: d.again + (g === 1 ? 1 : 0) }));
    setFlipped(false);
    // Forgotten cards come back at the end of this session.
    setQueue((q) => (g === 1 ? [...q.slice(1), q[0]] : q.slice(1)));
    if (g === 1) setTotal((t) => t + 1);
  };

  const toggleFlip = () => setFlipped((f) => !f);
  const handlers = useRef({ gradeCard, toggleFlip, onClose, flipped, card });
  useEffect(() => {
    handlers.current = { gradeCard, toggleFlip, onClose, flipped, card };
  });
  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const h = handlers.current;
      if (e.key === 'Escape') h.onClose();
      else if (!h.card) return;
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        h.toggleFlip();
      } else if (h.flipped) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) h.gradeCard(g.grade);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const position = total - queue.length + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Flashcards: ${title}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-3xl border border-border bg-card shadow-2xl outline-none motion-safe:animate-in motion-safe:slide-in-from-bottom-4 sm:rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <Layers className="h-4 w-4 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">Flashcards · {title}</p>
            {card && (
              <p className="text-xs text-muted-foreground tabular-nums">
                Card {Math.min(position, total)} of {total}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close flashcards" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary motion-safe:transition-[width]" style={{ width: `${total ? ((total - queue.length) / total) * 100 : 100}%` }} />
        </div>

        {card ? (
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? 'Show the question' : 'Show the answer'}
              className="flex min-h-56 flex-1 flex-col overflow-y-auto rounded-2xl border border-border bg-background p-5 text-left transition-colors hover:border-primary/40"
            >
              {card.context.length > 0 && <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{card.context.join(' › ')}</span>}
              <span className="mt-2 text-lg leading-snug font-semibold text-foreground">
                {card.kind === 'blank'
                  ? card.front.split(BLANK).map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && <span className="mx-1 inline-block min-w-16 border-b-2 border-primary text-center text-primary">{flipped ? card.back[0] : ' '}</span>}
                      </span>
                    ))
                  : card.front}
              </span>
              {flipped ? (
                card.kind !== 'blank' && (
                  <ul className="mt-4 space-y-2 border-t border-border pt-4 motion-safe:animate-in motion-safe:fade-in">
                    {card.back.map((line, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        {line}
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <span className="mt-auto pt-6 text-xs text-muted-foreground">Recall it, then tap to check · Space</span>
              )}
            </button>

            {flipped ? (
              <div className="mt-4 grid grid-cols-4 gap-2" role="group" aria-label="How well did you remember?">
                {GRADES.map((g) => (
                  <button
                    key={g.grade}
                    type="button"
                    onClick={() => gradeCard(g.grade)}
                    className={cn(
                      'flex flex-col items-center rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors',
                      g.grade === 1 && 'border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400',
                      g.grade === 3 && 'border-warning/50 text-warning hover:bg-warning/10',
                      g.grade === 4 && 'border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400',
                      g.grade === 5 && 'border-primary/50 text-primary hover:bg-primary/10',
                    )}
                  >
                    {g.label}
                    <span className="text-[11px] font-normal opacity-70 tabular-nums">
                      {g.grade === 1 ? 'again' : intervalLabel(previewInterval(progress[card.id], g.grade, today))} · {g.key}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <button type="button" onClick={() => setFlipped(true)} className="mt-4 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Show answer
              </button>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-3xl" aria-hidden>
              🎉
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">{done.reviewed ? 'Session complete!' : 'Nothing due right now'}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {done.reviewed ? `${done.reviewed} reviews · ${done.again} to practise again. ` : ''}
              {nextDue !== null ? `Next cards are due in ${intervalLabel(nextDue)}.` : 'Come back tomorrow to keep your memory fresh.'}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // Practise everything again regardless of schedule.
                  setQueue(cards);
                  setTotal(cards.length);
                  setDone({ reviewed: 0, again: 0 });
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-primary/40"
              >
                <RotateCcw className="h-4 w-4" /> Practise all {cards.length}
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
