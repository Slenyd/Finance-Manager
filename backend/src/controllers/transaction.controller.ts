import { Response } from 'express';
import { TransactionService } from '../services';
import { AuthorizedRequest, TransactionQuery, ApiResponse, TransactionSummary } from '../interfaces';
import { asyncHandler } from '../utils/asyncHandler';

const transactionService = new TransactionService();

export class TransactionController {
  findAll = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const result = await transactionService.findAll(req.user.id, req.query as unknown as TransactionQuery);
    res.json({ success: true, data: result.data, meta: result.meta } satisfies ApiResponse);
  });

  findById = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const transaction = await transactionService.findById(req.user.id, req.params.id);
    res.json({ success: true, data: transaction } satisfies ApiResponse);
  });

  create = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const transaction = await transactionService.create(req.user.id, req.body);
    res.status(201).json({ success: true, data: transaction, message: 'Transaction created' } satisfies ApiResponse);
  });

  update = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const transaction = await transactionService.update(req.user.id, req.params.id, req.body);
    res.json({ success: true, data: transaction, message: 'Transaction updated' } satisfies ApiResponse);
  });

  delete = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    await transactionService.delete(req.user.id, req.params.id);
    res.json({ success: true, data: null, message: 'Transaction deleted' } satisfies ApiResponse<null>);
  });

  bulkDelete = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    await transactionService.bulkDelete(req.user.id, req.body.ids);
    res.json({ success: true, data: null, message: 'Transactions deleted' } satisfies ApiResponse<null>);
  });

  getSummary = asyncHandler(async (req: AuthorizedRequest, res: Response) => {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const summary = await transactionService.getSummary(req.user.id, startDate, endDate);
    res.json({ success: true, data: summary } satisfies ApiResponse<TransactionSummary>);
  });
}