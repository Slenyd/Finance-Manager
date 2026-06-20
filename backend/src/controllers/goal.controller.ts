import { Response } from 'express';
import { GoalService } from '../services';
import { AuthorizedRequest, ApiResponse, SavingsGoalWithProgress, CreateGoalData, UpdateGoalData } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const goalService = new GoalService();

export class GoalController {
  findAll = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const goals = await goalService.findAll(req.user.id);
    res.json({ success: true, data: goals } satisfies ApiResponse<SavingsGoalWithProgress[]>);
  });

  findById = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const goal = await goalService.findById(req.user.id, req.params.id);
    res.json({ success: true, data: goal } satisfies ApiResponse<SavingsGoalWithProgress>);
  });

  create = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const goal = await goalService.create(req.user.id, req.body as CreateGoalData);
    res.status(201).json({ success: true, data: goal, message: 'Goal created' } satisfies ApiResponse);
  });

  update = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const goal = await goalService.update(req.user.id, req.params.id, req.body as UpdateGoalData);
    res.json({ success: true, data: goal, message: 'Goal updated' } satisfies ApiResponse);
  });

  delete = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    await goalService.delete(req.user.id, req.params.id);
    res.json({ success: true, data: null, message: 'Goal deleted' } satisfies ApiResponse<null>);
  });

  contribute = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const goal = await goalService.contribute(req.user.id, req.params.id, req.body.amount);
    res.json({ success: true, data: goal, message: 'Contribution added' } satisfies ApiResponse);
  });
}