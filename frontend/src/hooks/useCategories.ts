import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoryApi.getAll();
      return res.data.data!;
    },
  });
}