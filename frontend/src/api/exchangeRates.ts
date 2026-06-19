import axios from 'axios';

const API_URL = 'https://api.frankfurter.app';

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.93,
  GBP: 0.79,
  JPY: 149.5,
  CNY: 7.24,
  INR: 83.5,
  ILS: 3.68,
};

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function fetchRates(base: string = 'USD'): Promise<ExchangeRates> {
  try {
    const { data } = await axios.get(`${API_URL}/latest`, {
      params: { from: base, to: Object.keys(FALLBACK_RATES).filter(c => c !== base).join(',') },
      timeout: 5000,
    });
    return { base: data.base, date: data.date, rates: { [base]: 1, ...data.rates } };
  } catch {
    const rates: Record<string, number> = {};
    for (const [currency, rate] of Object.entries(FALLBACK_RATES)) {
      if (currency === base) {
        rates[currency] = 1;
      } else {
        rates[currency] = rate / FALLBACK_RATES[base];
      }
    }
    return { base, date: new Date().toISOString().split('T')[0], rates };
  }
}

export { FALLBACK_RATES };