import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { PageTransition, StaggerItem } from '@/components/ui/page-transition';

const COLORS = ['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#eab308'];

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
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
    { label: 'Current Balance', value: formatCurrency(dashboard.currentBalance), color: '' },
    { label: 'Total Income', value: formatCurrency(dashboard.totalIncome), color: 'text-green-600' },
    { label: 'Total Expenses', value: formatCurrency(dashboard.totalExpenses), color: 'text-red-600' },
    { label: 'Savings', value: formatCurrency(dashboard.savings), color: '' },
  ] : [], [dashboard]);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 animate-pulse-soft" /></CardContent></Card>
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!dashboard) return null;

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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, i) => (
            <StaggerItem key={card.label} index={i}>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
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
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[{ name: 'This Month', income: dashboard.monthIncome, expenses: dashboard.monthExpenses }]}>
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
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label>
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
                  <span>{formatCurrency(dashboard.monthExpenses)} spent</span>
                  <span>{formatCurrency(dashboard.totalIncome)} budget</span>
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
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 animate-fade-in"
                    style={{ animationDelay: `${100 + i * 80}ms`, animationFillMode: 'both' }}
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
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </PageTransition>
  );
}
