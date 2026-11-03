import { z } from 'zod';
import { requireAuth } from '@/server/auth/require-auth';
import { executeSQL, SqlBusyError, SqlQueryError, SqlTimeoutError } from '@/server/services/sql-playground/executor';
import { SQLValidationError } from '@/server/services/sql-playground/validator';
import { SQL_MAX_LENGTH, SQL_TEMPLATE_IDS } from '@/lib/sql-playground/templates';
import { apiError, apiSuccess } from '@/lib/utils';

const ExecuteSchema = z.object({
  template: z.enum(SQL_TEMPLATE_IDS, { error: 'Unknown database.' }),
  sql: z.string().min(1, 'SQL is required.').max(SQL_MAX_LENGTH, 'SQL is too long.'),
});

// Runs a script against a fresh, throwaway copy of the chosen sample database — nothing a
// user runs is ever persisted or visible to anyone else.
export async function POST(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const parsed = ExecuteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  try {
    return apiSuccess(await executeSQL(parsed.data.template, parsed.data.sql));
  } catch (err) {
    // Errors caused by the user's SQL are shown in the results panel, so their message is
    // the response; anything else is a server fault and stays generic.
    if (err instanceof SQLValidationError) return apiError(err.message, 400);
    if (err instanceof SqlQueryError || err instanceof SqlTimeoutError) return apiError(err.message, 422);
    if (err instanceof SqlBusyError) return apiError(err.message, 503);
    console.error('[sql-playground] execute failed', err);
    return apiError('Something went wrong while running the query.', 500);
  }
}
