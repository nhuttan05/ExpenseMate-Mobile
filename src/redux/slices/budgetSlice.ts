import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Budget } from '../../types';
import { fetchAllBudgets } from '../../services/database';

interface BudgetState {
  budgets: Budget[];
  totalAllocated: number;
  loading: boolean;
}

const initialState: BudgetState = {
  budgets: [],
  totalAllocated: 35000000,
  loading: false,
};

export const loadBudgets = createAsyncThunk('budget/loadBudgets', async () => {
  return await fetchAllBudgets();
});

export const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadBudgets.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadBudgets.fulfilled, (state, action) => {
        state.loading = false;
        state.budgets = action.payload;
      });
  },
});

export default budgetSlice.reducer;
