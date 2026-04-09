import type { CollectionConfig } from "payload";

import { Media } from "./Media.js";
import { Users } from "./Users.js";

export const collections: CollectionConfig[] = [Users, Media];

export { Media, Users };
