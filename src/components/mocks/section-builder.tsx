'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  return (
    <div className="space-y-4">
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
