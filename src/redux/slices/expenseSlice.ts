import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Transaction, TransactionType } from '../../types';
import { fetchAllTransactions, insertTransaction } from '../../services/database';
import { mockUser } from '../../data/mockData';

interface ExpenseState {
  transactions: Transaction[];
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  isBalanceVisible: boolean;
  filterType: 'ALL' | 'EXPENSE' | 'INCOME';
  searchQuery: string;
  loading: boolean;
}

const initialState: ExpenseState = {
  transactions: [],
  totalBalance: mockUser.totalBalance,
  monthlyIncome: mockUser.monthlyIncome,
  monthlyExpense: mockUser.monthlyExpense,
  isBalanceVisible: true,
  filterType: 'ALL',
  searchQuery: '',
  loading: false,
};

export const loadTransactions = createAsyncThunk('expense/loadTransactions', async () => {
  return await fetchAllTransactions();
});

export const addTransactionAsync = createAsyncThunk(
  'expense/addTransaction',
  async (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}`,
    };
    await insertTransaction(newTx);
    return newTx;
  }
);

export const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {
    toggleBalanceVisibility: (state) => {
      state.isBalanceVisible = !state.isBalanceVisible;
    },
    setFilterType: (state, action: PayloadAction<'ALL' | 'EXPENSE' | 'INCOME'>) => {
      state.filterType = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;

        // Recalculate totals
        let income = 0;
        let expense = 0;
        action.payload.forEach((t) => {
          if (t.type === 'INCOME') income += t.amount;
          if (t.type === 'EXPENSE') expense += t.amount;
        });
        state.monthlyIncome = income;
        state.monthlyExpense = expense;
      })
      .addCase(addTransactionAsync.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
        const isIncome = action.payload.type === 'INCOME';
        if (isIncome) {
          state.totalBalance += action.payload.amount;
          state.monthlyIncome += action.payload.amount;
        } else {
          state.totalBalance -= action.payload.amount;
          state.monthlyExpense += action.payload.amount;
        }
      });
  },
});

export const { toggleBalanceVisibility, setFilterType, setSearchQuery } = expenseSlice.actions;
export default expenseSlice.reducer;
