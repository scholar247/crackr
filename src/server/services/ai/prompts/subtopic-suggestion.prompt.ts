export const SUBTOPIC_SUGGESTION_PROMPT_VERSION = 'v1';

export interface SubtopicSuggestionParams {
  topicName: string;
  subjectName: string;
  count: number;
}

/** MCQ Seeder stage — only used when a broad/chapter-level topic has no children and autoCreateSubtopics is on. */
export function buildSubtopicSuggestionPrompt(p: SubtopicSuggestionParams): string {
  return `You are curating a syllabus taxonomy for an Indian competitive-exam prep platform.

Parent topic: ${p.topicName}
Subject: ${p.subjectName || 'General'}

List exactly ${p.count} distinct, commonly-taught subtopics that belong directly under "${p.topicName}". Each must be a specific, well-known sub-concept — not a vague restatement of the parent topic.

Return ONLY a JSON array of strings (no markdown fences, no commentary):
["Subtopic 1", "Subtopic 2"]`;
}
