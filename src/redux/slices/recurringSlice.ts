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
import { FinanceApi } from '../../api/financeApi';
import { getApiAccessToken } from '../../api/client';

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
  const [localRecurring, localDebts] = await Promise.all([fetchAllRecurring(), fetchAllDebts()]);
  if (!getApiAccessToken()) return { recurringList: localRecurring, debtsList: localDebts };

  try {
    const [remoteRecurring, remoteDebts] = await Promise.all([FinanceApi.listRecurring(), FinanceApi.listDebts()]);
    if (remoteRecurring.length === 0 && localRecurring.length > 0) {
      await Promise.all(localRecurring.map(async (item) => {
        try { await FinanceApi.createRecurring(item); } catch { /* Keep local data when the item already exists. */ }
      }));
    }
    if (remoteDebts.length === 0 && localDebts.length > 0) {
      await Promise.all(localDebts.map(async (item) => {
        try { await FinanceApi.createDebt(item); } catch { /* Keep local data when the item already exists. */ }
      }));
    }
    return {
      recurringList: remoteRecurring.length > 0 ? remoteRecurring : localRecurring,
      debtsList: remoteDebts.length > 0 ? remoteDebts : localDebts,
    };
  } catch {
    return { recurringList: localRecurring, debtsList: localDebts };
  }
});

export const addRecurringAsync = createAsyncThunk(
  'recurring/addRecurring',
  async (item: Omit<RecurringTransaction, 'id'>) => {
    const newItem: RecurringTransaction = { ...item, id: `rec_${Date.now()}` };
    await insertRecurring(newItem);
    if (getApiAccessToken()) {
      try { return await FinanceApi.createRecurring(newItem); } catch { /* Local-first offline fallback. */ }
    }
    return newItem;
  }
);

export const toggleRecurringAsync = createAsyncThunk('recurring/toggleStatus', async (id: string) => {
  await toggleRecurringStatus(id);
  if (getApiAccessToken()) {
    try { return { id, item: await FinanceApi.toggleRecurring(id) }; } catch { /* Local-first offline fallback. */ }
  }
  return { id };
});

export const addDebtAsync = createAsyncThunk('recurring/addDebt', async (debt: Omit<DebtLoanItem, 'id'>) => {
  const newDebt: DebtLoanItem = { ...debt, id: `debt_${Date.now()}` };
  await insertDebt(newDebt);
  if (getApiAccessToken()) {
    try { return await FinanceApi.createDebt(newDebt); } catch { /* Local-first offline fallback. */ }
  }
  return newDebt;
});

export const settleDebtAsync = createAsyncThunk('recurring/settleDebt', async (id: string) => {
  await settleDebt(id);
  if (getApiAccessToken()) {
    try { return { id, item: await FinanceApi.settleDebt(id) }; } catch { /* Local-first offline fallback. */ }
  }
  return { id };
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
        const item = state.recurringList.find((r) => r.id === action.payload.id);
        if (item && action.payload.item) {
          Object.assign(item, action.payload.item);
        } else if (item) {
          item.status = item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        }
      })
      .addCase(addDebtAsync.fulfilled, (state, action) => {
        state.debtsList.unshift(action.payload);
      })
      .addCase(settleDebtAsync.fulfilled, (state, action) => {
        const debt = state.debtsList.find((d) => d.id === action.payload.id);
        if (debt) {
          if (action.payload.item) Object.assign(debt, action.payload.item);
          else debt.status = 'SETTLED';
        }
      });
  },
});

export const { setActiveTab } = recurringSlice.actions;
export default recurringSlice.reducer;
