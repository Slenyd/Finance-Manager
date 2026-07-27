import { Request, Response, NextFunction } from 'express';
import {
  Transaction,
  Category,
  Budget,
  SavingsGoal,
  Notification,
  RecurringTransaction,
  User,
  RefreshToken,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface AuthorizedRequest extends Request {
  user: AuthUser;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionQuery extends PaginationQuery {
  type?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  search?: string;
  tags?: string;
  paymentMethod?: string;
}

export interface BudgetQuery extends PaginationQuery {}

export interface GoalQuery extends PaginationQuery {}

export interface NotificationQuery extends PaginationQuery {}

// ---------------------------------------------------------------------------
// Entity types (Prisma-generated aliases for convenience)
// ---------------------------------------------------------------------------

export type { Transaction, Category, Budget, SavingsGoal, Notification, RecurringTransaction, User, RefreshToken };

// Subset of User that is safe to expose in API responses / JWT claims
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
}

// User shape returned by profile / login endpoints (no passwordHash)
export type SafeUser = Pick<
  User,
  'id' | 'name' | 'email' | 'role' | 'isVerified' | 'currency' | 'locale' | 'createdAt' | 'updatedAt'
>;

// ---------------------------------------------------------------------------
// Transaction DTOs
// ---------------------------------------------------------------------------

export interface CreateTransactionData {
  amount: number;
  description: string;
  type: Transaction['type'];
  categoryId?: string;
  date?: string;
  paymentMethod?: string;
  notes?: string;
  receiptUrl?: string | null;
  tags?: string[];
}

export interface UpdateTransactionData {
  amount?: number;
  description?: string;
  type?: Transaction['type'];
  categoryId?: string | null;
  date?: string;
  paymentMethod?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  tags?: string[];
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  transactionCount: number;
}

// ---------------------------------------------------------------------------
// Category DTOs
// ---------------------------------------------------------------------------

export interface CreateCategoryData {
  name: string;
  icon?: string;
  color?: string;
  type: Category['type'];
}

export interface UpdateCategoryData {
  name?: string;
  icon?: string;
  color?: string;
  type?: Category['type'];
}

// ---------------------------------------------------------------------------
// Budget DTOs
// ---------------------------------------------------------------------------

export interface CreateBudgetData {
  categoryId?: string;
  limit: number;
  period: Budget['period'];
  startDate: string;
  endDate: string;
}

export interface UpdateBudgetData {
  limit?: number;
  period?: Budget['period'];
  startDate?: string;
  endDate?: string;
}

export interface BudgetWithSpent extends Budget {
  spent: number;
  percentage: number;
  category: { id: string; name: string; icon: string; color: string } | null;
}

// ---------------------------------------------------------------------------
// Goal DTOs
// ---------------------------------------------------------------------------

export interface CreateGoalData {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string | null;
}

export interface UpdateGoalData {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string | null;
}

export interface SavingsGoalWithProgress extends SavingsGoal {
  progress: number;
}

// ---------------------------------------------------------------------------
// Recurring DTOs
// ---------------------------------------------------------------------------

export interface CreateRecurringData {
  categoryId: string;
  amount: number;
  description: string;
  type: RecurringTransaction['type'];
  interval: RecurringTransaction['interval'];
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
  startDate?: string;
  endDate?: string | null;
}

export interface UpdateRecurringData {
  categoryId?: string;
  amount?: number;
  description?: string;
  type?: RecurringTransaction['type'];
  interval?: RecurringTransaction['interval'];
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
  startDate?: string;
  endDate?: string | null;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Analytics DTOs
// ---------------------------------------------------------------------------

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

export interface OverviewData {
  dashboard: DashboardData;
  monthlySpending: MonthlySpendingData[];
}

// ---------------------------------------------------------------------------
// Auth DTOs
// ---------------------------------------------------------------------------

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export interface UpdatePreferencesData {
  currency?: string;
  locale?: string;
}

export interface AuthResult {
  accessToken: string;
  user: Pick<SafeUser, 'id' | 'name' | 'email' | 'role' | 'isVerified' | 'currency' | 'locale'>;
  rememberMe: boolean;
}

export interface RefreshResult {
  accessToken: string;
}

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------

export interface JwtPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh';
  tokenFamily?: string;
  tokenVersion?: number;
  jti?: string;
  name?: string;
  email?: string;
  isVerified?: boolean;
}

// ---------------------------------------------------------------------------
// API Response
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationMeta extends PaginationMeta {
  unreadCount: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta | NotificationMeta | Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helper for typed controller responses
// ---------------------------------------------------------------------------

export function sendResponse<T>(res: Response, status: number, data: T, message?: string): Response {
  return res.status(status).json({ success: true, data, message } satisfies ApiResponse<T>);
}

export function sendDatalessResponse(res: Response, status: number, message: string): Response {
  return res.status(status).json({ success: true, data: null, message } satisfies ApiResponse<null>);
}

// ---------------------------------------------------------------------------
// Typed async handler for authorized routes
// ---------------------------------------------------------------------------

type AuthorizedAsyncFn = (req: AuthorizedRequest, res: Response, next: NextFunction) => Promise<void>;
type PublicAsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export type ControllerAsyncFn = AuthorizedAsyncFn | PublicAsyncFn;

// Re-export for authorize middleware typing
export type { NextFunction, Response };