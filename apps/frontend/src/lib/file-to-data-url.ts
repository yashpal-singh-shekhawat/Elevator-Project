// Read a File (from an <input type="file">) into a base64 data URL that the
// backend's saveTenantLogo() accepts. Kept tiny + dependency-free.
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // mirror backend limit (2 MB)

export function validateLogoFile(file: File): string | null {
  if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
    return 'Logo must be a PNG, JPG, WEBP or SVG image';
  }
  if (file.size > MAX_LOGO_BYTES) {
    return 'Logo must be 2 MB or smaller';
  }
  return null;
}
