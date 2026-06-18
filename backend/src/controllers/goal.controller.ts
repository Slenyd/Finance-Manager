import { Response } from 'express';
import { GoalService } from '../services';
import { AuthenticatedRequest } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const goalService = new GoalService();

export class GoalController {
  findAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const goals = await goalService.findAll(req.user!.id);
    res.json({ success: true, data: goals });
  });

  findById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const goal = await goalService.findById(req.user!.id, req.params.id);
    res.json({ success: true, data: goal });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const goal = await goalService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: goal, message: 'Goal created' });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const goal = await goalService.update(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: goal, message: 'Goal updated' });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await goalService.delete(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Goal deleted' });
  });

  contribute = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const goal = await goalService.contribute(req.user!.id, req.params.id, req.body.amount);
    res.json({ success: true, data: goal, message: 'Contribution added' });
  });
}