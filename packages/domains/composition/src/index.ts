export type {
  CompositionActor,
  CompositionRepository,
  LoadedComposition,
} from "./ports/composition-repository.js";
export { clonePageCompositionWithNewIds } from "./graph/clone-composition.js";
export {
  addChildNode,
  moveNode,
  removeSubtree,
  setNodeContentBinding,
  setNodeTokenStyle,
  updateNodePropValues,
} from "./graph/mutations.js";
export { validatePageCompositionInvariants } from "./validation/page-composition.js";
export {
  editorSlotContractFromComposition,
  resolveEditorSlotContractForDefinition,
  slotDefinitionsFromComposition,
} from "./slot-definitions.js";
export {
  slotContractBreakingChanges,
  type SlotContractBreakingReason,
} from "./slot-contract-diff.js";
export {
  mergeSlotValuesIntoComposition,
  validateEditorSlotValues,
} from "./graph/slot-substitution.js";
