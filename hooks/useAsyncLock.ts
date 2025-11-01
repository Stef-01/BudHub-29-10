// hooks/useAsyncLock.ts
import { useRef, useCallback } from 'react';

/**
 * A hook that provides a simple async locking mechanism to prevent race conditions.
 * It ensures that operations for a given key are queued and executed serially.
 * Subsequent calls for the same key will wait for the previous one to complete.
 */
export function useAsyncLock() {
  // This map stores the promise of the *last* operation queued for a given key.
  const activeLocks = useRef<Map<string, Promise<any>>>(new Map());

  const withLock = useCallback(
    <T>(key: string, operation: () => Promise<T>): Promise<T> => {
      // Get the promise for the currently running/queued operation for this key, if any.
      // If no operation is active, start with a resolved promise.
      const existingPromise = activeLocks.current.get(key) || Promise.resolve();

      // Chain the new operation to run after the previous one completes.
      // We chain off the existing promise, regardless of whether it succeeds or fails,
      // to ensure the queue always moves forward.
      const newPromise = existingPromise.catch(() => {}).then(() => operation());

      // Store the new promise as the active one for this key.
      activeLocks.current.set(key, newPromise);
      
      // When the new operation is finally done, check if it's still the last one in the queue.
      // If so, remove it from the map to prevent the chain from growing indefinitely.
      newPromise.finally(() => {
        if (activeLocks.current.get(key) === newPromise) {
          activeLocks.current.delete(key);
        }
      });

      return newPromise;
    },
    []
  );

  return { withLock };
}
