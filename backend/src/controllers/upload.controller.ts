import { Response } from 'express';
import { Readable } from 'node:stream';
import { UploadService } from '../services/upload.service';
import { AuthorizedRequest, ApiResponse } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/errors';

const uploadService = new UploadService();

export class UploadController {
  uploadReceipt = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    if (!req.file) {
      throw new BadRequestError('No file provided');
    }

    const url = await uploadService.uploadReceipt(req.user.id, {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
    });

    res.status(201).json({ success: true, data: { url }, message: 'File uploaded' } satisfies ApiResponse<{ url: string }>);
  });

  deleteReceipt = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const { url } = req.body;
    if (!url) {
      throw new BadRequestError('No URL provided');
    }

    await uploadService.deleteReceipt(req.user.id, url);
    res.json({ success: true, data: null, message: 'File deleted' } satisfies ApiResponse<null>);
  });

  getReceipt = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const url = req.query.url as string | undefined;
    if (!url) {
      throw new BadRequestError('No URL provided');
    }

    const { stream, contentType, size } = await uploadService.getReceiptStream(req.user.id, url);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', size.toString());
    res.setHeader('Content-Disposition', 'inline');

    Readable.fromWeb(stream).pipe(res);
  });
}