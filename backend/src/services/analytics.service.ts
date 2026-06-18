import { prisma } from '../config/database';
import { calculateFinancialHealth } from '../utils/helpers';

export class AnalyticsService {
  async getDashboard(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allTransactions, monthTransactions, budgets, goals, recentTransactions] = await Promise.all([
      prisma.transaction.findMany({ where: { userId }, select: { amount: true, type: true } }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: startOfMonth } },
        select: { amount: true, type: true },
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

    const totalTransactions = allTransactions.length;
    const totalIncome = allTransactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = allTransactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
    const currentBalance = totalIncome - totalExpenses;

    const monthIncome = monthTransactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
    const monthExpenses = monthTransactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

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
    const data: { month: string; income: number; expenses: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });

      const transactions = await prisma.transaction.findMany({
        where: { userId, date: { gte: date, lte: endOfMonth } },
        select: { amount: true, type: true },
      });

      const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
      const expenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

      data.push({ month: monthLabel, income, expenses });
    }

    return data;
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

    return expenses.map((e) => {
      const cat = e.categoryId ? categories.find((c) => c.id === e.categoryId) : undefined;
      return {
        categoryId: e.categoryId,
        categoryName: cat?.name || 'Unknown',
        categoryColor: cat?.color || '#6366f1',
        categoryIcon: cat?.icon || 'circle',
        total: Number(e._sum.amount) || 0,
        count: e._count,
      };
    }).sort((a, b) => b.total - a.total);
  }

  async getCashFlow(userId: string, months = 12) {
    return this.getMonthlySpending(userId, months);
  }

  async getNetWorth(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      select: { amount: true, type: true, date: true },
      orderBy: { date: 'asc' },
    });

    let netWorth = 0;
    const trend: { date: string; netWorth: number }[] = [];

    for (const t of transactions) {
      if (t.type === 'INCOME') netWorth += Number(t.amount);
      else netWorth -= Number(t.amount);
      trend.push({ date: t.date.toISOString().split('T')[0], netWorth });
    }

    return { currentNetWorth: netWorth, trend };
  }
}
