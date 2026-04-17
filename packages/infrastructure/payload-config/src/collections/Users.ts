import type { CollectionConfig } from "payload";

import { roleFromRequest } from "../access/jwt-user-role.js";

/** Matches capability matrix personas (architecture spec §5.2). */
export const userRoleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Designer", value: "designer" },
  { label: "Content Editor", value: "contentEditor" },
  { label: "Engineer", value: "engineer" },
] as const;

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    group: "Settings",
    useAsTitle: "email",
  },
  auth: true,
  access: {
    create: ({ req }) => roleFromRequest(req) === "admin",
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req, id }) => {
      if (!req.user) {
        return false;
      }
      if (roleFromRequest(req) === "admin") {
        return true;
      }
      if (id === undefined) {
        return false;
      }
      return String(req.user.id) === String(id);
    },
    delete: ({ req }) => roleFromRequest(req) === "admin",
  },
  fields: [
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "contentEditor",
      options: [...userRoleOptions],
      saveToJWT: true,
      access: {
        create: ({ req }) => roleFromRequest(req) === "admin",
        update: ({ req }) => roleFromRequest(req) === "admin",
      },
    },
  ],
};
