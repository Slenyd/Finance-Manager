import { Response } from 'express';
import { RecurringService } from '../services';
import { AuthorizedRequest, ApiResponse, RecurringTransaction, CreateRecurringData, UpdateRecurringData } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const recurringService = new RecurringService();

export class RecurringController {
  findAll = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const recurring = await recurringService.findAll(req.user.id);
    res.json({ success: true, data: recurring } satisfies ApiResponse<RecurringTransaction[]>);
  });

  findById = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const recurring = await recurringService.findById(req.user.id, req.params.id);
    res.json({ success: true, data: recurring } satisfies ApiResponse<RecurringTransaction>);
  });

  create = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const recurring = await recurringService.create(req.user.id, req.body as CreateRecurringData);
    res.status(201).json({ success: true, data: recurring, message: 'Recurring transaction created' } satisfies ApiResponse);
  });

  update = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const recurring = await recurringService.update(req.user.id, req.params.id, req.body as UpdateRecurringData);
    res.json({ success: true, data: recurring, message: 'Recurring transaction updated' } satisfies ApiResponse);
  });

  delete = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    await recurringService.delete(req.user.id, req.params.id);
    res.json({ success: true, data: null, message: 'Recurring transaction deleted' } satisfies ApiResponse<null>);
  });
}