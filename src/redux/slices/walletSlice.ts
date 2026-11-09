import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Wallet, JarEnvelope } from '../../types';
import {
  fetchAllWallets,
  insertWallet,
  transferBetweenWallets,
  fetchAllJars,
  updateJarAllocation,
  updateAllJarsAllocation,
  setWalletExactBalance,
} from '../../services/database';
import { initialWallets, initialJars } from '../../data/mockData';
import { FinanceApi } from '../../api/financeApi';
import { getApiAccessToken } from '../../api/client';

interface WalletState {
  wallets: Wallet[];
  jars: JarEnvelope[];
  selectedWalletId: string;
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  wallets: initialWallets,
  jars: initialJars,
  selectedWalletId: initialWallets[0]?.id || 'wallet_vcb',
  loading: false,
  error: null,
};

export const loadWalletsAndJars = createAsyncThunk('wallet/loadWalletsAndJars', async () => {
  const [localWallets, localJars] = await Promise.all([fetchAllWallets(), fetchAllJars()]);
  if (!getApiAccessToken()) return { wallets: localWallets, jars: localJars };

  try {
    const [remoteWallets, remoteJars] = await Promise.all([FinanceApi.listWallets(), FinanceApi.listJars()]);
    if (remoteWallets.length === 0 && localWallets.length > 0) {
      await Promise.all(localWallets.map(async (wallet) => {
        try { await FinanceApi.createWallet(wallet); } catch { /* Keep local data when the item already exists. */ }
      }));
    }
    return {
      wallets: remoteWallets.length > 0 ? remoteWallets : localWallets,
      jars: remoteJars.length > 0 ? remoteJars : localJars,
    };
  } catch {
    return { wallets: localWallets, jars: localJars };
  }
});

export const addWalletAsync = createAsyncThunk('wallet/addWallet', async (walletData: Omit<Wallet, 'id'>) => {
  const newWallet: Wallet = {
    ...walletData,
    id: `wallet_${Date.now()}`,
  };
  await insertWallet(newWallet);
  if (getApiAccessToken()) {
    try { return await FinanceApi.createWallet(newWallet); } catch { /* Local-first offline fallback. */ }
  }
  return newWallet;
});

export const executeTransferAsync = createAsyncThunk(
  'wallet/executeTransfer',
  async ({
    fromWalletId,
    toWalletId,
    amount,
    fee,
    note,
  }: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    fee: number;
    note?: string;
  }) => {
    const tx = await transferBetweenWallets(fromWalletId, toWalletId, amount, fee, note);
    let updatedWallets = await fetchAllWallets();
    if (getApiAccessToken()) {
      try {
        updatedWallets = await FinanceApi.transferWallet(fromWalletId, { toWalletId, amount, fee, note });
      } catch { /* The local transfer remains available until the server is reachable. */ }
    }
    return { tx, updatedWallets };
  }
);

export const updateJarAllocationAsync = createAsyncThunk(
  'wallet/updateJarAllocation',
  async ({ code, percentage, allocated }: { code: string; percentage: number; allocated: number }) => {
    await updateJarAllocation(code, percentage, allocated);
    if (getApiAccessToken()) {
      try {
        const remote = await FinanceApi.updateJar(code, percentage, allocated);
        return { code: remote.code, percentage: remote.percentage, allocated: remote.allocatedAmount };
      } catch { /* Local-first offline fallback. */ }
    }
    return { code, percentage, allocated };
  }
);

export const updateAllJarsAsync = createAsyncThunk(
  'wallet/updateAllJars',
  async (updatedJars: JarEnvelope[]) => {
    await updateAllJarsAllocation(updatedJars);
    if (getApiAccessToken()) {
      try {
        await Promise.all(
          updatedJars.map((j) => FinanceApi.updateJar(j.code, j.percentage, j.allocatedAmount))
        );
      } catch {
        /* Local-first offline fallback. */
      }
    }
    return updatedJars;
  }
);

export const setWalletExactBalanceAsync = createAsyncThunk(
  'wallet/setWalletExactBalance',
  async ({
    walletId,
    newBalance,
    note,
    recordAdjustment,
  }: {
    walletId: string;
    newBalance: number;
    note?: string;
    recordAdjustment?: boolean;
  }) => {
    await setWalletExactBalance(walletId, newBalance, note, recordAdjustment ?? true);
    return { walletId, newBalance };
  }
);

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setSelectedWalletId: (state, action: PayloadAction<string>) => {
      state.selectedWalletId = action.payload;
    },
    updateLocalBalance: (state, action: PayloadAction<{ walletId: string; amountDelta: number }>) => {
      const wallet = state.wallets.find((w) => w.id === action.payload.walletId);
      if (wallet) {
        wallet.balance += action.payload.amountDelta;
      }
    },
    setJars: (state, action: PayloadAction<JarEnvelope[]>) => {
      state.jars = action.payload;
    },
    updateSingleJarLimit: (
      state,
      action: PayloadAction<{ code: string; allocatedAmount: number; percentage?: number }>
    ) => {
      const jar = state.jars.find((j) => j.code === action.payload.code);
      if (jar) {
        jar.allocatedAmount = action.payload.allocatedAmount;
        if (action.payload.percentage !== undefined) {
          jar.percentage = action.payload.percentage;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadWalletsAndJars.fulfilled, (state, action) => {
        state.wallets = action.payload.wallets;
        state.jars = action.payload.jars;
      })
      .addCase(addWalletAsync.fulfilled, (state, action) => {
        state.wallets.push(action.payload);
      })
      .addCase(executeTransferAsync.fulfilled, (state, action) => {
        state.wallets = action.payload.updatedWallets;
      })
      .addCase(updateJarAllocationAsync.fulfilled, (state, action) => {
        const jar = state.jars.find((j) => j.code === action.payload.code);
        if (jar) {
          jar.percentage = action.payload.percentage;
          jar.allocatedAmount = action.payload.allocated;
        }
      })
      .addCase(updateAllJarsAsync.fulfilled, (state, action) => {
        state.jars = action.payload;
      })
      .addCase(setWalletExactBalanceAsync.fulfilled, (state, action) => {
        const wallet = state.wallets.find((w) => w.id === action.payload.walletId);
        if (wallet) {
          wallet.balance = action.payload.newBalance;
        }
      });
  },
});

export const {
  setSelectedWalletId,
  updateLocalBalance,
  setJars,
  updateSingleJarLimit,
} = walletSlice.actions;

export default walletSlice.reducer;
