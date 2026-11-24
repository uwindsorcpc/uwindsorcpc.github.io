"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared ticking clocks. During server rendering and hydration they return
 * null, so the static HTML always matches the first browser render; the real
 * time arrives right after.
 */
function createClock(intervalMs: number) {
  let now = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  const listeners = new Set<() => void>();

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    if (!timer) {
      now = Date.now();
      timer = setInterval(() => {
        now = Date.now();
        listeners.forEach((l) => l());
      }, intervalMs);
    }
    return () => {
      listeners.delete(cb);
      if (listeners.size === 0 && timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };
  };
  const getSnapshot = () => (now ||= Date.now());
  const getServerSnapshot = () => null;

  return function useClock() {
    return useSyncExternalStore<number | null>(subscribe, getSnapshot, getServerSnapshot);
  };
}

/** Current time, updated every second (for countdowns). */
export const useNowEverySecond = createClock(1000);
/** Current time, updated every minute (for upcoming/past splits). */
export const useNowEveryMinute = createClock(60_000);
