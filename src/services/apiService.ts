import { getExchangeRates, syncTransactions, getDailyTips, FinancialTip } from '../api/expenseApi';
import { apiClient } from '../api/client';
import { Transaction } from '../types';

export const ApiService = {
  checkHealth: async (): Promise<boolean> => {
    try {
      const baseUrl = apiClient.defaults.baseURL || 'http://localhost:3000/api/v1';
      const rootUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
      const response = await fetch(`${rootUrl}/health`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  },
  fetchExchangeRates: async () => {
    return await getExchangeRates();
  },
  syncLocalToCloud: async (txs: Transaction[]) => {
    return await syncTransactions(txs);
  },
  getTips: async (): Promise<FinancialTip[]> => {
    return await getDailyTips();
  },
};
