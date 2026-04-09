import type { CollectionConfig } from "payload";

/** Matches capability matrix personas (architecture spec §5.2). */
export const userRoleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Designer", value: "designer" },
  { label: "Content Editor", value: "contentEditor" },
  { label: "Engineer", value: "engineer" },
] as const;

/** RBAC: role must live on the JWT for access checks (Payload access-control docs / template AGENTS.md). */
function isAdminUser(user: unknown): boolean {
  return (
    typeof user === "object" &&
    user !== null &&
    "role" in user &&
    (user as { role: unknown }).role === "admin"
  );
}

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  access: {
    create: ({ req: { user } }) => isAdminUser(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user }, id }) => {
      if (!user) return false;
      if (isAdminUser(user)) return true;
      if (id === undefined) return false;
      return String(user.id) === String(id);
    },
    delete: ({ req: { user } }) => isAdminUser(user),
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
        create: ({ req: { user } }) => isAdminUser(user),
        update: ({ req: { user } }) => isAdminUser(user),
      },
    },
  ],
};
