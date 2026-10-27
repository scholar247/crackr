// The homepage's curated, always-first exam lineup — chosen deliberately rather than
// left to incidental syllabus-richness ranking, so it doesn't silently drift as content
// gets seeded. Extend this list as new exams get real syllabus/content coverage; anything
// not listed here still surfaces via the richest-syllabus fallback in getFeaturedExams.
export const PRIMARY_EXAM_SLUGS = ['nimcet', 'gate-cse', 'cuet-ug', 'cbse-class-12-board'] as const;

// The one exam the anonymous (and profile-incomplete) homepage leads with — an editorial
// "this is hot right now" call, not a computed/real trending signal. See
// prd/homepage-session-aware-revamp.md Section 5.
export const FEATURED_ANONYMOUS_EXAM_SLUG = 'nimcet';
