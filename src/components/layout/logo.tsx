import NextImage from 'next/image';
import { SITE_NAME } from '@/lib/site-config';

/**
 * Renders both logo variants and lets CSS pick the visible one via the `dark:` variant —
 * not a JS theme check. next-themes only knows the real theme after client mount, so a
 * JS-driven swap would flash the wrong logo on every load; two images with
 * dark:hidden/hidden:dark:block never do, since the correct one is already in the DOM
 * before hydration.
 */
export function Logo({ width, height, priority, className }: { width: number; height: number; priority?: boolean; className?: string }) {
  return (
    <>
      <NextImage src="/logo.svg" alt={SITE_NAME} width={width} height={height} priority={priority} className={`dark:hidden ${className ?? ''}`} />
      <NextImage src="/logo_dark.svg" alt={SITE_NAME} width={width} height={height} priority={priority} className={`hidden dark:block ${className ?? ''}`} />
    </>
  );
}
