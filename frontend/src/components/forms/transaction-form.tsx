import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '@/api/endpoints';
import { transactionSchema, TransactionForm as TransactionFormType } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AxiosError } from 'axios';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Category } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: {
    id: string;
    amount: number;
    description: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    categoryId: string | null;
    date: string;
    paymentMethod?: string | null;
    notes?: string | null;
    tags: string[];
  };
  categories: Category[];
}

export function TransactionFormDialog({ open, onOpenChange, transaction, categories }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!transaction;
  const [categoryName, setCategoryName] = useState('');
  const [typeText, setTypeText] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<TransactionFormType>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      description: '',
      paymentMethod: '',
      notes: '',
      tags: '',
    },
  });

  useEffect(() => {
    if (transaction) {
      setValue('amount', transaction.amount);
      setValue('description', transaction.description);
      setTypeText(transaction.type);
      const cat = categories.find((c) => c.id === transaction.categoryId);
      setCategoryName(cat?.name || '');
      setValue('date', transaction.date.split('T')[0]);
      setValue('paymentMethod', transaction.paymentMethod || '');
      setValue('notes', transaction.notes || '');
      setValue('tags', transaction.tags.join(', '));
    } else {
      reset();
      setTypeText('EXPENSE');
      setCategoryName('');
    }
  }, [transaction, setValue, reset, categories]);

  const createMutation = useMutation({
    mutationFn: (data: {
      amount: number;
      description: string;
      type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      date: string;
      paymentMethod?: string;
      notes?: string;
      tags: string[];
      categoryId?: string;
    }) => transactionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      amount: number;
      description: string;
      type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      date: string;
      paymentMethod?: string;
      notes?: string;
      tags: string[];
      categoryId?: string;
    }) => transactionApi.update(transaction!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    },
  });

  const onSubmit = (data: TransactionFormType) => {
    const resolvedType = typeText.toUpperCase().trim();
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase(),
    );
    const payload: {
      amount: number;
      description: string;
      type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      date: string;
      paymentMethod?: string;
      notes?: string;
      tags: string[];
      categoryId?: string;
    } = {
      amount: data.amount,
      description: data.description,
      type: (['INCOME', 'EXPENSE', 'TRANSFER'].includes(resolvedType) ? resolvedType : 'EXPENSE') as 'INCOME' | 'EXPENSE' | 'TRANSFER',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      paymentMethod: data.paymentMethod || '',
      notes: data.notes || '',
      tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    };
    if (matchedCategory) payload.categoryId = matchedCategory.id;
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
          <DialogTitle>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          <DialogDescription>Fill in the details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeText} onValueChange={setTypeText}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="What was this for?" {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <textarea
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="Optional - type or select a category"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register('date')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Input id="paymentMethod" placeholder="Cash, Card, etc." {...register('paymentMethod')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" placeholder="Optional notes" {...register('notes')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" placeholder="food, groceries" {...register('tags')} />
          </div>
          {createMutation.error && (
            <p className="text-sm text-destructive">{(createMutation.error as AxiosError<{message?: string}>).response?.data?.message || createMutation.error.message || 'Failed to save transaction'}</p>
          )}
          {updateMutation.error && (
            <p className="text-sm text-destructive">{(updateMutation.error as AxiosError<{message?: string}>).response?.data?.message || updateMutation.error.message || 'Failed to save transaction'}</p>
          )}
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
