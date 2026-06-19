import { Response } from 'express';
import { CategoryService } from '../services';
import { AuthenticatedRequest } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const categoryService = new CategoryService();

export class CategoryController {
  findAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const categories = await categoryService.findAll(req.user!.id);
    res.json({ success: true, data: categories });
  });

  findById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await categoryService.findById(req.user!.id, req.params.id);
    res.json({ success: true, data: category });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await categoryService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: category, message: 'Category created' });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await categoryService.update(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: category, message: 'Category updated' });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await categoryService.delete(req.user!.id, req.params.id);
    res.json({ success: true, data: null, message: 'Category deleted' });
  });
}