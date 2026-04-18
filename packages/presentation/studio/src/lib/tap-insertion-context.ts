"use client";

import { createContext, useContext } from "react";

export type StagedTapInsertion = {
  definitionKey: string;
  libraryComponentKey?: string;
};

export type TapInsertionContextValue = {
  /**
   * When non-null, a palette item has been armed via tap on mobile. Subsequent
   * taps on a drop zone commit the insertion without a full drag gesture.
   */
  staged: StagedTapInsertion | null;
  stage: (value: StagedTapInsertion) => void;
  cancel: () => void;
  commit: (parentId: string, insertIndex: number) => void;
  /** True while the shell exposes a tap-to-insert affordance (mobile only). */
  enabled: boolean;
};

const noopTapInsertionContext: TapInsertionContextValue = {
  cancel: () => {},
  commit: () => {},
  enabled: false,
  stage: () => {},
  staged: null,
};

export const TapInsertionContext = createContext<TapInsertionContextValue>(
  noopTapInsertionContext,
);

export function useTapInsertion(): TapInsertionContextValue {
  return useContext(TapInsertionContext);
}
