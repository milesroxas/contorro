export {
  type CreateCompositionEntryError,
  createCompositionEntryCommand,
} from "./commands/create-composition-entry.js";
export {
  type RenameTemplateError,
  renameTemplateCommand,
} from "./commands/rename-template.js";
export {
  type SaveCompositionError,
  saveCompositionCommand,
} from "./commands/save-composition.js";
export type {
  StudioCompositionRevision,
  StudioMutationRepository,
} from "./ports/studio-mutation-repository.js";
