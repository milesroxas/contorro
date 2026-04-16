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
  duplicateNode,
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
export { resolvedPrimitiveMediaSrc } from "./resolved-primitive-media-src.js";
export { resolvedPrefixedMediaSrc } from "./resolved-prefixed-media-src.js";
export {
  BACKGROUND_IMAGE_ATTACHMENT_OPTIONS,
  BACKGROUND_IMAGE_CLIP_OPTIONS,
  BACKGROUND_IMAGE_ORIGIN_OPTIONS,
  BACKGROUND_IMAGE_POSITION_OPTIONS,
  BACKGROUND_IMAGE_REPEAT_OPTIONS,
  BACKGROUND_IMAGE_SIZE_OPTIONS,
  BOX_BACKGROUND_IMAGE_TAILWIND_SAFESET,
  type BoxBackgroundImageStylePropKey,
  normalizedBackgroundImageAttachment,
  normalizedBackgroundImageClip,
  normalizedBackgroundImageOrigin,
  normalizedBackgroundImagePosition,
  normalizedBackgroundImageRepeat,
  normalizedBackgroundImageSize,
  type ResolvedBoxBackgroundImagePresentation,
  resolvedBoxBackgroundImagePresentation,
} from "./box-background-image-style.js";
export { findNearestCollectionAncestorNodeId } from "./collection-ancestor.js";
export {
  type CollectionFieldBindingKind,
  type CollectionFieldBindingSelectRow,
  collectionFieldBindingSelectRows,
  isCollectionFieldKindCompatibleWithPrimitive,
  primitiveSupportsCollectionFieldBinding,
} from "./collection-primitive-field-binding.js";
export {
  mediaUrlFromCollectionValue,
  resolvePrimitiveButtonLabel,
  resolvePrimitiveImageSrcAlt,
  resolvePrimitiveTextContent,
  resolvePrimitiveVideoSrc,
  stringFromCollectionFieldValue,
  valueAtJsonPath,
} from "./collection-field-resolution.js";
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
