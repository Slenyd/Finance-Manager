import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '@/api/endpoints';
import { goalSchema, GoalForm as GoalFormType } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string | null;
  };
}

export function GoalFormDialog({ open, onOpenChange, goal }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!goal;

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<GoalFormType>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: '',
    },
  });

  useEffect(() => {
    if (goal) {
      setValue('name', goal.name);
      setValue('targetAmount', goal.targetAmount);
      setValue('currentAmount', goal.currentAmount);
      setValue('deadline', goal.deadline ? goal.deadline.split('T')[0] : '');
    } else {
      reset();
    }
  }, [goal, setValue, reset]);

  const createMutation = useMutation({
    mutationFn: (data: GoalFormType) => goalApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: GoalFormType) => goalApi.update(goal!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    },
  });

  const onSubmit = (data: GoalFormType) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
          <DialogDescription>Set a new savings goal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input id="name" placeholder="e.g. Emergency Fund" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount ($)</Label>
              <Input id="targetAmount" type="number" step="0.01" placeholder="0.00" {...register('targetAmount', { valueAsNumber: true })} />
              {errors.targetAmount && <p className="text-xs text-destructive">{errors.targetAmount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Savings ($)</Label>
              <Input id="currentAmount" type="number" step="0.01" placeholder="0.00" {...register('currentAmount', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input id="deadline" type="date" {...register('deadline')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
