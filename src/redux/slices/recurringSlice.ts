import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RecurringTransaction, DebtLoanItem } from '../../types';
import {
  fetchAllRecurring,
  insertRecurring,
  toggleRecurringStatus,
  fetchAllDebts,
  insertDebt,
  settleDebt,
} from '../../services/database';
import { initialRecurring, initialDebts } from '../../data/mockData';

interface RecurringState {
  recurringList: RecurringTransaction[];
  debtsList: DebtLoanItem[];
  loading: boolean;
  activeTab: 'RECURRING' | 'DEBTS';
}

const initialState: RecurringState = {
  recurringList: initialRecurring,
  debtsList: initialDebts,
  loading: false,
  activeTab: 'RECURRING',
};

export const loadRecurringAndDebts = createAsyncThunk('recurring/loadAll', async () => {
  const [recurringList, debtsList] = await Promise.all([fetchAllRecurring(), fetchAllDebts()]);
  return { recurringList, debtsList };
});

export const addRecurringAsync = createAsyncThunk(
  'recurring/addRecurring',
  async (item: Omit<RecurringTransaction, 'id'>) => {
    const newItem: RecurringTransaction = { ...item, id: `rec_${Date.now()}` };
    await insertRecurring(newItem);
    return newItem;
  }
);

export const toggleRecurringAsync = createAsyncThunk('recurring/toggleStatus', async (id: string) => {
  await toggleRecurringStatus(id);
  return id;
});

export const addDebtAsync = createAsyncThunk('recurring/addDebt', async (debt: Omit<DebtLoanItem, 'id'>) => {
  const newDebt: DebtLoanItem = { ...debt, id: `debt_${Date.now()}` };
  await insertDebt(newDebt);
  return newDebt;
});

export const settleDebtAsync = createAsyncThunk('recurring/settleDebt', async (id: string) => {
  await settleDebt(id);
  return id;
});

export const recurringSlice = createSlice({
  name: 'recurring',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'RECURRING' | 'DEBTS'>) => {
      state.activeTab = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadRecurringAndDebts.fulfilled, (state, action) => {
        state.recurringList = action.payload.recurringList;
        state.debtsList = action.payload.debtsList;
      })
      .addCase(addRecurringAsync.fulfilled, (state, action) => {
        state.recurringList.push(action.payload);
      })
      .addCase(toggleRecurringAsync.fulfilled, (state, action) => {
        const item = state.recurringList.find((r) => r.id === action.payload);
        if (item) {
          item.status = item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        }
      })
      .addCase(addDebtAsync.fulfilled, (state, action) => {
        state.debtsList.unshift(action.payload);
      })
      .addCase(settleDebtAsync.fulfilled, (state, action) => {
        const debt = state.debtsList.find((d) => d.id === action.payload);
        if (debt) {
          debt.status = 'SETTLED';
        }
      });
  },
});

export const { setActiveTab } = recurringSlice.actions;
export default recurringSlice.reducer;
