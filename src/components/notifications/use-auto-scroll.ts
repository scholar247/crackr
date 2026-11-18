'use client';

import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** The visitor's "reduce motion" OS setting, live. True on the server, so nothing moves before hydration. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => true);
}

/** Pixels per second — slow enough to read titles as they pass. */
const SPEED = 22;
/** Pause at the top before scrolling, and at the bottom before returning. */
const END_HOLD_MS = 2000;
/** How long a visitor's own scroll/touch keeps auto-scroll away. */
const USER_HOLD_MS = 5000;

/**
 * Slowly scrolls an overflowing container downwards, pausing at the end and gliding back
 * to the top in a loop. Stops while `paused`, while the container is off-screen or the tab
 * is hidden, and for a few seconds after the visitor scrolls it themselves.
 */
export function useAutoScroll(ref: RefObject<HTMLElement | null>, { enabled, paused }: { enabled: boolean; paused: boolean }) {
  // Read inside the animation loop without restarting it on every pause/resume.
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let onScreen = true;
    let holdUntil = performance.now() + END_HOLD_MS;
    let pos = el.scrollTop;
    let last = performance.now();
    let frame = 0;

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    observer.observe(el);

    const holdForUser = () => {
      holdUntil = performance.now() + USER_HOLD_MS;
    };
    el.addEventListener('wheel', holdForUser, { passive: true });
    el.addEventListener('touchstart', holdForUser, { passive: true });
    el.addEventListener('keydown', holdForUser);

    const step = (now: number) => {
      // Time-based, so the speed is the same at 60 fps or on a throttled/low-power display;
      // capped so a long stall (sleep, debugger) can't jump far. Hidden tabs never run.
      const dt = Math.min(now - last, 1000);
      last = now;
      const max = el.scrollHeight - el.clientHeight;
      const running = !pausedRef.current && onScreen && !document.hidden && now >= holdUntil && max > 1;

      if (!running) {
        // Follow wherever the visitor (or a smooth reset) moved it, so we resume from there.
        pos = el.scrollTop;
      } else if (Math.abs(el.scrollTop - pos) > 3) {
        // Moved by something other than us (scrollbar drag, scrollIntoView): follow it and
        // back off, rather than dragging the list back.
        pos = el.scrollTop;
        holdUntil = now + USER_HOLD_MS;
      } else if (pos >= max - 0.5) {
        // Reached the end: hold, glide back to the top, then hold again before restarting.
        holdUntil = now + END_HOLD_MS * 3;
        setTimeout(() => {
          el.scrollTo({ top: 0, behavior: 'smooth' });
          holdUntil = performance.now() + END_HOLD_MS * 1.5;
        }, END_HOLD_MS);
      } else {
        // Track the position as a float: scrollTop rounds, which would stall slow scrolling.
        pos = Math.min(max, pos + (SPEED * dt) / 1000);
        el.scrollTop = pos;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener('wheel', holdForUser);
      el.removeEventListener('touchstart', holdForUser);
      el.removeEventListener('keydown', holdForUser);
    };
  }, [ref, enabled]);
}
