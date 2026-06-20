import { Response } from 'express';
import { CategoryService } from '../services';
import { AuthorizedRequest, ApiResponse, Category, CreateCategoryData, UpdateCategoryData } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const categoryService = new CategoryService();

export class CategoryController {
  findAll = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=300');
    const categories = await categoryService.findAll(req.user.id);
    res.json({ success: true, data: categories } satisfies ApiResponse<Category[]>);
  });

  findById = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    res.set('Cache-Control', 'private, max-age=300');
    const category = await categoryService.findById(req.user.id, req.params.id);
    res.json({ success: true, data: category } satisfies ApiResponse<Category>);
  });

  create = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const category = await categoryService.create(req.user.id, req.body as CreateCategoryData);
    res.status(201).json({ success: true, data: category, message: 'Category created' } satisfies ApiResponse);
  });

  update = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const category = await categoryService.update(req.user.id, req.params.id, req.body as UpdateCategoryData);
    res.json({ success: true, data: category, message: 'Category updated' } satisfies ApiResponse);
  });

  delete = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    await categoryService.delete(req.user.id, req.params.id);
    res.json({ success: true, data: null, message: 'Category deleted' } satisfies ApiResponse<null>);
  });
}