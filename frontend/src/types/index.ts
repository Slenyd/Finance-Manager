// ---------------------------------------------------------------------------
// Shared entity types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
  currency: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  date: string;
  paymentMethod?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  isRecurring: boolean;
  tags: string[];
  category: CategorySummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string | null;
  limit: number;
  spent: number;
  period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  category: CategorySummary | null;
  percentage: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  progress: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  interval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  endDate: string | null;
  nextDate: string;
  isActive: boolean;
  category: CategorySummary | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Analytics DTOs
// ---------------------------------------------------------------------------

export interface DashboardData {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  monthlyBudgetUsage: number;
  healthScore: { score: number | null; label: string };
  recentTransactions: Transaction[];
  monthIncome: number;
  monthExpenses: number;
  totalBudgets: number;
  totalGoals: number;
}

export interface MonthlySpendingData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryBreakdownData {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  total: number;
  count: number;
}

export interface NetWorthData {
  currentNetWorth: number;
  trend: { date: string; netWorth: number }[];
}

export interface OverviewData {
  dashboard: DashboardData;
  monthlySpending: MonthlySpendingData[];
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  transactionCount: number;
}

// ---------------------------------------------------------------------------
// Pagination & API Response
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta & { unreadCount?: number };
}

// ---------------------------------------------------------------------------
// Create / Update DTOs (only client-editable fields, excludes id/userId/timestamps)
// ---------------------------------------------------------------------------

export type CreateTransactionDTO = Omit<Transaction, 'id' | 'userId' | 'categoryId' | 'isRecurring' | 'category' | 'createdAt' | 'updatedAt'> & {
  categoryId?: string;
};

export type UpdateTransactionDTO = Partial<CreateTransactionDTO> & { categoryId?: string | null };

export type CreateCategoryDTO = Omit<Category, 'id' | 'userId'>;

export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;

export type CreateBudgetDTO = Omit<Budget, 'id' | 'userId' | 'categoryId' | 'spent' | 'percentage' | 'category' | 'startDate' | 'endDate'> & {
  categoryId?: string;
  startDate: string;
  endDate: string;
};

export type UpdateBudgetDTO = Partial<Omit<Budget, 'id' | 'userId' | 'categoryId' | 'spent' | 'percentage' | 'category'>> & {
  startDate?: string;
  endDate?: string;
};

export type CreateGoalDTO = Omit<SavingsGoal, 'id' | 'userId' | 'progress' | 'createdAt' | 'currentAmount'> & {
  currentAmount?: number;
};

export type UpdateGoalDTO = Partial<CreateGoalDTO>;

export type CreateRecurringDTO = Omit<RecurringTransaction, 'id' | 'userId' | 'categoryId' | 'nextDate' | 'isActive' | 'category' | 'createdAt' | 'updatedAt'> & {
  categoryId: string;
};

export type UpdateRecurringDTO = Partial<CreateRecurringDTO> & { isActive?: boolean };