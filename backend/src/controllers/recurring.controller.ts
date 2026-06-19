import { Response } from 'express';
import { RecurringService } from '../services';
import { AuthenticatedRequest } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const recurringService = new RecurringService();

export class RecurringController {
  findAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const recurring = await recurringService.findAll(req.user!.id);
    res.json({ success: true, data: recurring });
  });

  findById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const recurring = await recurringService.findById(req.user!.id, req.params.id);
    res.json({ success: true, data: recurring });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const recurring = await recurringService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: recurring, message: 'Recurring transaction created' });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const recurring = await recurringService.update(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: recurring, message: 'Recurring transaction updated' });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await recurringService.delete(req.user!.id, req.params.id);
    res.json({ success: true, data: null, message: 'Recurring transaction deleted' });
  });
}