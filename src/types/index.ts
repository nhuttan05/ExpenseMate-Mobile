export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  backgroundColor: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // ISO string or format '2026-11-04'
  formattedTime?: string;
  paymentMethod: string; // 'Tiền mặt' | 'Chuyển khoản' | 'Ví điện tử'
  note?: string;
  attachments?: string[];
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  month: string; // e.g. "10/2026"
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
