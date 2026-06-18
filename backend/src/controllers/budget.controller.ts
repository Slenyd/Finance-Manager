import { Response } from 'express';
import { BudgetService } from '../services';
import { AuthenticatedRequest } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const budgetService = new BudgetService();

export class BudgetController {
  findAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const budgets = await budgetService.findAll(req.user!.id);
    res.json({ success: true, data: budgets });
  });

  findById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const budget = await budgetService.findById(req.user!.id, req.params.id);
    res.json({ success: true, data: budget });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const budget = await budgetService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: budget, message: 'Budget created' });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const budget = await budgetService.update(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: budget, message: 'Budget updated' });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await budgetService.delete(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Budget deleted' });
  });
}