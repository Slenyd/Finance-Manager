import { Response, NextFunction } from 'express';
import { BudgetService } from '../services';
import { AuthenticatedRequest } from '../interfaces';

const budgetService = new BudgetService();

export class BudgetController {
  async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const budgets = await budgetService.findAll(req.user!.id);
      res.json({ success: true, data: budgets });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const budget = await budgetService.findById(req.user!.id, req.params.id);
      res.json({ success: true, data: budget });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const budget = await budgetService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: budget, message: 'Budget created' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const budget = await budgetService.update(req.user!.id, req.params.id, req.body);
      res.json({ success: true, data: budget, message: 'Budget updated' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await budgetService.delete(req.user!.id, req.params.id);
      res.json({ success: true, message: 'Budget deleted' });
    } catch (error) {
      next(error);
    }
  }
}
