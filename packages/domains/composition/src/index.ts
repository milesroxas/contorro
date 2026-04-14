export type {
  CompositionActor,
  CompositionRepository,
  LoadedComposition,
} from "./ports/composition-repository.js";
export { defaultEmptyPageComposition } from "./default-empty-page-composition.js";
export { defaultPageTemplateComposition } from "./default-page-template-composition.js";
export { normalizeTemplateShell } from "./normalize-template-shell.js";
export {
  studioNewCompositionSessionId,
  isStudioNewComponentSessionId,
  isStudioNewCompositionSessionId,
  parseStudioNewCompositionSessionId,
  type NewStudioCompositionKind,
} from "./studio-composition-session.js";
export {
  componentIdFromStudioRowId,
  isStudioComponentRowId,
  studioRowIdForComponent,
} from "./studio-component-row-id.js";
export { clonePageCompositionWithNewIds } from "./graph/clone-composition.js";
export { expandLibraryComponentNodes } from "./graph/expand-library-component-nodes.js";
export {
  addChildNode,
  clearNodeStyleBinding,
  moveNode,
  removeSubtree,
  resetNodePropKeyToPrimitiveDefault,
  setNodeContentBinding,
  setNodeStyleProperty,
  setNodeTokenStyle,
  updateNodePropValues,
} from "./graph/mutations.js";
export { isPrimitivePropValueModified } from "./primitive-prop-override.js";
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
  STUDIO_PALETTE_PRIMITIVE_KEYS,
  KNOWN_PRIMITIVE_KEYS,
  defaultPrimitivePropValues,
  isStudioCreatablePrimitiveKey,
  isStudioPalettePrimitiveKey,
  isContainerPrimitiveKey,
  isKnownPrimitiveKey,
  primitiveKindForDefinitionKey,
} from "./primitives.js";
export {
  findInvalidStyleTokens,
  stylePropertiesBySectionForDefinitionKey,
  stylePropertyDefaultValueLabel,
  styleSectionLabel,
  styleSectionForProperty,
  stylePropertiesForDefinitionKey,
  stylePropertyLabel,
  type InvalidStyleTokenIssue,
  type StyleSectionId,
} from "./style-authoring.js";
