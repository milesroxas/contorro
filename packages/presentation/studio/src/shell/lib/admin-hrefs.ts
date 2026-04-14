/** Build Payload admin URLs for the Studio shell (same-origin, no Payload SDK in the package). */

export function adminCollectionsIndexHref(
  adminRoute: string,
  collectionSlug: string,
): string {
  const base = adminRoute.replace(/\/$/, "");
  return `${base}/collections/${collectionSlug}`;
}

export function adminDocumentHref(
  adminRoute: string,
  collectionSlug: string,
  documentId: string,
): string {
  return `${adminCollectionsIndexHref(adminRoute, collectionSlug)}/${encodeURIComponent(documentId)}`;
}
