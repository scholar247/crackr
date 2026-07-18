import type { AIProvider, GenerateTextOptions } from './ai-provider';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Raw REST call to Gemini's generateContent endpoint — mirrors the already-proven
 * implementation in scripts/blog_common.py::gemini_generate() (same payload shape,
 * same finishReason/candidate error handling). No SDK dependency added.
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  constructor(private apiKey: string, readonly model: string) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  }

  async generateText(prompt: string, opts: GenerateTextOptions = {}): Promise<string> {
    const { temperature = 0.65, maxOutputTokens = 8192 } = opts;
    const url = `${GEMINI_API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature, topP: 0.9, maxOutputTokens },
      }),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.json();
        detail = body?.error?.message ?? '';
      } catch {
        detail = await res.text().catch(() => '');
      }
      throw new Error(`Gemini API ${res.status}: ${detail.slice(0, 300)}`);
    }

    const data = await res.json();
    const candidates = data.candidates ?? [];
    if (candidates.length === 0) {
      throw new Error(`Gemini returned no candidates (promptFeedback=${JSON.stringify(data.promptFeedback)})`);
    }

    const candidate = candidates[0];
    const finishReason = candidate.finishReason;
    const parts = candidate.content?.parts ?? [];
    const text = parts.map((p: { text?: string }) => p.text ?? '').join('').trim();

    if (!text) throw new Error(`Gemini returned empty text (finishReason=${finishReason})`);
    if (finishReason === 'MAX_TOKENS') {
      console.warn('[gemini.provider] hit max_output_tokens — response may be truncated');
    }
    return text;
  }
}
