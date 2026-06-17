import { Response, NextFunction } from 'express';
import { CategoryService } from '../services';
import { AuthenticatedRequest } from '../interfaces';

const categoryService = new CategoryService();

export class CategoryController {
  async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await categoryService.findAll(req.user!.id);
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.findById(req.user!.id, req.params.id);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: category, message: 'Category created' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.update(req.user!.id, req.params.id, req.body);
      res.json({ success: true, data: category, message: 'Category updated' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await categoryService.delete(req.user!.id, req.params.id);
      res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
      next(error);
    }
  }
}
