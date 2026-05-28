// Deprecated: categories have been replaced by topics
export async function GET() {
  return Response.json({ error: 'Categories API is deprecated. Use /api/subjects/[id]/topics instead.' }, { status: 410 });
}
