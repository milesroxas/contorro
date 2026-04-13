export type {
  CompositionActor,
  CompositionRepository,
  LoadedComposition,
} from "./ports/composition-repository.js";
export { defaultEmptyPageComposition } from "./default-empty-page-composition.js";
export {
  builderNewCompositionSessionId,
  isBuilderNewComponentSessionId,
  isBuilderNewCompositionSessionId,
  parseBuilderNewCompositionSessionId,
  type NewBuilderCompositionKind,
} from "./builder-composition-session.js";
export { clonePageCompositionWithNewIds } from "./graph/clone-composition.js";
export { expandLibraryComponentNodes } from "./graph/expand-library-component-nodes.js";
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
  editorFieldSpecsFromComposition,
  editorFieldsContractFromComposition,
  resolveEditorFieldsContractForDefinition,
} from "./editor-fields-from-composition.js";
export {
  editorFieldsContractBreakingChanges,
  type EditorFieldsContractBreakingReason,
} from "./editor-fields-contract-diff.js";
export {
  mergeEditorFieldValuesIntoComposition,
  validateEditorFieldValues,
} from "./editor-field-values.js";
export {
  DEFAULT_LAYOUT_SLOT_ID,
  collectLayoutSlotIds,
  compositionUsesLayoutSlots,
  normalizedLayoutSlotId,
  orderedLayoutSlotIds,
} from "./layout-slot.js";
export { mergePageContentSlotsToSlotOrder } from "./page-content-slots.js";
export {
  BUILDER_PALETTE_PRIMITIVE_KEYS,
  KNOWN_PRIMITIVE_KEYS,
  defaultPrimitivePropValues,
  isBuilderCreatablePrimitiveKey,
  isBuilderPalettePrimitiveKey,
  isContainerPrimitiveKey,
  isKnownPrimitiveKey,
  primitiveKindForDefinitionKey,
} from "./primitives.js";
