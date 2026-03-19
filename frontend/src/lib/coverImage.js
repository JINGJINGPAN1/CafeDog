// Resolves a cover_image value to a displayable src URL.
// Google Places photo refs (e.g. "places/xxx/photos/yyy") go through our backend proxy.
// Other URLs (Cloudinary, external) are used as-is.
export function coverImageSrc(coverImage) {
  if (!coverImage) return '';
  if (coverImage.startsWith('places/')) {
    return `/api/places/photo?ref=${encodeURIComponent(coverImage)}`;
  }
  return coverImage;
}
