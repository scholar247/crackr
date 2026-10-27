/** Mock and progress routes live behind sign-in; send guests through sign-in and back. */
export function gated(href: string, signedIn: boolean) {
  return signedIn ? href : `/sign-in?callbackUrl=${encodeURIComponent(href)}`;
}

export function formatDuration(seconds: number | null) {
  if (!seconds) return 'Untimed';
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr${minutes % 60 ? ` ${minutes % 60} min` : ''}` : `${minutes} min`;
}

export function plural(n: number, noun: string) {
  return `${n.toLocaleString('en-IN')} ${noun}${n === 1 ? '' : 's'}`;
}

export const linkCard =
  'group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
