export interface GenerateTextOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Provider-agnostic text generation. Add a new provider (Claude, OpenAI, ...) by implementing
 * this interface in a sibling file and adding one branch to providers/index.ts — nothing else
 * in the factory (prompts, jobs, validation) needs to change.
 */
export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generateText(prompt: string, opts?: GenerateTextOptions): Promise<string>;
}
