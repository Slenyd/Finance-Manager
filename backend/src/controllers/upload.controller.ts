import { Response } from 'express';
import { UploadService } from '../services/upload.service';
import { AuthenticatedRequest } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const uploadService = new UploadService();

export class UploadController {
  uploadReceipt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file provided', code: 'NO_FILE' });
      return;
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
      res.status(400).json({ success: false, message: 'No URL provided', code: 'NO_URL' });
      return;
    }

    await uploadService.deleteReceipt(url);
    res.json({ success: true, message: 'File deleted' });
  });
}