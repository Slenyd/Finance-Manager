import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useFormatters } from '@/hooks/useFormatters';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { PageTransition, StaggerItem } from '@/components/ui/page-transition';

const COLORS = ['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#eab308'];

export default function AnalyticsPage() {
  const { formatCurrency, convertFromBase } = useFormatters();
  const { data: dashboard, isLoading: loadingDashboard, isError: dashboardError, refetch: refetchDashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await analyticsApi.getDashboard();
      return res.data.data!;
    },
  });

  const { data: monthlySpending, isLoading: loadingMonthly, isError: monthlyError, refetch: refetchMonthly } = useQuery({
    queryKey: ['monthlySpending'],
    queryFn: async () => {
      const res = await analyticsApi.getMonthlySpending(6);
      return res.data.data!;
    },
  });

  const { data: categoryBreakdown, isLoading: loadingCategories, isError: categoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ['categoryBreakdown'],
    queryFn: async () => {
      const res = await analyticsApi.getCategoryBreakdown();
      return res.data.data!;
    },
  });

const { data: cashFlow, isLoading: loadingCashFlow, isError: cashFlowError, refetch: refetchCashFlow } = useQuery({
    queryKey: ['cashFlow'],
    queryFn: async () => {
      const res = await analyticsApi.getCashFlow(12);
      return res.data.data!;
    },
  });

  const isLoading = loadingDashboard || loadingMonthly || loadingCategories || loadingCashFlow;
  const hasError = dashboardError || monthlyError || categoriesError || cashFlowError;
  const retryAll = useCallback(() => { refetchDashboard(); refetchMonthly(); refetchCategories(); refetchCashFlow(); }, [refetchDashboard, refetchMonthly, refetchCategories, refetchCashFlow]);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-64 animate-pulse-soft" /></CardContent></Card>
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (hasError) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Failed to load analytics data.</p>
              <Button onClick={retryAll}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>

        {dashboard && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StaggerItem index={0}>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">Avg Monthly Spending</p>
                  <p className="text-xl sm:text-2xl font-bold">{formatCurrency(convertFromBase(dashboard.monthExpenses))}</p>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem index={1}>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">Avg Savings Rate</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {dashboard.totalIncome > 0
                      ? `${Math.round(((dashboard.totalIncome - dashboard.totalExpenses) / dashboard.totalIncome) * 100)}%`
                      : '0%'}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem index={2}>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">Health Score</p>
                  <p className="text-xl sm:text-2xl font-bold">{dashboard.healthScore.score ?? 'N/A'}</p>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem index={3}>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">Net Worth</p>
                  <p className="text-xl sm:text-2xl font-bold">{formatCurrency(convertFromBase(dashboard.currentBalance))}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Monthly Spending Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px] sm:h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySpending || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <defs>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#colorExpenses)" name="Expenses" />
                    <Area type="monotone" dataKey="income" stroke="#22c55e" fill="none" name="Income" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px] sm:h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      dataKey="total"
                      nameKey="categoryName"
                      label={({ categoryName }) => categoryName}
                    >
                      {(categoryBreakdown || []).map((entry, i) => (
                        <Cell key={i} fill={entry.categoryColor || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Cash Flow (12 months)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px] sm:h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlow || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="income" fill="#22c55e" name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
