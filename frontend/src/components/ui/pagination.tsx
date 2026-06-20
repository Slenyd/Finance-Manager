import { memo } from 'react';
import { Button } from './button';
import { PaginationMeta } from '@/types';

interface PaginationProps {
  page: number;
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

function PaginationBase({ page, meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-muted-foreground">
        Showing {((page - 1) * meta.limit) + 1}-{Math.min(page * meta.limit, meta.total)} of {meta.total}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export const Pagination = memo(PaginationBase);