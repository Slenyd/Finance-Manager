import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { useExchangeRates } from './useExchangeRates';

const CURRENCY_MAP: Record<string, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  JPY: { symbol: '¥', locale: 'ja-JP' },
  CNY: { symbol: '¥', locale: 'zh-CN' },
  INR: { symbol: '₹', locale: 'en-IN' },
  ILS: { symbol: '₪', locale: 'he-IL' },
};

export function useFormatters() {
  const user = useAuthStore((s) => s.user);
  const currency = user?.currency || 'USD';
  const locale = user?.locale || CURRENCY_MAP[currency]?.locale || 'en-US';
  const currencyInfo = CURRENCY_MAP[currency] || CURRENCY_MAP.USD;

  const { data: rates } = useExchangeRates('USD');

  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
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

  const convertFromBase = useMemo(() => {
    if (!rates || !rates[currency]) {
      return (amount: number) => amount;
    }
    return (amount: number) => amount * rates[currency];
  }, [rates, currency]);

  return {
    formatCurrency,
    formatDate,
    convertFromBase,
    currency,
    currencySymbol: currencyInfo.symbol,
  };
}