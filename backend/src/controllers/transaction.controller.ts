import { Response } from 'express';
import { TransactionService } from '../services';
import { AuthenticatedRequest, TransactionQuery } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const transactionService = new TransactionService();

export class TransactionController {
  findAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await transactionService.findAll(req.user!.id, req.query as unknown as TransactionQuery);
    res.json({ success: true, data: result.data, meta: result.meta });
  });

  findById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const transaction = await transactionService.findById(req.user!.id, req.params.id);
    res.json({ success: true, data: transaction });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const transaction = await transactionService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: transaction, message: 'Transaction created' });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const transaction = await transactionService.update(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: transaction, message: 'Transaction updated' });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await transactionService.delete(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Transaction deleted' });
  });

  bulkDelete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await transactionService.bulkDelete(req.user!.id, req.body.ids);
    res.json({ success: true, message: 'Transactions deleted' });
  });

  getSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const summary = await transactionService.getSummary(req.user!.id, startDate, endDate);
    res.json({ success: true, data: summary });
  });
}