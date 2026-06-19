import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth';

const CURRENCY_MAP: Record<string, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  JPY: { symbol: '¥', locale: 'ja-JP' },
  CAD: { symbol: 'C$', locale: 'en-CA' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
  INR: { symbol: '₹', locale: 'en-IN' },
  BRL: { symbol: 'R$', locale: 'pt-BR' },
  MXN: { symbol: 'MX$', locale: 'es-MX' },
  CHF: { symbol: 'Fr.', locale: 'de-CH' },
  ILS: { symbol: '₪', locale: 'he-IL' },
};

export function useFormatters() {
  const user = useAuthStore((s) => s.user);
  const currency = user?.currency || 'USD';
  const locale = user?.locale || CURRENCY_MAP[currency]?.locale || 'en-US';

  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return (amount: number) => formatter.format(amount);
  }, [currency, locale]);

  const formatDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return (date: string | Date) => formatter.format(new Date(date));
  }, [locale]);

  const currencyInfo = CURRENCY_MAP[currency] || CURRENCY_MAP.USD;

  return { formatCurrency, formatDate, currency, currencySymbol: currencyInfo.symbol };
}