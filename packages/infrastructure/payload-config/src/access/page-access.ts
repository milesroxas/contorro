import type { Access } from "payload";

import { composerAuthoringAccess } from "./composition-access.js";
import { designerOrAdminAccess } from "./design-system-access.js";

/** Authenticated users (admin) see all versions; anonymous traffic is limited to published docs. */
export const pagesReadAccess: Access = ({ req: { user } }) => {
  if (user) {
    return true;
  }
  return { _status: { equals: "published" } };
};

export const pagesCreateAccess = composerAuthoringAccess;

export const pagesUpdateAccess = composerAuthoringAccess;

export const pagesDeleteAccess = designerOrAdminAccess;
