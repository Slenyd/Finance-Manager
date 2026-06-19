import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '@/api';
import { budgetSchema, BudgetForm as BudgetFormType } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AxiosError } from 'axios';
import { Category } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: {
    id: string;
    categoryId: string | null;
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<BudgetFormType>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      limit: 0,
      period: 'MONTHLY',
    },
  });

  const [periodValue, setPeriodValue] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');

  useEffect(() => {
    if (budget) {
      setSelectedCategoryId(budget.categoryId || '');
      setValue('limit', budget.limit);
      setPeriodValue(budget.period);
      setValue('period', budget.period);
      setValue('startDate', budget.startDate.split('T')[0]);
      setValue('endDate', budget.endDate.split('T')[0]);
    } else {
      reset();
      setSelectedCategoryId('');
      setPeriodValue('MONTHLY');
    }
  }, [budget, setValue, reset]);

  const createMutation = useMutation({
    mutationFn: (data: { limit: number; period: 'WEEKLY' | 'MONTHLY' | 'YEARLY'; startDate: string; endDate: string; categoryId?: string }) => budgetApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { limit: number; period: 'WEEKLY' | 'MONTHLY' | 'YEARLY'; startDate: string; endDate: string; categoryId?: string }) => budgetApi.update(budget!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    },
  });

  const onSubmit = (data: BudgetFormType) => {
    const payload: {
      limit: number;
      period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
      startDate: string;
      endDate: string;
      categoryId?: string;
    } = {
      limit: data.limit,
      period: periodValue,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
      endDate: data.endDate ? new Date(data.endDate).toISOString() : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    };
    if (selectedCategoryId) payload.categoryId = selectedCategoryId;
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
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Optional - select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="limit">Limit ($) <span className="text-destructive">*</span></Label>
              <Input id="limit" type="number" step="0.01" placeholder="0.00" {...register('limit', { valueAsNumber: true })} />
              {errors.limit && <p className="text-xs text-destructive">{errors.limit.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={periodValue} onValueChange={(v) => setPeriodValue(v as 'WEEKLY' | 'MONTHLY' | 'YEARLY')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
            </div>
          </div>
          <DialogFooter>
            {(createMutation.error || updateMutation.error) && (
              <p className="text-sm text-destructive mr-auto">{((createMutation.error || updateMutation.error) as AxiosError<{message?: string}>).response?.data?.message || (createMutation.error || updateMutation.error)?.message || 'Failed to save budget'}</p>
            )}
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