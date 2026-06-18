export const parsePagination = (query: {
  page?: string;
  limit?: string;
}): { page: number; limit: number; skip: number } => {
  const rawPage = parseInt(query.page || '1', 10);
  const rawLimit = parseInt(query.limit || '10', 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 10;
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
