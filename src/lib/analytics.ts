// Thin wrapper over the GA4 tag loaded by @next/third-parties (production only). A no-op
// when GA isn't present (dev, blocked by the browser), and never throws. Send only
// content identifiers (exam/chapter slugs, counts) — never personal data.

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: Params) => void;
  }
}

export function trackEvent(name: string, params?: Params) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') window.gtag('event', name, params);
  } catch {
    // Analytics must never break the page.
  }
}
