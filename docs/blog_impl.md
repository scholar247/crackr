Files Added

┌──────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────┐
│                       File                       │                                   Purpose                                   │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/types/index.ts                               │ Blog, BlogClient, BlogSEO, BlogStatus, BlogType, BlogSlugHistoryEntry types │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/schemas/blog.schema.ts                       │ Zod schemas: CreateBlog, UpdateBlog, BlogListQuery                          │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/server/repositories/mongo/blog.repository.ts │ MongoDB repo: CRUD, slug history, reading time, indexes                     │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/server/repositories/blog.repository.ts       │ Barrel export + singleton                                                   │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/server/services/blog.service.ts              │ Service layer                                                               │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/app/api/admin/blogs/route.ts                 │ GET /api/admin/blogs, POST /api/admin/blogs                                 │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/app/api/admin/blogs/[id]/route.ts            │ GET, PATCH, DELETE /api/admin/blogs/:id                                     │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/app/api/public/blogs/route.ts                │ GET /api/public/blogs (published only)                                      │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/app/api/public/blogs/[slug]/route.ts         │ GET /api/public/blogs/:slug + related + view increment                      │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/app/(admin)/admin/blogs/page.tsx             │ Admin list page                                                             │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/app/(admin)/admin/blogs/loading.tsx          │ Skeleton loading                                                            │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/app/(admin)/admin/blogs/blog-list-client.tsx │ List UI: filters, table, publish/archive/unpublish actions                  │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/app/(admin)/admin/blogs/new/page.tsx         │ Create page                                                                 │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/app/(admin)/admin/blogs/[id]/edit/page.tsx   │ Edit page                                                                   │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/components/editor/blog-form.tsx              │ Tabbed form: Content / Taxonomy / SEO / Settings                            │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/app/(browse)/blogs/page.tsx                  │ Public listing with pagination + type filter                                │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ src/app/(browse)/blogs/[slug]/page.tsx           │ Public detail: JSON-LD, OG, Twitter Card, related blogs                     │
└──────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────┘

Files Modified

┌─────────────────────────────────────────┬──────────────────────────────────────┐
│                  File                   │                Change                │
├─────────────────────────────────────────┼──────────────────────────────────────┤
│ src/types/index.ts                      │ Added Blog types                     │
├─────────────────────────────────────────┼──────────────────────────────────────┤
│ src/app/sitemap.ts                      │ Added /blogs index + per-blog routes │
├─────────────────────────────────────────┼──────────────────────────────────────┤
│ src/components/layout/admin-sidebar.tsx │ Added Blogs nav item                 │
├─────────────────────────────────────────┼──────────────────────────────────────┤
│ src/app/(browse)/layout.tsx             │ Added Blogs footer link              │
└─────────────────────────────────────────┴──────────────────────────────────────┘

No migration commands needed — MongoDB is schema-less; indexes are created lazily by ensureIndexes() which is called by the repository on first write. You can also call POST
/api/admin/blogs once to trigger index creation, or add a one-time seed route if you prefer eager initialization.