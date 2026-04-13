import type { RuntimeRegistry } from "@repo/domains-runtime-catalog";

import { Box } from "./box.js";
import { Button } from "./button.js";
import { Grid } from "./grid.js";
import { Heading } from "./heading.js";
import { Image } from "./image.js";
import { LibraryComponent } from "./library-component.js";
import { Slot } from "./slot.js";
import { Stack } from "./stack.js";
import { Text } from "./text.js";

export {
  Box,
  Button,
  Grid,
  Heading,
  Image,
  LibraryComponent,
  Slot,
  Stack,
  Text,
};

/** Default `definitionKey` → primitive mapping (Phase 2). */
export const defaultPrimitiveRegistry: RuntimeRegistry = {
  "primitive.box": Box,
  "primitive.text": Text,
  "primitive.heading": Heading,
  "primitive.button": Button,
  "primitive.stack": Stack,
  "primitive.grid": Grid,
  "primitive.image": Image,
  "primitive.slot": Slot,
  "primitive.libraryComponent": LibraryComponent,
};
