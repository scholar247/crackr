import { mysqlTable, mysqlEnum, varchar, text, int, json, boolean, timestamp, index } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';

export const HOME_CARD_CTA_TYPES = ['BUTTON', 'TEXT'] as const;
// Maps to theme tokens (primary / secondary / tertiary) — admins pick a tone, never a raw color.
export const HOME_CARD_ACCENTS = ['PRIMARY', 'SECONDARY', 'TERTIARY'] as const;

// Generic, admin-managed content card. `page` + `section` scope where a card renders (e.g.
// page=home, section=learning-loop), so other pages/sections can reuse this module instead
// of each getting its own table. Only isActive cards render, ordered by `sequence`.
export const pageCards = mysqlTable(
  'page_cards',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    page: varchar('page', { length: 60 }).notNull(),
    section: varchar('section', { length: 60 }).notNull(),
    sequence: int('sequence').notNull().default(0),
    title: varchar('title', { length: 160 }).notNull(),
    // Small chip above the title (e.g. "Concept Foundation").
    badge: varchar('badge', { length: 60 }),
    description: text('description'),
    listItems: json('list_items').$type<string[]>(),
    ctaLabel: varchar('cta_label', { length: 80 }),
    ctaLink: varchar('cta_link', { length: 2048 }),
    ctaType: mysqlEnum('cta_type', HOME_CARD_CTA_TYPES).notNull().default('TEXT'),
    accent: mysqlEnum('accent', HOME_CARD_ACCENTS).notNull().default('PRIMARY'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('page_cards_page_section_idx').on(table.page, table.section, table.sequence)],
);
