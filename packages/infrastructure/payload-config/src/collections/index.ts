import type { CollectionConfig } from "payload";
import { Components } from "./Components.js";
import { DesignTokenSets } from "./DesignTokenSets.js";
import { Media } from "./Media.js";
import { PageCompositions } from "./PageCompositions.js";
import { Pages } from "./Pages.js";
import { Users } from "./Users.js";

export const collections: CollectionConfig[] = [
  Pages,
  Users,
  Media,
  DesignTokenSets,
  Components,
  PageCompositions,
];

export { Components, DesignTokenSets, Media, PageCompositions, Pages, Users };
