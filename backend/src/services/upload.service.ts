import { put, del, head } from '@vercel/blob';
import { prisma } from '../config/database';
import { ApiError, ValidationError } from '../utils/errors';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const BLOB_PUBLIC_PATH_PREFIX = '/receipts/';

function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

function validateBlobUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ValidationError({ url: ['Invalid URL format'] });
  }

  if (!parsed.pathname.startsWith(BLOB_PUBLIC_PATH_PREFIX)) {
    throw new ValidationError({ url: ['URL does not belong to receipts storage'] });
  }
}

export class UploadService {
  async uploadReceipt(userId: string, file: { buffer: Buffer; mimetype: string; originalname: string }): Promise<string> {
    if (!isBlobConfigured()) {
      throw new ApiError(503, 'File uploads are not configured on this server', 'SERVICE_UNAVAILABLE');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new ValidationError({ file: [`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`] });
    }

    if (file.buffer.length > MAX_FILE_SIZE) {
      throw new ValidationError({ file: [`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`] });
    }

    const safeName = sanitizeFilename(file.originalname);
    const key = `receipts/${userId}/${Date.now()}-${safeName}`;

    const blob = await put(key, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
    });

    return blob.url;
  }

  async deleteReceipt(userId: string, url: string): Promise<void> {
    if (!isBlobConfigured()) return;
    validateBlobUrl(url);

    try {
      const blob = await head(url);
      if (!blob.pathname.startsWith(`/receipts/${userId}/`)) {
        throw new ApiError(403, 'You do not have permission to delete this file', 'FORBIDDEN');
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(404, 'File not found', 'NOT_FOUND');
    }

    await prisma.transaction.updateMany({
      where: { receiptUrl: url, userId },
      data: { receiptUrl: null },
    });

    await del(url);
  }
}