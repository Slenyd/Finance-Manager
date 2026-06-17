import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '@/api/endpoints';
import { budgetSchema, BudgetForm as BudgetFormType } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Category } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: {
    id: string;
    categoryId: string;
    limit: number;
    period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate: string;
    endDate: string;
  };
  categories: Category[];
}

export function BudgetFormDialog({ open, onOpenChange, budget, categories }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!budget;
  const [categoryName, setCategoryName] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<BudgetFormType>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      limit: 0,
      period: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (budget) {
      const cat = categories.find((c) => c.id === budget.categoryId);
      setCategoryName(cat?.name || '');
      setValue('limit', budget.limit);
      setValue('period', budget.period);
      setValue('startDate', budget.startDate.split('T')[0]);
      setValue('endDate', budget.endDate.split('T')[0]);
    } else {
      reset();
      setCategoryName('');
    }
  }, [budget, setValue, reset, categories]);

  const createMutation = useMutation({
    mutationFn: (data: any) => budgetApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => budgetApi.update(budget!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    },
  });

  const onSubmit = (data: BudgetFormType) => {
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase(),
    );
    const payload = { ...data, categoryId: matchedCategory?.id || '' };
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
          <DialogTitle>{isEditing ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
          <DialogDescription>Set a spending limit for a category.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <textarea
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="Type category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="limit">Limit ($)</Label>
              <Input id="limit" type="number" step="0.01" placeholder="0.00" {...register('limit', { valueAsNumber: true })} />
              {errors.limit && <p className="text-xs text-destructive">{errors.limit.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('period')}
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
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
