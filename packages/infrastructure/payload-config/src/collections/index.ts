import type { CollectionConfig } from "payload";
import { DesignTokenOverrides } from "./DesignTokenOverrides.js";
import { DesignTokenSets } from "./DesignTokenSets.js";
import { Media } from "./Media.js";
import { Users } from "./Users.js";

export const collections: CollectionConfig[] = [
  Users,
  Media,
  DesignTokenSets,
  DesignTokenOverrides,
];

export { DesignTokenOverrides, DesignTokenSets, Media, Users };
