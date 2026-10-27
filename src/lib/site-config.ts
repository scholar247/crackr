// Single source of truth for the app's public brand identity and canonical domain —
// every place that needs the site name, URL, contact email, or social handle imports from
// here instead of hardcoding a string, so a future rebrand only touches this file.

export const SITE_NAME = 'syllabuzAI';
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://syllabuzai.com';
export const SITE_EMAIL = 'contact@syllabuzai.com';
export const SITE_TWITTER_HANDLE = '@syllabuzAI';
