import { nanoid } from "nanoid";

export type BrandedId<T extends string> = string & { __brand: T };
export const makeId = <T extends string>(): BrandedId<T> =>
  nanoid() as BrandedId<T>;
