import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WhatIfScenario, FinancialHealth, FinancialChallenge } from '../../types';
import {
  fetchAllScenarios,
  insertScenario,
  fetchAllChallenges,
  updateChallengeProgress,
} from '../../services/database';
import { initialScenarios, initialHealth, initialChallenges } from '../../data/mockData';
import { AIService } from '../../services/aiService';
import { FinanceApi } from '../../api/financeApi';
import { getApiAccessToken } from '../../api/client';

interface SimulationState {
  scenarios: WhatIfScenario[];
  health: FinancialHealth;
  challenges: FinancialChallenge[];
  loading: boolean;
}

const initialState: SimulationState = {
  scenarios: initialScenarios,
  health: initialHealth,
  challenges: initialChallenges,
  loading: false,
};

export const loadSimulationData = createAsyncThunk('simulation/loadAll', async () => {
  const [localScenarios, localChallenges] = await Promise.all([fetchAllScenarios(), fetchAllChallenges()]);
  if (!getApiAccessToken()) return { scenarios: localScenarios, challenges: localChallenges };

  try {
    const [remoteScenarios, remoteChallenges] = await Promise.all([FinanceApi.listScenarios(), FinanceApi.listChallenges()]);
    return {
      scenarios: remoteScenarios.length > 0 ? remoteScenarios : localScenarios,
      challenges: remoteChallenges.length > 0 ? remoteChallenges : localChallenges,
    };
  } catch {
    return { scenarios: localScenarios, challenges: localChallenges };
  }
});

export const createWhatIfScenarioAsync = createAsyncThunk(
  'simulation/createScenario',
  async ({
    title,
    amount,
    durationMonths,
    income,
    expense,
    balance,
  }: {
    title: string;
    amount: number;
    durationMonths: number;
    income: number;
    expense: number;
    balance: number;
  }) => {
    const scenario = AIService.simulateWhatIfScenario(title, amount, durationMonths, income, expense, balance);
    await insertScenario(scenario);
    if (getApiAccessToken()) {
      try {
        return await FinanceApi.simulateScenario({
          id: scenario.id,
          title,
          targetAmount: amount,
          durationMonths,
          income,
          expense,
          balance,
          category: scenario.category,
        });
      } catch { /* Local-first offline fallback. */ }
    }
    return scenario;
  }
);

export const checkInChallengeAsync = createAsyncThunk('simulation/checkInChallenge', async (id: string) => {
  await updateChallengeProgress(id);
  if (getApiAccessToken()) {
    try { return { id, challenge: await FinanceApi.checkInChallenge(id) }; } catch { /* Local-first offline fallback. */ }
  }
  return { id };
});

export const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    recalculateHealth: (
      state,
      action: PayloadAction<{ wallets: any[]; income: number; expense: number }>
    ) => {
      state.health = AIService.evaluateFinancialHealth(
        action.payload.wallets,
        action.payload.income,
        action.payload.expense
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSimulationData.fulfilled, (state, action) => {
        state.scenarios = action.payload.scenarios;
        state.challenges = action.payload.challenges;
      })
      .addCase(createWhatIfScenarioAsync.fulfilled, (state, action) => {
        state.scenarios.unshift(action.payload);
      })
      .addCase(checkInChallengeAsync.fulfilled, (state, action) => {
        const ch = state.challenges.find((c) => c.id === action.payload.id);
        if (ch) {
          if (action.payload.challenge) Object.assign(ch, action.payload.challenge);
          else {
            ch.currentDays = Math.min(ch.targetDays, ch.currentDays + 1);
            if (ch.currentDays >= ch.targetDays) ch.status = 'COMPLETED';
          }
        }
      });
  },
});

export const { recalculateHealth } = simulationSlice.actions;
export default simulationSlice.reducer;
