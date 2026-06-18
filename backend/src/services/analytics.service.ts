import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { calculateFinancialHealth } from '../utils/helpers';

export class AnalyticsService {
  async getDashboard(userId: string) {
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
      recentTransactions,
      monthIncome,
      monthExpenses,
      totalBudgets: budgets.length,
      totalGoals: goals.length,
    };
  }

  async getMonthlySpending(userId: string, months = 6) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const rows = await prisma.transaction.findMany({
      where: { userId, date: { gte: startDate } },
      select: { amount: true, type: true, date: true },
    });

    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyMap.set(label, { income: 0, expenses: 0 });
    }

    for (const t of rows) {
      const label = t.date.toLocaleString('default', { month: 'short', year: '2-digit' });
      const entry = monthlyMap.get(label);
      if (entry) {
        if (t.type === 'INCOME') entry.income += Number(t.amount);
        else entry.expenses += Number(t.amount);
      }
    }

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, ...data }));
  }

  async getCategoryBreakdown(userId: string, startDate?: string, endDate?: string) {
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const expenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        ...(Object.keys(dateFilter).length && { date: dateFilter }),
      },
      _sum: { amount: true },
      _count: true,
    });

    const categoryIds = expenses.map((e) => e.categoryId).filter(Boolean) as string[];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return expenses
      .map((e) => {
        const cat = e.categoryId ? categoryMap.get(e.categoryId) : undefined;
        return {
          categoryId: e.categoryId,
          categoryName: cat?.name || 'Unknown',
          categoryColor: cat?.color || '#6366f1',
          categoryIcon: cat?.icon || 'circle',
          total: Number(e._sum.amount) || 0,
          count: e._count,
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  async getCashFlow(userId: string, months = 12) {
    return this.getMonthlySpending(userId, months);
  }

  async getOverview(userId: string) {
    const [dashboard, monthlySpending] = await Promise.all([
      this.getDashboard(userId),
      this.getMonthlySpending(userId, 6),
    ]);
    return { dashboard, monthlySpending };
  }

  async getNetWorth(userId: string) {
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
