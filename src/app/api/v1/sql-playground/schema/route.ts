import { requireAuth } from '@/server/auth/require-auth';
import { getTemplateSchema } from '@/server/services/sql-playground/executor';
import { findSqlTemplate } from '@/lib/sql-playground/templates';
import { apiError, apiSuccess } from '@/lib/utils';

// Tables, columns (type / PK / FK) and row counts of a sample database, for the schema
// sidebar. The templates are static, so the result is cached server-side.
export async function GET(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const template = new URL(req.url).searchParams.get('template') ?? '';
  if (!findSqlTemplate(template)) return apiError('Unknown database.', 404);

  try {
    return apiSuccess(await getTemplateSchema(template));
  } catch (err) {
    console.error('[sql-playground] schema failed', err);
    return apiError('Could not load the schema.', 500);
  }
}
