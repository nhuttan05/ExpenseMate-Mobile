import { apiClient } from './client';
import {
  DebtLoanItem,
  FinancialChallenge,
  JarEnvelope,
  RecurringTransaction,
  Wallet,
  WhatIfScenario,
} from '../types';

interface ApiResponse<T> {
  data: T;
}

const unwrap = <T>(response: { data: ApiResponse<T> }) => response.data.data;

export const FinanceApi = {
  async listWallets(): Promise<Wallet[]> {
    return unwrap(await apiClient.get<ApiResponse<Wallet[]>>('/wallets'));
  },

  async createWallet(wallet: Wallet): Promise<Wallet> {
    return unwrap(await apiClient.post<ApiResponse<Wallet>>('/wallets', wallet));
  },

  async transferWallet(
    fromWalletId: string,
    payload: { toWalletId: string; amount: number; fee: number; note?: string }
  ): Promise<Wallet[]> {
    const result = unwrap(
      await apiClient.post<ApiResponse<{ wallets: Wallet[] }>>(`/wallets/${fromWalletId}/transfer`, payload)
    );
    return result.wallets;
  },

  async listJars(): Promise<JarEnvelope[]> {
    return unwrap(await apiClient.get<ApiResponse<JarEnvelope[]>>('/wallets/jars'));
  },

  async updateJar(code: string, percentage: number, allocatedAmount: number) {
    return unwrap(
      await apiClient.patch<ApiResponse<{ code: string; percentage: number; allocatedAmount: number }>>(
        `/wallets/jars/${code}`,
        { percentage, allocatedAmount }
      )
    );
  },

  async listRecurring(): Promise<RecurringTransaction[]> {
    return unwrap(await apiClient.get<ApiResponse<RecurringTransaction[]>>('/recurring'));
  },

  async createRecurring(item: RecurringTransaction): Promise<RecurringTransaction> {
    return unwrap(await apiClient.post<ApiResponse<RecurringTransaction>>('/recurring', item));
  },

  async toggleRecurring(id: string): Promise<RecurringTransaction> {
    return unwrap(await apiClient.post<ApiResponse<RecurringTransaction>>(`/recurring/${id}/toggle`));
  },

  async listDebts(): Promise<DebtLoanItem[]> {
    return unwrap(await apiClient.get<ApiResponse<DebtLoanItem[]>>('/debts'));
  },

  async createDebt(item: DebtLoanItem): Promise<DebtLoanItem> {
    return unwrap(await apiClient.post<ApiResponse<DebtLoanItem>>('/debts', item));
  },

  async settleDebt(id: string): Promise<DebtLoanItem> {
    return unwrap(await apiClient.post<ApiResponse<DebtLoanItem>>(`/debts/${id}/settle`));
  },

  async listScenarios(): Promise<WhatIfScenario[]> {
    return unwrap(await apiClient.get<ApiResponse<WhatIfScenario[]>>('/scenarios'));
  },

  async simulateScenario(payload: {
    id?: string;
    title: string;
    targetAmount: number;
    durationMonths: number;
    income: number;
    expense: number;
    balance: number;
    category?: string;
  }): Promise<WhatIfScenario> {
    return unwrap(await apiClient.post<ApiResponse<WhatIfScenario>>('/scenarios/simulate', payload));
  },

  async listChallenges(): Promise<FinancialChallenge[]> {
    return unwrap(await apiClient.get<ApiResponse<FinancialChallenge[]>>('/challenges'));
  },

  async checkInChallenge(id: string): Promise<FinancialChallenge> {
    return unwrap(await apiClient.post<ApiResponse<FinancialChallenge>>(`/challenges/${id}/check-in`));
  },
};
