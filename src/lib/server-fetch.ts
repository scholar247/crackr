import { headers } from 'next/headers';

export function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
}

export async function serverGet<T>(path: string): Promise<T> {
  const headersList = await headers();
  const cookie = headersList.get('cookie') ?? '';
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: { cookie },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`[serverGet] ${path} → ${res.status}`);
  const json: { data: T } = await res.json();
  return json.data;
}
