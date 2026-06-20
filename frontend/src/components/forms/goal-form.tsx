import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '@/api';
import { goalSchema, GoalForm as GoalFormType } from '@/schemas';
import type { CreateGoalDTO } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AxiosError } from 'axios';

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
    mutationFn: (data: CreateGoalDTO) => goalApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; targetAmount: number; currentAmount?: number; deadline?: string | null }) => goalApi.update(goal!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    },
  });

  const onSubmit = (data: GoalFormType) => {
    const payload = {
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
    };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
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
            <Label htmlFor="name">Goal Name <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="e.g. Emergency Fund" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount ($) <span className="text-destructive">*</span></Label>
              <Input id="targetAmount" type="number" step="0.01" placeholder="0.00" {...register('targetAmount', { valueAsNumber: true })} />
              {errors.targetAmount && <p className="text-xs text-destructive">{errors.targetAmount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Savings ($)</Label>
              <Input id="currentAmount" type="number" step="0.01" placeholder="0.00" {...register('currentAmount', { setValueAs: (v) => (v === '' ? undefined : parseFloat(v)) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input id="deadline" type="date" {...register('deadline')} />
          </div>
          <DialogFooter>
            {(createMutation.error || updateMutation.error) && (
              <p className="text-sm text-destructive mr-auto">{((createMutation.error || updateMutation.error) as AxiosError<{message?: string}>)?.response?.data?.message || (createMutation.error || updateMutation.error)?.message || 'Failed to save goal'}</p>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
