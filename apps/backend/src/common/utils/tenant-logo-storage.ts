import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { BadRequestError } from '@common/errors';

// ---------------------------------------------------------------------------
// Local tenant-logo storage (MVP). The frontend sends the logo as a base64
// data URL in the JSON body; we decode it and write a file under
// apps/backend/uploads/tenant-logos, returning ONLY the public relative path
// (served by express.static at /uploads). No multer, no cloud SDK.
//
// FUTURE: to move to S3, replace saveTenantLogo's body with an S3 PutObject and
// return the object URL — the returned string is all any caller depends on.
// ---------------------------------------------------------------------------

export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
const TENANT_LOGO_DIR = path.join(UPLOADS_ROOT, 'tenant-logos');
const PUBLIC_PREFIX = '/uploads/tenant-logos';

// data:image/png;base64,AAAA...  -> { mime, ext, buffer }
const DATA_URL_RE = /^data:(image\/(png|jpe?g|webp|svg\+xml));base64,(.+)$/i;
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg'
};

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB — plenty for a logo

// A malformed/oversized logo is a client error (400), so it extends
// BadRequestError and the global error handler renders it correctly.
export class InvalidLogoError extends BadRequestError {}

/**
 * Persists a base64 data-URL logo to disk and returns its public path.
 * Returns undefined when no logo was provided (caller keeps the existing one).
 */
export async function saveTenantLogo(dataUrl: string | undefined, slug: string): Promise<string | undefined> {
  if (!dataUrl) return undefined;

  const match = DATA_URL_RE.exec(dataUrl.trim());
  if (!match) {
    throw new InvalidLogoError('Logo must be a base64-encoded PNG, JPG, WEBP or SVG image');
  }

  const mime = match[1].toLowerCase();
  const ext = EXT_BY_MIME[mime] ?? 'png';
  const buffer = Buffer.from(match[3], 'base64');

  if (buffer.byteLength === 0) throw new InvalidLogoError('Logo image is empty');
  if (buffer.byteLength > MAX_BYTES) throw new InvalidLogoError('Logo must be 2 MB or smaller');

  await fs.mkdir(TENANT_LOGO_DIR, { recursive: true });

  // Slug keeps the filename human-readable; a short random suffix avoids
  // collisions and lets the browser cache-bust on re-upload.
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'tenant';
  const fileName = `${safeSlug}-${randomUUID().slice(0, 8)}.${ext}`;
  await fs.writeFile(path.join(TENANT_LOGO_DIR, fileName), buffer);

  return `${PUBLIC_PREFIX}/${fileName}`;
}
