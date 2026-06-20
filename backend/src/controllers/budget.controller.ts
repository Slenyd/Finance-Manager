import { Response } from 'express';
import { BudgetService } from '../services';
import { AuthorizedRequest, ApiResponse, BudgetWithSpent, CreateBudgetData, UpdateBudgetData } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const budgetService = new BudgetService();

export class BudgetController {
  findAll = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=30');
    const budgets = await budgetService.findAll(req.user.id);
    res.json({ success: true, data: budgets } satisfies ApiResponse<BudgetWithSpent[]>);
  });

  findById = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=30');
    const budget = await budgetService.findById(req.user.id, req.params.id);
    res.json({ success: true, data: budget } satisfies ApiResponse<BudgetWithSpent>);
  });

  create = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const budget = await budgetService.create(req.user.id, req.body as CreateBudgetData);
    res.status(201).json({ success: true, data: budget, message: 'Budget created' } satisfies ApiResponse);
  });

  update = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const budget = await budgetService.update(req.user.id, req.params.id, req.body as UpdateBudgetData);
    res.json({ success: true, data: budget, message: 'Budget updated' } satisfies ApiResponse);
  });

  delete = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    await budgetService.delete(req.user.id, req.params.id);
    res.json({ success: true, data: null, message: 'Budget deleted' } satisfies ApiResponse<null>);
  });
}