// Deprecated: categories have been replaced by topics
export async function PATCH() {
  return Response.json({ error: 'Categories API is deprecated. Use /api/admin/topics instead.' }, { status: 410 });
}

export async function DELETE() {
  return Response.json({ error: 'Categories API is deprecated. Use /api/admin/topics instead.' }, { status: 410 });
}
