import type { CollectionConfig } from "payload";
import { CatalogActivity } from "./CatalogActivity.js";
import { ComponentDefinitions } from "./ComponentDefinitions.js";
import { ComponentRevisions } from "./ComponentRevisions.js";
import { CompositionPresence } from "./CompositionPresence.js";
import { DesignTokenOverrides } from "./DesignTokenOverrides.js";
import { DesignTokenSets } from "./DesignTokenSets.js";
import { Media } from "./Media.js";
import { PageCompositions } from "./PageCompositions.js";
import { Pages } from "./Pages.js";
import { PublishJobs } from "./PublishJobs.js";
import { ReleaseSnapshots } from "./ReleaseSnapshots.js";
import { Templates } from "./Templates.js";
import { Users } from "./Users.js";

export const collections: CollectionConfig[] = [
  Users,
  Media,
  DesignTokenSets,
  DesignTokenOverrides,
  ComponentDefinitions,
  ComponentRevisions,
  PageCompositions,
  Templates,
  Pages,
  ReleaseSnapshots,
  PublishJobs,
  CatalogActivity,
  CompositionPresence,
];

export {
  CatalogActivity,
  ComponentDefinitions,
  ComponentRevisions,
  CompositionPresence,
  DesignTokenOverrides,
  DesignTokenSets,
  Media,
  PageCompositions,
  Pages,
  PublishJobs,
  ReleaseSnapshots,
  Templates,
  Users,
};
