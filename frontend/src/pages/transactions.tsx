import { useState, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { transactionApi } from '@/api';
import { useCategories } from '@/hooks/useCategories';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useFormatters } from '@/hooks/useFormatters';
import { Plus, Search, Trash2, Pencil, Paperclip } from 'lucide-react';
import { PageTransition, StaggerItem } from '@/components/ui/page-transition';

const TransactionFormDialog = lazy(() => import('@/components/forms/transaction-form').then(m => ({ default: m.TransactionFormDialog })));

export default function TransactionsPage() {
  const { formatCurrency, formatDate, convertFromBase } = useFormatters();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<{
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
  } | undefined>(undefined);

  const search = useDebouncedValue(searchInput, 300);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transactions', search, typeFilter, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const res = await transactionApi.getAll(params);
      return { data: res.data.data!, meta: res.data.meta! };
    },
    placeholderData: keepPreviousData,
  });

  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const openCreate = () => {
    setEditingTx(undefined);
    setFormOpen(true);
  };

  const openEdit = (tx: {
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
  }) => {
    setEditingTx(tx);
    setFormOpen(true);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
          <Button onClick={openCreate} disabled={categoriesLoading}>
            <Plus className="h-4 w-4 mr-2" /> Add Transaction
          </Button>
        </div>

        <Suspense fallback={null}>
        <TransactionFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          transaction={editingTx}
          categories={categories || []}
        />
      </Suspense>

        <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Transaction</DialogTitle>
              <DialogDescription>Are you sure you want to delete this transaction? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <StaggerItem index={0}>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search transactions..." className="pl-9" value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(1); }} />
                </div>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All types</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
<CardContent>
               {isLoading ? (
                 <div className="space-y-3">
                   {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 animate-pulse-soft" />)}
                 </div>
               ) : isError ? (
                 <div className="text-center py-8">
                   <p className="text-muted-foreground mb-4">Failed to load transactions.</p>
                   <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
                 </div>
               ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="hidden lg:table-cell">Category</TableHead>
                          <TableHead className="hidden lg:table-cell">Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.data.map((tx, i) => (
                          <TableRow
                            key={tx.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${50 + i * 40}ms`, animationFillMode: 'both' }}
                          >
                            <TableCell className="font-medium">{tx.description}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {tx.category ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.category.color }} />
                                  {tx.category.name}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Uncategorized</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">{formatDate(tx.date)}</TableCell>
                            <TableCell>
                              <Badge variant={tx.type === 'INCOME' ? 'success' : tx.type === 'EXPENSE' ? 'destructive' : 'secondary'}>
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(convertFromBase(tx.amount))}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {tx.receiptUrl && (
                                  <a href={tx.receiptUrl} target="_blank" rel="noopener noreferrer" aria-label="View receipt">
                                    <Button variant="ghost" size="icon" type="button">
                                      <Paperclip className="h-4 w-4" />
                                    </Button>
                                  </a>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => openEdit(tx)} aria-label="Edit transaction">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteId(tx.id)} aria-label="Delete transaction">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!data?.data || data.data.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No transactions found. Create one to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden space-y-2">
                    {data?.data.map((tx, i) => (
                      <div
                        key={tx.id}
                        className="mobile-table-row animate-fade-in"
                        style={{ animationDelay: `${50 + i * 40}ms`, animationFillMode: 'both' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="mobile-table-value">{tx.description}</span>
                          <div className="flex gap-1 shrink-0">
                            {tx.receiptUrl && (
                              <a href={tx.receiptUrl} target="_blank" rel="noopener noreferrer" aria-label="View receipt">
                                <Button variant="ghost" size="icon" type="button">
                                  <Paperclip className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => openEdit(tx)} aria-label="Edit transaction">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(tx.id)} aria-label="Delete transaction">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {tx.category ? (
                            <>
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tx.category.color }} />
                              <span className="text-sm text-muted-foreground">{tx.category.name}</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Uncategorized</span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">{formatDate(tx.date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={tx.type === 'INCOME' ? 'success' : tx.type === 'EXPENSE' ? 'destructive' : 'secondary'}>
                            {tx.type}
                          </Badge>
                          <span className={`font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(convertFromBase(tx.amount))}
                          </span>
                        </div>
                      </div>
                    ))}
                    {(!data?.data || data.data.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">No transactions found. Create one to get started.</p>
                    )}
                  </div>
                  {data?.meta && data.meta.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {((page - 1) * 15) + 1}-{Math.min(page * 15, data.meta.total)} of {data.meta.total}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                        <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </PageTransition>
  );
}
