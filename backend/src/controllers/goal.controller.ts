import { Response, NextFunction } from 'express';
import { GoalService } from '../services';
import { AuthenticatedRequest } from '../interfaces';

const goalService = new GoalService();

export class GoalController {
  async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const goals = await goalService.findAll(req.user!.id);
      res.json({ success: true, data: goals });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const goal = await goalService.findById(req.user!.id, req.params.id);
      res.json({ success: true, data: goal });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const goal = await goalService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: goal, message: 'Goal created' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const goal = await goalService.update(req.user!.id, req.params.id, req.body);
      res.json({ success: true, data: goal, message: 'Goal updated' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await goalService.delete(req.user!.id, req.params.id);
      res.json({ success: true, message: 'Goal deleted' });
    } catch (error) {
      next(error);
    }
  }

  async contribute(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const goal = await goalService.contribute(req.user!.id, req.params.id, req.body.amount);
      res.json({ success: true, data: goal, message: 'Contribution added' });
    } catch (error) {
      next(error);
    }
  }
}
