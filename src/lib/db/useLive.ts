"use client";

import { useEffect, useState } from "react";

/**
 * Starts with the data baked into the page at build time, then quietly swaps
 * in the latest data from the database. If the database can't be reached,
 * the built-in data simply stays on screen.
 */
export function useLive<T>(fetcher: () => Promise<T>, initial: T): T {
  const [data, setData] = useState(initial);
  useEffect(() => {
    let active = true;
    fetcher()
      .then((fresh) => {
        if (active) setData(fresh);
      })
      .catch(() => {
        /* keep the built-in data */
      });
    return () => {
      active = false;
    };
  }, [fetcher]);
  return data;
}
