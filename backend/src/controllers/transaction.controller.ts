import { Response, NextFunction } from 'express';
import { TransactionService } from '../services';
import { AuthenticatedRequest, TransactionQuery } from '../interfaces';

const transactionService = new TransactionService();

export class TransactionController {
  async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.findAll(req.user!.id, req.query as unknown as TransactionQuery);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.findById(req.user!.id, req.params.id);
      res.json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: transaction, message: 'Transaction created' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.update(req.user!.id, req.params.id, req.body);
      res.json({ success: true, data: transaction, message: 'Transaction updated' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await transactionService.delete(req.user!.id, req.params.id);
      res.json({ success: true, message: 'Transaction deleted' });
    } catch (error) {
      next(error);
    }
  }

  async bulkDelete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await transactionService.bulkDelete(req.user!.id, req.body.ids);
      res.json({ success: true, message: 'Transactions deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const summary = await transactionService.getSummary(req.user!.id, startDate, endDate);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}
