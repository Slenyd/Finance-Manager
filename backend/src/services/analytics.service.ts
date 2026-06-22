import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { calculateFinancialHealth } from '../utils/helpers';
import { DashboardData, MonthlySpendingData, CategoryBreakdownData, NetWorthData, OverviewData } from '../interfaces';

type TransactionWithCategory = Prisma.TransactionGetPayload<{
  include: { category: { select: { id: true; name: true; icon: true; color: true } } };
}>;

export class AnalyticsService {
  async getDashboard(userId: string): Promise<DashboardData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [incomeAgg, expenseAgg, monthIncomeAgg, monthExpenseAgg, budgets, goals, recentTransactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.budget.findMany({ where: { userId } }),
      prisma.savingsGoal.findMany({ where: { userId } }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10,
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount) || 0;
    const totalExpenses = Number(expenseAgg._sum.amount) || 0;
    const totalTransactions = incomeAgg._count + expenseAgg._count;
    const currentBalance = totalIncome - totalExpenses;
    const monthIncome = Number(monthIncomeAgg._sum.amount) || 0;
    const monthExpenses = Number(monthExpenseAgg._sum.amount) || 0;

    const totalBudgetLimit = budgets.reduce((s, b) => s + Number(b.limit), 0);
    const budgetCompliance = totalBudgetLimit > 0 ? Math.min(1, monthExpenses / totalBudgetLimit) : 1;

    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
    const healthData = calculateFinancialHealth({
      savingsRate,
      budgetCompliance: 1 - budgetCompliance,
      expenseConsistency: 0.7,
      hasEmergencySavings: goals.some((g) => g.name.toLowerCase().includes('emergency')),
      hasSufficientData: totalTransactions >= 3 && (totalIncome > 0 || totalExpenses > 0),
    });

    return {
      currentBalance,
      totalIncome,
      totalExpenses,
      savings: totalIncome - totalExpenses,
      monthlyBudgetUsage: totalBudgetLimit > 0 ? (monthExpenses / totalBudgetLimit) * 100 : 0,
      healthScore: healthData,
      recentTransactions: recentTransactions as TransactionWithCategory[],
      monthIncome,
      monthExpenses,
      totalBudgets: budgets.length,
      totalGoals: goals.length,
    };
  }

  async getMonthlySpending(userId: string, months = 6): Promise<MonthlySpendingData[]> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const rows = await prisma.$queryRaw<{ month: string; income: Prisma.Decimal; expenses: Prisma.Decimal }[]>(
      Prisma.sql`
        SELECT
          to_char(date, 'YYYY-MM') as month,
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expenses
        FROM "transactions"
        WHERE "user_id" = ${userId}
          AND date >= ${startDate}
        GROUP BY to_char(date, 'YYYY-MM')
        ORDER BY month ASC
      `,
    );

    // Build the result with all months (including zero-spending months)
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyMap.set(label, { income: 0, expenses: 0 });
    }

    for (const row of rows) {
      const d = new Date(row.month + '-01');
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const entry = monthlyMap.get(label);
      if (entry) {
        entry.income = Number(row.income) || 0;
        entry.expenses = Number(row.expenses) || 0;
      }
    }

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, ...data }));
  }

  async getCategoryBreakdown(userId: string, startDate?: string, endDate?: string): Promise<CategoryBreakdownData[]> {
    const dateParts: Prisma.Sql[] = [];
    if (startDate) dateParts.push(Prisma.sql`t.date >= ${new Date(startDate)}`);
    if (endDate) dateParts.push(Prisma.sql`t.date <= ${new Date(endDate)}`);
    const dateClause = dateParts.length > 0
      ? Prisma.sql`AND ${Prisma.join(dateParts, ' AND ')}`
      : Prisma.empty;

    const results = await prisma.$queryRaw<CategoryBreakdownData[]>(
      Prisma.sql`
        SELECT
          c.id as "categoryId",
          c.name as "categoryName",
          c.color as "categoryColor",
          c.icon as "categoryIcon",
          COALESCE(SUM(t.amount), 0::decimal) as total,
          COUNT(t.id)::int as count
        FROM "categories" c
        LEFT JOIN "transactions" t ON t.category_id = c.id
          AND t.user_id = ${userId}
          AND t.type = 'EXPENSE'
          ${dateClause}
        WHERE c.user_id = ${userId}
        GROUP BY c.id, c.name, c.color, c.icon
        HAVING COUNT(t.id) > 0
        ORDER BY total DESC
      `,
    );

    return results.map((r) => ({
      ...r,
      total: Number(r.total) || 0,
      count: Number(r.count) || 0,
    }));
  }

  async getCashFlow(userId: string, months = 12): Promise<MonthlySpendingData[]> {
    return this.getMonthlySpending(userId, months);
  }

  async getOverview(userId: string): Promise<OverviewData> {
    const [dashboard, monthlySpending] = await Promise.all([
      this.getDashboard(userId),
      this.getMonthlySpending(userId, 6),
    ]);
    return { dashboard, monthlySpending };
  }

  async getNetWorth(userId: string): Promise<NetWorthData> {
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const currentNetWorth = (Number(incomeAgg._sum.amount) || 0) - (Number(expenseAgg._sum.amount) || 0);

    const monthlySnapshots = await prisma.$queryRaw<{ month: string; net: number }[]>(
      Prisma.sql`SELECT
        to_char(date, 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) as net
      FROM "transactions"
      WHERE "user_id" = ${userId}
      GROUP BY to_char(date, 'YYYY-MM')
      ORDER BY month ASC`,
    );

    let runningTotal = 0;
    const trend = monthlySnapshots.map((r) => {
      runningTotal += Number(r.net);
      return { date: r.month, netWorth: runningTotal };
    });

    return { currentNetWorth, trend };
  }
}