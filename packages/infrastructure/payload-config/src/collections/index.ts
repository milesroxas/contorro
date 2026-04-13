import type { CollectionConfig } from "payload";
import { CatalogActivity } from "./CatalogActivity.js";
import { Components } from "./Components.js";
import { CompositionPresence } from "./CompositionPresence.js";
import { DesignTokenSets } from "./DesignTokenSets.js";
import { Media } from "./Media.js";
import { PageCompositions } from "./PageCompositions.js";
import { Pages } from "./Pages.js";
import { PublishJobs } from "./PublishJobs.js";
import { ReleaseSnapshots } from "./ReleaseSnapshots.js";
import { Users } from "./Users.js";

export const collections: CollectionConfig[] = [
  Pages,
  Users,
  Media,
  DesignTokenSets,
  Components,
  PageCompositions,
  ReleaseSnapshots,
  PublishJobs,
  CatalogActivity,
  CompositionPresence,
];

export {
  CatalogActivity,
  Components,
  CompositionPresence,
  DesignTokenSets,
  Media,
  PageCompositions,
  Pages,
  PublishJobs,
  ReleaseSnapshots,
  Users,
};
