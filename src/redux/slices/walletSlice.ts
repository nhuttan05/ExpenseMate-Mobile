import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Wallet, JarEnvelope, Transaction } from '../../types';
import {
  fetchAllWallets,
  insertWallet,
  transferBetweenWallets,
  fetchAllJars,
  updateJarAllocation,
} from '../../services/database';
import { initialWallets, initialJars } from '../../data/mockData';

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
  const [wallets, jars] = await Promise.all([fetchAllWallets(), fetchAllJars()]);
  return { wallets, jars };
});

export const addWalletAsync = createAsyncThunk('wallet/addWallet', async (walletData: Omit<Wallet, 'id'>) => {
  const newWallet: Wallet = {
    ...walletData,
    id: `wallet_${Date.now()}`,
  };
  await insertWallet(newWallet);
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
    const updatedWallets = await fetchAllWallets();
    return { tx, updatedWallets };
  }
);

export const updateJarAllocationAsync = createAsyncThunk(
  'wallet/updateJarAllocation',
  async ({ code, percentage, allocated }: { code: string; percentage: number; allocated: number }) => {
    await updateJarAllocation(code, percentage, allocated);
    return { code, percentage, allocated };
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
      });
  },
});

export const { setSelectedWalletId, updateLocalBalance } = walletSlice.actions;
export default walletSlice.reducer;
