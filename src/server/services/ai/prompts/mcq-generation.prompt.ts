import type { Difficulty } from '@/types';

export const MCQ_GENERATION_PROMPT_VERSION = 'v1';

export interface MCQGenerationParams {
  topic: string;
  examName: string;
  subjectName: string;
  count: number;
  difficultyMix: Partial<Record<Difficulty, number>>;
  includePYQ: boolean;
}

export interface MCQGenerationResultItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
}

export function buildMCQGenerationPrompt(p: MCQGenerationParams): string {
  const mixLines = Object.entries(p.difficultyMix)
    .filter(([, w]) => (w ?? 0) > 0)
    .map(([d, w]) => `${d}: ~${Math.round((w ?? 0) * p.count)} question(s)`)
    .join(', ');

  return `You are an expert question setter for Indian competitive exams.

Topic: ${p.topic}
Exam: ${p.examName || 'General'}
Subject: ${p.subjectName || 'General'}
${p.includePYQ ? 'Style: previous-year-exam style questions (realistic exam difficulty and phrasing)\n' : ''}
Generate exactly ${p.count} multiple-choice questions on this topic, distributed across difficulty as: ${mixLines || 'MEDIUM: all'}.

Rules:
- Each question must be a genuinely different concept/angle — no duplicates or near-duplicates of each other
- Exactly 4 options per question, exactly one correct
- Every question must have a clear, self-contained explanation of the correct answer
- No ambiguous or opinion-based questions — every answer must be objectively verifiable

Return ONLY a JSON array with EXACTLY ${p.count} objects (no markdown fences, no commentary):
[
  {
    "question": "question text",
    "options": ["option A", "option B", "option C", "option D"],
    "correctIndex": 0,
    "explanation": "why this option is correct, and briefly why the others are wrong",
    "difficulty": "EASY"
  }
]`;
}
