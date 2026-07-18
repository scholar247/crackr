import { aiLogRepository } from '@/server/repositories/ai-log.repository';
import type { AILogPhase } from '@/types';

interface LogContext {
  runId: string;
  phase: AILogPhase;
  seedId?: string;
  examId?: string;
  subjectId?: string;
  topicId?: string;
}

const CONSOLE_FN: Record<'INFO' | 'WARN' | 'ERROR', (...args: unknown[]) => void> = {
  INFO: console.log,
  WARN: console.warn,
  ERROR: console.error,
};

/**
 * Structured logging for the AI Content Factory. Always prints to the server console/stdout
 * first (this is what you see in your terminal or Vercel function logs — never the browser,
 * since this module only ever runs in job/service code on the server) and then persists to
 * MongoDB in the background for the Seed Monitor UI. DB failures never block or hide the
 * console line — you'll always see what happened even if the log collection write fails.
 */
function write(level: 'INFO' | 'WARN' | 'ERROR', ctx: LogContext, message: string, meta?: Record<string, unknown>) {
  const tag = `[ai-factory:${ctx.phase}]`;
  const scope = [ctx.seedId && `seed=${ctx.seedId}`, ctx.topicId && `topic=${ctx.topicId}`]
    .filter(Boolean)
    .join(' ');
  CONSOLE_FN[level](`${tag} ${message}`, scope ? `(${scope})` : '', meta ?? '');

  aiLogRepository.insert({ ...ctx, level, message, meta }).catch((e) => {
    console.error(`${tag} failed to persist log entry to aiFactoryLogs:`, e);
  });
}

export const aiLogger = {
  info: (ctx: LogContext, message: string, meta?: Record<string, unknown>) => write('INFO', ctx, message, meta),
  warn: (ctx: LogContext, message: string, meta?: Record<string, unknown>) => write('WARN', ctx, message, meta),
  error: (ctx: LogContext, message: string, meta?: Record<string, unknown>) => write('ERROR', ctx, message, meta),
};
