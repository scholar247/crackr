import path from 'node:path';
import { mediaConfig } from '@/lib/media-config';

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaValidationError';
  }
}

/**
 * Strips directory components and unsafe characters from a user-supplied filename before
 * it's persisted as *metadata only* — this value is never used to build a filesystem
 * path (the storage key, generated separately, does that job). Still worth sanitizing
 * because it round-trips into a `Content-Disposition` header on the /content route,
 * where a raw CR/LF or quote could be used for header injection.
 */
export function sanitizeFilename(raw: string): string {
  const base = path.basename(raw).replace(/[\r\n"\\]/g, '').trim();
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '');
  const safe = cleaned.length > 0 ? cleaned : 'file';
  return safe.slice(0, 255);
}

/** Lowercase extension without the leading dot, or null if there isn't a sane one. */
export function deriveExtension(sanitizedFilename: string): string | null {
  const ext = path.extname(sanitizedFilename).slice(1).toLowerCase();
  return /^[a-z0-9]{1,16}$/.test(ext) ? ext : null;
}

export function isAllowedMimeType(mimeType: string): boolean {
  // An empty allowlist means "don't restrict by type" (MEDIA_ALLOWED_MIME_TYPES=*) — see
  // media-config.ts.
  if (mediaConfig.allowedMimeTypes.length === 0) return true;
  return mediaConfig.allowedMimeTypes.includes(mimeType.toLowerCase());
}

// Minimal magic-byte table covering the formats this product actually needs today.
// Deliberately not a full file-type-sniffing library (no new dependency) — `sniffMimeType`
// is the single seam where one (e.g. the `file-type` npm package) could be swapped in
// later without touching any caller.
type Signature = { bytes: number[]; offset?: number; mimeType: string };
const SIGNATURES: Signature[] = [
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mimeType: 'image/png' },
  { bytes: [0xff, 0xd8, 0xff], mimeType: 'image/jpeg' },
  { bytes: [0x47, 0x49, 0x46, 0x38], mimeType: 'image/gif' },
  { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], mimeType: 'application/pdf' },
  // ZIP local-file-header — also the container format for docx/xlsx/pptx. Magic bytes
  // alone can't distinguish the OOXML subtype from a plain .zip, so this resolves to the
  // generic container marker; validateUpload() below treats any zip-container *declared*
  // MIME type as consistent with this signature rather than demanding an exact match.
  { bytes: [0x50, 0x4b, 0x03, 0x04], mimeType: 'application/zip' },
  // Legacy OLE compound file — container for pre-2007 .doc/.xls/.ppt. Same
  // can't-tell-the-subtype caveat as the zip case above.
  { bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], mimeType: 'application/x-ole-storage' },
];

const ZIP_CONTAINER_MIME_TYPES = new Set([
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);
const OLE_CONTAINER_MIME_TYPES = new Set(['application/x-ole-storage', 'application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint']);

/**
 * Inspects the first bytes of the upload instead of trusting the client-supplied
 * Content-Type. Returns null when the format isn't in SIGNATURES (e.g. plain text has no
 * reliable magic bytes) — callers should fall back to the declared type in that case, not
 * treat null as a rejection.
 */
export function sniffMimeType(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) continue;
    const matches = sig.bytes.every((byte, i) => buffer[offset + i] === byte);
    if (matches) return sig.mimeType;
  }
  // WEBP: "RIFF" .... "WEBP" — the middle 4 bytes are a length field, not a fixed
  // signature, so it can't live in the flat SIGNATURES table above.
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export interface UploadValidationInput {
  buffer: Buffer;
  declaredMimeType: string;
  sanitizedFilename: string;
}

export interface UploadValidationResult {
  mimeType: string;
  extension: string | null;
}

/** Throws MediaValidationError with a user-safe message on any failure. */
export function validateUpload(input: UploadValidationInput): UploadValidationResult {
  const { buffer, declaredMimeType, sanitizedFilename } = input;

  if (buffer.length === 0) throw new MediaValidationError('Empty files cannot be uploaded');
  if (buffer.length > mediaConfig.maxFileSize) {
    throw new MediaValidationError(`File exceeds the maximum allowed size of ${Math.floor(mediaConfig.maxFileSize / (1024 * 1024))} MB`);
  }

  const declared = declaredMimeType.toLowerCase().trim() || 'application/octet-stream';
  const sniffed = sniffMimeType(buffer);

  if (sniffed) {
    const sameFamily = sniffed === declared || (ZIP_CONTAINER_MIME_TYPES.has(sniffed) && ZIP_CONTAINER_MIME_TYPES.has(declared)) || (OLE_CONTAINER_MIME_TYPES.has(sniffed) && OLE_CONTAINER_MIME_TYPES.has(declared));
    if (!sameFamily) {
      throw new MediaValidationError('File content does not match its declared type');
    }
  }

  // Validate against the allowlist using the *declared* type — sniffing only exists to
  // catch spoofing above, not to widen what's accepted (an unsniffable-but-allowlisted
  // type like text/plain should still pass).
  if (!isAllowedMimeType(declared)) {
    throw new MediaValidationError(`File type "${declared}" is not allowed`);
  }

  return { mimeType: declared, extension: deriveExtension(sanitizedFilename) };
}
