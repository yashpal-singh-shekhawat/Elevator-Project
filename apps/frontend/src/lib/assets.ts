// The backend serves uploaded assets (tenant logos) from /uploads at the API
// host root — NOT under the /api/v1 prefix. platformClient/apiClient baseURL is
// like http://localhost:4000/api/v1, so we strip the prefix to get the origin.
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const API_ORIGIN = apiBase.replace(/\/api\/v\d+\/?$/, '');

/**
 * Turn a stored logo path (/uploads/tenant-logos/acme-abcd.png) into a fully
 * qualified URL the browser can load. Returns null for empty/absolute-external
 * inputs so callers can fall back to an initials avatar.
 */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^data:/i.test(path)) return path; // freshly-picked logo (base64 preview)
  if (/^https?:\/\//i.test(path)) return path; // already absolute (future S3)
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}
