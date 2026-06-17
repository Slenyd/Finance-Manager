import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const generateUUID = (): string => uuidv4();

export const generateToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const sanitizeUser = (user: {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  passwordHash?: string;
  failedLoginAttempts?: number;
  isLocked?: boolean;
  lockUntil?: Date | null;
}) => {
  const { passwordHash: _, failedLoginAttempts: __, isLocked: ___, lockUntil: ____, ...sanitized } = user;
  return sanitized;
};

export const parsePagination = (query: {
  page?: string;
  limit?: string;
}): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  return { page, limit, skip: (page - 1) * limit };
};

export const calculateFinancialHealth = (data: {
  savingsRate: number;
  budgetCompliance: number;
  expenseConsistency: number;
  hasEmergencySavings: boolean;
  hasSufficientData?: boolean;
}): { score: number | null; label: string } => {
  if (!data.hasSufficientData) {
    return { score: null, label: 'N/A' };
  }

  let score = 50;

  score += data.savingsRate * 0.3;
  score += data.budgetCompliance * 0.25;
  score += data.expenseConsistency * 0.25;
  score += data.hasEmergencySavings ? 20 : 0;

  const finalScore = Math.min(100, Math.max(0, Math.round(score)));
  const label = finalScore >= 80 ? 'Excellent' : finalScore >= 60 ? 'Good' : finalScore >= 40 ? 'Fair' : 'Poor';

  return { score: finalScore, label };
};
