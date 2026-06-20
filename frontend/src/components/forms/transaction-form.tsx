import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi, uploadApi } from '@/api';
import { transactionSchema, TransactionForm as TransactionFormType } from '@/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AxiosError } from 'axios';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Category } from '@/types';
import { Paperclip, X, Loader2 } from 'lucide-react';

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
    receiptUrl?: string | null;
    tags: string[];
  };
  categories: Category[];
}

export function TransactionFormDialog({ open, onOpenChange, transaction, categories }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!transaction;
  const [categoryName, setCategoryName] = useState('');
  const [typeText, setTypeText] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(transaction?.receiptUrl ?? null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setReceiptUrl(transaction.receiptUrl ?? null);
    } else {
      reset();
      setTypeText('EXPENSE');
      setCategoryName('');
      setReceiptUrl(null);
    }
    setReceiptFile(null);
    setUploadError('');
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
      receiptUrl?: string | null;
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
      receiptUrl?: string | null;
    }) => transactionApi.update(transaction!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
    },
  });

  const onSubmit = async (data: TransactionFormType) => {
    let finalReceiptUrl = receiptUrl;

    if (receiptFile) {
      setUploading(true);
      setUploadError('');
      try {
        const res = await uploadApi.uploadReceipt(receiptFile);
        finalReceiptUrl = res.data.data!.url;
        setReceiptUrl(finalReceiptUrl);
      } catch {
        setUploadError('Failed to upload receipt. Please try again.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

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
      receiptUrl?: string | null;
    } = {
      amount: data.amount,
      description: data.description,
      type: (['INCOME', 'EXPENSE', 'TRANSFER'].includes(resolvedType) ? resolvedType : 'EXPENSE') as 'INCOME' | 'EXPENSE' | 'TRANSFER',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      paymentMethod: data.paymentMethod || '',
      notes: data.notes || '',
      tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      receiptUrl: finalReceiptUrl,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount <span className="text-destructive">*</span></Label>
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
            <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
            <Input id="description" placeholder="What was this for?" {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categories.find(c => c.name.toLowerCase() === categoryName.trim().toLowerCase())?.id || ''} onValueChange={(id) => {
                const cat = categories.find(c => c.id === id);
                setCategoryName(cat?.name || '');
              }}>
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
          <div className="space-y-2">
            <Label>Receipt</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    setUploadError('File must be under 5MB');
                    e.target.value = '';
                    return;
                  }
                  setReceiptFile(file);
                  setUploadError('');
                }
              }}
            />
            {receiptUrl ? (
              <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2">
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate flex-1">
                  View receipt
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => { setReceiptUrl(null); setReceiptFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  aria-label="Remove receipt"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : receiptFile ? (
              <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2">
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm truncate flex-1">{receiptFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => { setReceiptFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  aria-label="Remove receipt file"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mr-2" /> Attach receipt
              </Button>
            )}
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
          </div>
          {createMutation.error && (
            <p className="text-sm text-destructive">{(createMutation.error as AxiosError<{message?: string}>).response?.data?.message || createMutation.error.message || 'Failed to save transaction'}</p>
          )}
          {updateMutation.error && (
            <p className="text-sm text-destructive">{(updateMutation.error as AxiosError<{message?: string}>).response?.data?.message || updateMutation.error.message || 'Failed to save transaction'}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading}>
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
