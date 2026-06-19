import { useQuery } from '@tanstack/react-query';
import { fetchRates } from '@/api/exchangeRates';

export function useExchangeRates(baseCurrency: string = 'USD') {
  return useQuery({
    queryKey: ['exchangeRates', baseCurrency],
    queryFn: () => fetchRates(baseCurrency),
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}