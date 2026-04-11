import { getTestPayload } from "./getTestPayload.js";

export const testUser = {
  email: "dev@payloadcms.com",
  password: "test",
};

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getTestPayload();

  await payload.delete({
    collection: "users",
    where: {
      email: {
        equals: testUser.email,
      },
    },
  });

  await payload.create({
    collection: "users",
    data: {
      ...testUser,
      role: "admin",
    },
  });
}

/**
 * Cleans up test user after tests.
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getTestPayload();

  await payload.delete({
    collection: "users",
    where: {
      email: {
        equals: testUser.email,
      },
    },
  });
}
