import { Response } from 'express';
import { UploadService } from '../services/upload.service';
import { AuthenticatedRequest } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/errors';

const uploadService = new UploadService();

export class UploadController {
  uploadReceipt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new BadRequestError('No file provided');
    }

    const url = await uploadService.uploadReceipt(req.user!.id, {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
    });

    res.status(201).json({ success: true, data: { url }, message: 'File uploaded' });
  });

  deleteReceipt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { url } = req.body;
    if (!url) {
      throw new BadRequestError('No URL provided');
    }

    await uploadService.deleteReceipt(req.user!.id, url);
    res.json({ success: true, message: 'File deleted' });
  });
}