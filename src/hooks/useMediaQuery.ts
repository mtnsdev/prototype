"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to `window.matchMedia(query)`. On the client, `matches` is read synchronously
 * so layout (e.g. split vs modal) matches the viewport on the first paint — no flash of the wrong variant.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
