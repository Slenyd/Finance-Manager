import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Pencil, Circle } from 'lucide-react';
import { Category } from '@/types';

const presetColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#eab308'];

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoryApi.getAll();
      return res.data.data!;
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { name: '', color: '#6366f1', type: 'EXPENSE' },
  });
  const [typeValue, setTypeValue] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => categoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => categoryApi.update(editingCat!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormOpen(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const openCreate = () => {
    setEditingCat(null);
    reset({ name: '', color: '#6366f1', type: 'EXPENSE' });
    setTypeValue('EXPENSE');
    setFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setValue('name', cat.name);
    setValue('color', cat.color);
    setTypeValue(cat.type as 'EXPENSE' | 'INCOME');
    setFormOpen(true);
  };

  const onSubmit = (data: Record<string, unknown>) => {
    const payload = { ...data, type: typeValue };
    if (editingCat) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Categories</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const incomeCats = categories?.filter((c) => c.type === 'INCOME') || [];
  const expenseCats = categories?.filter((c) => c.type === 'EXPENSE') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Categories</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>Customize your transaction categories.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Category name" {...register('name', { required: true })} />
              {typeof errors.name?.message === 'string' && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeValue} onValueChange={(v) => setTypeValue(v as 'EXPENSE' | 'INCOME')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-10 h-10 rounded-full border-2 border-transparent hover:scale-110 transition-transform"
                    style={{ backgroundColor: color, borderColor: color }}
                    onClick={() => setValue('color', color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <input type="hidden" {...register('color')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingCat ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>Are you sure you want to delete this category? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-3 text-green-600">Income</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {incomeCats.map((cat) => (
              <Card key={cat.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Circle className="h-5 w-5" style={{ fill: cat.color, color: cat.color }} />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} aria-label="Edit category">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(cat.id)} aria-label="Delete category">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3 text-red-600">Expenses</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {expenseCats.map((cat) => (
              <Card key={cat.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Circle className="h-5 w-5" style={{ fill: cat.color, color: cat.color }} />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} aria-label="Edit category">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(cat.id)} aria-label="Delete category">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}