export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  date: string;
  paymentMethod?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  isRecurring: boolean;
  tags: string[];
  category: { id: string; name: string; icon: string; color: string };
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
  categoryId: string;
  limit: number;
  spent: number;
  period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  category: { id: string; name: string; icon: string; color: string };
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
  type: string;
  isRead: boolean;
  createdAt: string;
}

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
  meta?: PaginationMeta;
}
