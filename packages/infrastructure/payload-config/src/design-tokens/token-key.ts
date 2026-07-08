/** Matches architecture spec §5.3 — `{category}.{name}` or `{category}.{scale}.{name}`. */
const TOKEN_KEY_REGEX = /^[a-z]+(\.[a-z0-9]+)+$/;

export function isValidTokenKey(key: string): boolean {
  return TOKEN_KEY_REGEX.test(key);
}
