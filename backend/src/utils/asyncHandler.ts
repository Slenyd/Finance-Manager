import { Request, Response, NextFunction } from 'express';

type AsyncFn<R extends Request = Request> = (req: R, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = <R extends Request = Request>(fn: AsyncFn<R>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as R, res, next)).catch(next);
  };