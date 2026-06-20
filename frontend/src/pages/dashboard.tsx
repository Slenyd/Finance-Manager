import { useMemo, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useFormatters } from '@/hooks/useFormatters';
import { Transaction } from '@/types';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { PageTransition, StaggerItem } from '@/components/ui/page-transition';

const COLORS = ['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#eab308'];

interface RecentTransactionRowProps {
  tx: Transaction;
  index: number;
  formatCurrency: (n: number) => string;
  formatDate: (d: string) => string;
  convertFromBase: (n: number) => number;
}

const RecentTransactionRowBase = ({ tx, index, formatCurrency, formatDate, convertFromBase }: RecentTransactionRowProps) => (
  <div
    className="flex items-center justify-between py-2 border-b last:border-0 animate-fade-in"
    style={{ animationDelay: `${100 + index * 80}ms`, animationFillMode: 'both' }}
  >
    <div className="flex items-center gap-3">
      {tx.category ? (
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.category.color }} />
      ) : (
        <div className="w-2 h-2 rounded-full bg-muted" />
      )}
      <div>
        <p className="font-medium">{tx.description}</p>
        <p className="text-xs text-muted-foreground">{tx.category ? `${tx.category.name} · ` : ''}{formatDate(tx.date)}</p>
      </div>
    </div>
    <span className={tx.type === 'INCOME' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(convertFromBase(tx.amount))}
    </span>
  </div>
);

const RecentTransactionRow = memo(RecentTransactionRowBase);

export default function DashboardPage() {
  const { formatCurrency, formatDate, convertFromBase } = useFormatters();
  const { data: dashboard, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await analyticsApi.getDashboard();
      return res.data.data!;
    },
  });

  const pieData = useMemo(() => [
    { name: 'Income', value: dashboard?.totalIncome ?? 0 },
    { name: 'Expenses', value: dashboard?.totalExpenses ?? 0 },
  ], [dashboard?.totalIncome, dashboard?.totalExpenses]);

  const summaryCards = useMemo(() => dashboard ? [
    { label: 'Current Balance', value: formatCurrency(convertFromBase(dashboard.currentBalance)), color: '' },
    { label: 'Total Income', value: formatCurrency(convertFromBase(dashboard.totalIncome)), color: 'text-green-600' },
    { label: 'Total Expenses', value: formatCurrency(convertFromBase(dashboard.totalExpenses)), color: 'text-red-600' },
    { label: 'Savings', value: formatCurrency(convertFromBase(dashboard.savings)), color: '' },
  ] : [], [dashboard, formatCurrency, convertFromBase]);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4 sm:p-6"><Skeleton className="h-20 animate-pulse-soft" /></CardContent></Card>
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isError || !dashboard) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Failed to load dashboard data.</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          {dashboard.healthScore.score !== null ? (
            <Badge variant={dashboard.healthScore.score >= 60 ? 'success' : 'warning'}>
              Health: {dashboard.healthScore.label} ({dashboard.healthScore.score})
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Health: N/A</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {summaryCards.map((card, i) => (
            <StaggerItem key={card.label} index={i}>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">{card.label}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${card.color}`}>{card.value}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StaggerItem index={4}>
            <Card>
              <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
                  <BarChart data={[{ name: 'This Month', income: convertFromBase(dashboard.monthIncome), expenses: convertFromBase(dashboard.monthExpenses) }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip cursor={false} contentStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }} />
                    <Bar dataKey="income" fill="#22c55e" name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem index={5}>
            <Card>
              <CardHeader><CardTitle>Income vs Expenses Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </StaggerItem>
        </div>

        <StaggerItem index={6}>
          <Card>
            <CardHeader><CardTitle>Monthly Budget Usage</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{formatCurrency(convertFromBase(dashboard.monthExpenses))} spent</span>
                  <span>{formatCurrency(convertFromBase(dashboard.totalIncome))} budget</span>
                </div>
                <Progress value={(dashboard.monthExpenses / Math.max(dashboard.totalIncome, 1)) * 100} />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem index={7}>
          <Card>
            <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.recentTransactions.slice(0, 5).map((tx, i) => (
                  <RecentTransactionRow
                    key={tx.id}
                    tx={tx}
                    index={i}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    convertFromBase={convertFromBase}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </PageTransition>
  );
}
