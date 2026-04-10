import type { CollectionConfig } from "payload";
import { ComponentDefinitions } from "./ComponentDefinitions.js";
import { ComponentRevisions } from "./ComponentRevisions.js";
import { DesignTokenOverrides } from "./DesignTokenOverrides.js";
import { DesignTokenSets } from "./DesignTokenSets.js";
import { Media } from "./Media.js";
import { PageCompositions } from "./PageCompositions.js";
import { Users } from "./Users.js";

export const collections: CollectionConfig[] = [
  Users,
  Media,
  DesignTokenSets,
  DesignTokenOverrides,
  ComponentDefinitions,
  ComponentRevisions,
  PageCompositions,
];

export {
  ComponentDefinitions,
  ComponentRevisions,
  DesignTokenOverrides,
  DesignTokenSets,
  Media,
  PageCompositions,
  Users,
};
