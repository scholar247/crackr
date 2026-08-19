'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const DIFFICULTY_QUICK_SET = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'ANY', label: 'Mixed' },
] as const;

export interface SectionDraft {
  title: string;
  nodeId?: string;
  questionCount: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'ANY';
  marks: number;
  negativeMarks: number;
}

interface SubjectOption {
  id: string;
  name: string;
}

export function emptySection(): SectionDraft {
  return { title: '', nodeId: undefined, questionCount: 10, difficulty: 'ANY', marks: 4, negativeMarks: 1 };
}

/** Per-subject/section builder shared by the self-mock, group-test, and challenge wizards. */
export function SectionBuilder({ examId, sections, onChange }: { examId: string; sections: SectionDraft[]; onChange: (sections: SectionDraft[]) => void }) {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  useEffect(() => {
    if (!examId) return;
    fetch(`/api/v1/public/nodes?examId=${examId}&nodeType=SUBJECT`)
      .then((res) => res.json())
      .then((json) => setSubjects((json.data ?? []).map((n: { id: string; name: string }) => ({ id: n.id, name: n.name }))));
  }, [examId]);

  function updateSection(index: number, patch: Partial<SectionDraft>) {
    const next = sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(next);
  }

  function addSection() {
    onChange([...sections, emptySection()]);
  }

  function removeSection(index: number) {
    onChange(sections.filter((_, i) => i !== index));
  }

  const totalQuestions = sections.reduce((sum, s) => sum + (s.questionCount || 0), 0);

  // Quick-set controls apply a value to every section at once — a convenience layer on
  // top of the per-section builder below, not a schema change (SectionDraft already
  // carries difficulty/marks/negativeMarks per section). "Mixed" reads as active when
  // sections disagree, same as the design's segmented control.
  const firstDifficulty = sections[0]?.difficulty ?? 'ANY';
  const commonDifficulty = sections.every((s) => (s.difficulty ?? 'ANY') === firstDifficulty) ? firstDifficulty : undefined;
  const firstMarks = sections[0]?.marks;
  const commonMarks = sections.every((s) => s.marks === firstMarks) ? firstMarks : undefined;
  const firstNegativeMarks = sections[0]?.negativeMarks;
  const commonNegativeMarks = sections.every((s) => s.negativeMarks === firstNegativeMarks) ? firstNegativeMarks : undefined;
  const negativeMarkingEnabled = (commonNegativeMarks ?? firstNegativeMarks ?? 0) > 0;

  function applyDifficultyToAll(difficulty: SectionDraft['difficulty']) {
    onChange(sections.map((s) => ({ ...s, difficulty })));
  }
  function applyMarksToAll(marks: number) {
    if (Number.isNaN(marks)) return;
    onChange(sections.map((s) => ({ ...s, marks })));
  }
  function applyNegativeMarksToAll(negativeMarks: number) {
    if (Number.isNaN(negativeMarks)) return;
    onChange(sections.map((s) => ({ ...s, negativeMarks })));
  }
  function toggleNegativeMarking(enabled: boolean) {
    onChange(sections.map((s) => ({ ...s, negativeMarks: enabled ? s.negativeMarks || 1 : 0 })));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Difficulty curve</Label>
            <p className="text-xs text-muted-foreground">Applies to every section below.</p>
            <div className="mt-2 flex rounded-lg border border-border bg-muted/40 p-1">
              {DIFFICULTY_QUICK_SET.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => applyDifficultyToAll(opt.value)}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    commonDifficulty === opt.value ? 'bg-card text-primary shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Scoring logic</Label>
                <p className="text-xs text-muted-foreground">Applies to every section below.</p>
              </div>
              <label className="flex items-center gap-2">
                <span className="text-label-caps uppercase text-muted-foreground">Negative marking</span>
                <Switch checked={negativeMarkingEnabled} onCheckedChange={toggleNegativeMarking} />
              </label>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">+</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="w-16 text-center"
                  value={commonMarks ?? ''}
                  placeholder="Mixed"
                  onChange={(e) => applyMarksToAll(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-destructive">−</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="w-16 text-center"
                  disabled={!negativeMarkingEnabled}
                  value={negativeMarkingEnabled ? (commonNegativeMarks ?? '') : 0}
                  placeholder="Mixed"
                  onChange={(e) => applyNegativeMarksToAll(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {sections.map((section, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Section {index + 1}</p>
            {sections.length > 1 && (
              <button type="button" onClick={() => removeSection(index)} aria-label="Remove section" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`section-${index}-title`}>Title</Label>
              <Input
                id={`section-${index}-title`}
                className="mt-1.5"
                value={section.title}
                onChange={(e) => updateSection(index, { title: e.target.value })}
                placeholder="e.g. Mathematics"
              />
            </div>
            <div>
              <Label htmlFor={`section-${index}-subject`}>Subject (optional — leave blank for the whole exam)</Label>
              <Select value={section.nodeId ?? '__any__'} onValueChange={(v) => updateSection(index, { nodeId: v === '__any__' ? undefined : v })}>
                <SelectTrigger id={`section-${index}-subject`} className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any__">Anywhere in the exam</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div>
              <Label htmlFor={`section-${index}-count`}>Questions</Label>
              <Input
                id={`section-${index}-count`}
                className="mt-1.5"
                type="number"
                min={1}
                max={100}
                value={section.questionCount}
                onChange={(e) => updateSection(index, { questionCount: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor={`section-${index}-difficulty`}>Difficulty</Label>
              <Select value={section.difficulty ?? 'ANY'} onValueChange={(v) => updateSection(index, { difficulty: v as SectionDraft['difficulty'] })}>
                <SelectTrigger id={`section-${index}-difficulty`} className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">Any</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`section-${index}-marks`}>Marks (correct)</Label>
              <Input
                id={`section-${index}-marks`}
                className="mt-1.5"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={section.marks}
                onChange={(e) => updateSection(index, { marks: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor={`section-${index}-negative`}>Negative marks</Label>
              <Input
                id={`section-${index}-negative`}
                className="mt-1.5"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={section.negativeMarks}
                onChange={(e) => updateSection(index, { negativeMarks: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={addSection} disabled={sections.length >= 20}>
          <Plus className="h-4 w-4" /> Add section
        </Button>
        <p className="text-xs text-muted-foreground">{totalQuestions} total questions (5–300)</p>
      </div>
    </div>
  );
}
