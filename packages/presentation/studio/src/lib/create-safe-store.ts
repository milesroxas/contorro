import { create, type StateCreator } from "zustand";
import { useShallow } from "zustand/shallow";

/**
 * Zustand v5 — selectors returning objects/arrays must use shallow equality.
 * @see architecture spec §10.3
 */
export function createSafeStore<T>(initializer: StateCreator<T>) {
  const useStoreRaw = create<T>()(initializer);

  function useStore<R>(selector: (state: T) => R): R {
    return useStoreRaw(useShallow(selector));
  }

  useStore.getState = useStoreRaw.getState;
  useStore.setState = useStoreRaw.setState;
  useStore.subscribe = useStoreRaw.subscribe;

  return useStore;
}
