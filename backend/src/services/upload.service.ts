import { put, del } from '@vercel/blob';
import { NotFoundError } from '../utils/errors';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export class UploadService {
  async uploadReceipt(userId: string, file: { buffer: Buffer; mimetype: string; originalname: string }): Promise<string> {
    if (!isBlobConfigured()) {
      throw new NotFoundError('File uploads are not configured on this server');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    if (file.buffer.length > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const key = `receipts/${userId}/${Date.now()}-${file.originalname}`;

    const blob = await put(key, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
    });

    return blob.url;
  }

  async deleteReceipt(url: string): Promise<void> {
    if (!isBlobConfigured()) return;
    await del(url);
  }
}