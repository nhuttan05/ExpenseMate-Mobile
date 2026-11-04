import { getExchangeRates, syncTransactions, getDailyTips, FinancialTip } from '../api/expenseApi';
import { Transaction } from '../types';

export const ApiService = {
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
