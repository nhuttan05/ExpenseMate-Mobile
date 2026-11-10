import { apiClient } from './client';
import { Category, JarCode, Transaction } from '../types';

interface ApiResponse<T> {
  data: T;
}

export interface ParsedAiTransaction {
  title: string;
  amount: number;
  type: 'EXPENSE';
  category: Category;
  walletId?: string;
  walletName?: string;
  jarCode: JarCode;
}

export interface AiInsights {
  month: string;
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
  largestExpense: {
    title: string;
    amount: number;
    categoryName: string;
    date: string;
  } | null;
  byCategory: { categoryId: string | null; categoryName: string; amount: number; percentage: number }[];
  budgetAlerts: {
    categoryId: string;
    categoryName: string;
    allocatedAmount: number;
    spentAmount: number;
    percentage: number;
    exceeded: boolean;
  }[];
  insights: string[];
  recommendations: string[];
}

export interface AiChatResult {
  intent: 'CREATE_TRANSACTION' | 'FINANCIAL_INSIGHTS' | 'GENERAL';
  reply: string;
  parsedTransaction?: ParsedAiTransaction;
  insights?: AiInsights;
  suggestions?: string[];
}

const unwrap = <T>(response: { data: ApiResponse<T> }) => response.data.data;

export const AiApi = {
  async parseTransaction(text: string): Promise<ParsedAiTransaction | null> {
    return unwrap(await apiClient.post<ApiResponse<ParsedAiTransaction | null>>('/ai/parse-transaction', { text }));
  },

  async chat(text: string): Promise<AiChatResult> {
    return unwrap(await apiClient.post<ApiResponse<AiChatResult>>('/ai/chat', { text }));
  },

  async getInsights(month?: string): Promise<AiInsights> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return unwrap(await apiClient.get<ApiResponse<AiInsights>>(`/ai/insights${query}`));
  },
};

export const toTransactionInput = (parsed: ParsedAiTransaction): Omit<Transaction, 'id'> => ({
  title: parsed.title,
  amount: parsed.amount,
  type: parsed.type,
  category: parsed.category,
  date: new Date().toISOString().split('T')[0],
  formattedTime: 'Vừa xong',
  paymentMethod: parsed.walletName || 'Tiền mặt',
  walletId: parsed.walletId,
  jarCode: parsed.jarCode,
});
