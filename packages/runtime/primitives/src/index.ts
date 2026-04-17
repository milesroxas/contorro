import type { RuntimeRegistry } from "@repo/domains-runtime-catalog";

import { Box } from "./box.js";
import { Button } from "./button.js";
import { Collection } from "./collection.js";
import { Heading } from "./heading.js";
import { Image } from "./image.js";
import { LibraryComponent } from "./library-component.js";
import { PrimitiveEmptyState } from "./primitive-empty-state.js";
import { Section } from "./section.js";
import { Slot } from "./slot.js";
import { Text } from "./text.js";
import { Video } from "./video.js";

export {
  CollectionItemDocProvider,
  useOptionalCollectionItemDoc,
} from "./collection-item-context.js";
export type {
  PrimitiveEmptyStateProps,
  PrimitiveEmptyStateVariant,
} from "./primitive-empty-state.js";
export {
  Box,
  Button,
  Collection,
  Heading,
  Image,
  LibraryComponent,
  PrimitiveEmptyState,
  Section,
  Slot,
  Text,
  Video,
};

/** Default `definitionKey` → primitive mapping. */
export const defaultPrimitiveRegistry: RuntimeRegistry = {
  "primitive.box": Box,
  "primitive.section": Section,
  "primitive.text": Text,
  "primitive.heading": Heading,
  "primitive.button": Button,
  "primitive.image": Image,
  "primitive.video": Video,
  "primitive.collection": Collection,
  "primitive.slot": Slot,
  "primitive.libraryComponent": LibraryComponent,
};
