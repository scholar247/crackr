import type { AIProvider } from './ai-provider';
import { GeminiProvider } from './gemini.provider';

export type { AIProvider, GenerateTextOptions } from './ai-provider';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

let cached: AIProvider | null = null;

/** Returns the configured AI provider (default: Gemini). Cached per process — the provider is stateless. */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const providerName = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase();

  switch (providerName) {
    case 'gemini':
      cached = new GeminiProvider(process.env.GEMINI_API_KEY ?? '', process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL);
      break;
    // Add 'claude' | 'openai' etc. here as sibling *.provider.ts files implementing AIProvider.
    default:
      throw new Error(`Unknown AI_PROVIDER "${providerName}"`);
  }

  return cached;
}
