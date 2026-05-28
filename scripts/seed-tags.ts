/**
 * Seed tags.
 * Supports both Firebase and MongoDB via DATABASE_PROVIDER env var.
 * Run: npx tsx --env-file=.env.local scripts/seed-tags.ts
 */

import { getAdapter, slugify } from './seed-helpers';

export const TAGS_DATA = [
  { name: 'Concept Based',  color: '#3b82f6' },
  { name: 'Numerical',      color: '#f59e0b' },
  { name: 'Formula Based',  color: '#8b5cf6' },
  { name: 'Previous Year',  color: '#ef4444' },
  { name: 'High Weightage', color: '#10b981' },
  { name: 'Diagram Based',  color: '#06b6d4' },
  { name: 'Theory',         color: '#64748b' },
  { name: 'Application',    color: '#f97316' },
  { name: 'Memory Based',   color: '#ec4899' },
  { name: 'Important',      color: '#eab308' },
];

async function seedTags() {
  const db = await getAdapter();
  const result: Record<string, string> = {};

  for (const tag of TAGS_DATA) {
    const slug = slugify(tag.name);
    const existing = await db.findByField('tags', 'slug', slug);
    if (existing) {
      console.log(`  SKIP  [${tag.name}]`);
      result[tag.name] = existing.id;
      continue;
    }

    const id = await db.upsertBySlug('tags', slug, {
      name: tag.name,
      slug,
      color: tag.color,
      usageCount: 0,
    });
    console.log(`  CREATE [${tag.name}] → ${id}`);
    result[tag.name] = id;
  }

  console.log('\nTag IDs:');
  for (const [name, id] of Object.entries(result)) {
    console.log(`  "${name}": "${id}"`);
  }
  return result;
}

seedTags().catch((e) => { console.error(e); process.exit(1); });
