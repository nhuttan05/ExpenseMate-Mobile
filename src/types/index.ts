export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type WalletType = 'CASH' | 'BANK' | 'E_WALLET' | 'SAVINGS' | 'CREDIT';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: string;
  icon: string;
  color: string;
  backgroundColor: string;
  accountNumber?: string;
  creditLimit?: number;
  isExcludedFromTotal?: boolean;
}

export type JarCode = 'NEC' | 'FFA' | 'EDU' | 'LTSS' | 'PLAY' | 'GIVE';

export interface JarEnvelope {
  id: string;
  code: JarCode;
  name: string;
  vietnameseName: string;
  percentage: number;
  allocatedAmount: number;
  spentAmount: number;
  color: string;
  icon: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  backgroundColor: string;
  type: 'INCOME' | 'EXPENSE';
  jarCode?: JarCode;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // ISO format 'YYYY-MM-DD'
  formattedTime?: string;
  paymentMethod: string;
  walletId?: string;
  targetWalletId?: string; // used for TRANSFER
  note?: string;
  attachments?: string[];
  jarCode?: JarCode;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  categoryId: string;
  walletId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  dayOfMonth: number;
  status: 'ACTIVE' | 'PAUSED';
  nextDueDate: string;
  note?: string;
}

export interface DebtLoanItem {
  id: string;
  personName: string;
  amount: number;
  type: 'LENT' | 'BORROWED'; // LENT = Cho vay, BORROWED = Đi mượn
  dueDate: string;
  status: 'PENDING' | 'SETTLED';
  note?: string;
  createdAt: string;
  phoneNumber?: string;
}

export interface WhatIfScenario {
  id: string;
  title: string;
  targetAmount: number;
  monthlyPayment?: number;
  durationMonths?: number;
  category: string;
  impactAssessment: string;
  recommendation: string;
  feasibilityScore: number; // 0 - 100
  safeToBuy: boolean;
}

export interface FinancialHealth {
  score: number; // 0 - 1000
  tier: 'Khởi đầu' | 'Khá tốt' | 'Vững vàng' | 'Bậc thầy tài chính';
  savingsRate: number; // %
  debtToIncomeRatio: number; // %
  emergencyFundMonths: number;
  budgetAdherence: number; // %
  actionableTips: string[];
}

export interface FinancialChallenge {
  id: string;
  title: string;
  description: string;
  targetDays: number;
  currentDays: number;
  potentialSavings: number;
  icon: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  badgeName: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  month: string; // e.g. "11/2026"
  color: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  tier: string;
  avatarUrl: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  message: string;
  timestamp: string;
  suggestions?: string[];
}
