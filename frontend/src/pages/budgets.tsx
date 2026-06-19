import { useState, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi, categoryApi } from '@/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useFormatters } from '@/hooks/useFormatters';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { PageTransition, StaggerItem } from '@/components/ui/page-transition';

const BudgetFormDialog = lazy(() => import('@/components/forms/budget-form').then(m => ({ default: m.BudgetFormDialog })));

export default function BudgetsPage() {
  const { formatCurrency, convertFromBase } = useFormatters();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<{
    id: string;
    categoryId: string | null;
    limit: number;
    period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate: string;
    endDate: string;
  } | undefined>(undefined);

  const { data: budgets, isLoading, isError, refetch } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await budgetApi.getAll();
      return res.data.data!;
    },
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoryApi.getAll();
      return res.data.data!;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const openCreate = () => {
    setEditingBudget(undefined);
    setFormOpen(true);
  };

  const openEdit = (budget: {
    id: string;
    categoryId: string | null;
    limit: number;
    period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate: string;
    endDate: string;
  }) => {
    setEditingBudget(budget);
    setFormOpen(true);
  };

if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Budgets</h1>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 animate-pulse-soft" /></CardContent></Card>
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isError) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Budgets</h1>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Failed to load budgets.</p>
              <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const getProgressVariant = (percentage: number) => {
    if (percentage >= 100) return 'destructive' as const;
    if (percentage >= 90) return 'warning' as const;
    return 'default' as const;
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Budgets</h1>
          <Button onClick={openCreate} disabled={categoriesLoading}>
            <Plus className="h-4 w-4 mr-2" /> Add Budget
          </Button>
        </div>

        <Suspense fallback={null}>
        <BudgetFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          budget={editingBudget}
          categories={categories || []}
        />
      </Suspense>

        <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Budget</DialogTitle>
              <DialogDescription>Are you sure you want to delete this budget? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 md:grid-cols-2">
          {budgets?.map((budget, i) => (
            <StaggerItem key={budget.id} index={i}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {budget.category ? (
                      <>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.category.color }} />
                        <CardTitle className="text-lg">{budget.category.name}</CardTitle>
                      </>
                    ) : (
                      <CardTitle className="text-lg">Uncategorized</CardTitle>
                    )}
                  </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={getProgressVariant(budget.percentage)}>
                        {Math.round(budget.percentage)}%
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(budget)} aria-label="Edit budget">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(budget.id)} aria-label="Delete budget">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{budget.period.toLowerCase()} budget</p>
                </CardHeader>
                <CardContent>
                  <Progress value={Math.min(budget.percentage, 100)} className="mb-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{formatCurrency(convertFromBase(budget.spent))} spent</span>
                    <span className="font-medium">{formatCurrency(convertFromBase(budget.limit))} limit</span>
                  </div>
                  {budget.percentage >= 90 && (
                    <p className="text-sm text-destructive mt-2 font-medium">
                      {budget.percentage >= 100 ? 'Budget exceeded!' : 'Almost at your limit!'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
          {(!budgets || budgets.length === 0) && (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center text-muted-foreground">
                No budgets yet. Click "Add Budget" to start tracking your spending.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
