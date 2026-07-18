/** Strips ```json fences that models sometimes wrap JSON responses in, despite instructions not to. */
export function stripCodeFences(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
}

export function parseJsonResponse<T>(raw: string): T {
  return JSON.parse(stripCodeFences(raw)) as T;
}
