import { useState, useCallback, memo, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { budgetApi } from '@/api';
import { useCategories } from '@/hooks/useCategories';
import { useFormatters } from '@/hooks/useFormatters';
import { Budget } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { PageTransition, StaggerItem } from '@/components/ui/page-transition';

const BudgetFormDialog = lazy(() => import('@/components/forms/budget-form').then(m => ({ default: m.BudgetFormDialog })));

const PAGE_SIZE = 10;

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
  formatCurrency: (n: number) => string;
  convertFromBase: (n: number) => number;
  variant: 'destructive' | 'warning' | 'default';
}

const BudgetCardBase = ({ budget, onEdit, onDelete, formatCurrency, convertFromBase, variant }: BudgetCardProps) => (
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
          <Badge variant={variant}>
            {Math.round(budget.percentage)}%
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => onEdit(budget)} aria-label="Edit budget">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(budget.id)} aria-label="Delete budget">
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
);

const BudgetCard = memo(BudgetCardBase);

export default function BudgetsPage() {
  const { formatCurrency, convertFromBase } = useFormatters();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
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

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['budgets', page],
    queryFn: async () => {
      const res = await budgetApi.getAll({ page: String(page), limit: String(PAGE_SIZE) });
      return { data: res.data.data!, meta: res.data.meta! };
    },
    placeholderData: keepPreviousData,
  });

  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const openCreate = useCallback(() => {
    setEditingBudget(undefined);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((budget: Budget) => {
    setEditingBudget({
      id: budget.id,
      categoryId: budget.categoryId,
      limit: budget.limit,
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate,
    });
    setFormOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteMutation]);

  const budgets = data?.data;
  const meta = data?.meta;
  const getProgressVariant = useCallback((percentage: number): 'destructive' | 'warning' | 'default' => {
    if (percentage >= 100) return 'destructive' as const;
    if (percentage >= 90) return 'warning' as const;
    return 'default' as const;
  }, []);

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
              <Button variant="destructive" disabled={deleteMutation.isPending} onClick={handleDeleteConfirm}>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 md:grid-cols-2">
          {budgets?.map((budget, i) => (
            <StaggerItem key={budget.id} index={i}>
              <BudgetCard
                budget={budget}
                onEdit={openEdit}
                onDelete={setDeleteId}
                formatCurrency={formatCurrency}
                convertFromBase={convertFromBase}
                variant={getProgressVariant(budget.percentage)}
              />
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

        {meta && <Pagination page={page} meta={meta} onPageChange={setPage} />}
      </div>
    </PageTransition>
  );
}