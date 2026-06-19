import { useState, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '@/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useFormatters } from '@/hooks/useFormatters';
import { Target, Calendar, Plus, Trash2, Pencil, PiggyBank } from 'lucide-react';
import { PageTransition, StaggerItem } from '@/components/ui/page-transition';

const GoalFormDialog = lazy(() => import('@/components/forms/goal-form').then(m => ({ default: m.GoalFormDialog })));
const ContributeFormDialog = lazy(() => import('@/components/forms/contribute-form').then(m => ({ default: m.ContributeFormDialog })));

export default function GoalsPage() {
  const { formatCurrency, formatDate, convertFromBase } = useFormatters();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string | null;
  } | undefined>(undefined);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<{ id: string; name: string } | null>(null);

  const { data: goals, isLoading, isError, refetch } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await goalApi.getAll();
      return res.data.data!;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const openCreate = () => {
    setEditingGoal(undefined);
    setFormOpen(true);
  };

  const openEdit = (goal: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string | null;
  }) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const openContribute = (goal: {
    id: string;
    name: string;
  }) => {
    setContributeGoal({ id: goal.id, name: goal.name });
    setContributeOpen(true);
  };

if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Savings Goals</h1>
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
          <h1 className="text-2xl sm:text-3xl font-bold">Savings Goals</h1>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Failed to load savings goals.</p>
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
          <h1 className="text-2xl sm:text-3xl font-bold">Savings Goals</h1>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Add Goal
          </Button>
        </div>

        <Suspense fallback={null}>
        <GoalFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          goal={editingGoal}
        />
      </Suspense>

      {contributeGoal && (
        <Suspense fallback={null}>
          <ContributeFormDialog
            open={contributeOpen}
            onOpenChange={setContributeOpen}
            goalId={contributeGoal.id}
            goalName={contributeGoal.name}
          />
        </Suspense>
        )}

        <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Goal</DialogTitle>
              <DialogDescription>Are you sure you want to delete this savings goal? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 md:grid-cols-2">
          {goals?.map((goal, i) => (
            <StaggerItem key={goal.id} index={i}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(goal)} aria-label="Edit goal">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(goal.id)} aria-label="Delete goal">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={Math.min(goal.progress, 100)} />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{formatCurrency(convertFromBase(goal.currentAmount))} saved</span>
                    <span className="font-medium">{formatCurrency(convertFromBase(goal.targetAmount))} target</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">{Math.round(goal.progress)}% complete</span>
                    {goal.deadline && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(goal.deadline)}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => openContribute(goal)}
                  >
                    <PiggyBank className="h-4 w-4 mr-2" /> Contribute
                  </Button>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
          {(!goals || goals.length === 0) && (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center text-muted-foreground">
                No savings goals yet. Click "Add Goal" to start saving!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
