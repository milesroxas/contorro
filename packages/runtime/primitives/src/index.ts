import type { RuntimeRegistry } from "@repo/domains-runtime-catalog";

import { Box } from "./box.js";
import { Grid } from "./grid.js";
import { Image } from "./image.js";
import { Stack } from "./stack.js";
import { Text } from "./text.js";

export { Box, Grid, Image, Stack, Text };

/** Default `definitionKey` → primitive mapping (Phase 2). */
export const defaultPrimitiveRegistry: RuntimeRegistry = {
  "primitive.box": Box,
  "primitive.text": Text,
  "primitive.stack": Stack,
  "primitive.grid": Grid,
  "primitive.image": Image,
};
