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
  const [scenarios, challenges] = await Promise.all([fetchAllScenarios(), fetchAllChallenges()]);
  return { scenarios, challenges };
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
    return scenario;
  }
);

export const checkInChallengeAsync = createAsyncThunk('simulation/checkInChallenge', async (id: string) => {
  await updateChallengeProgress(id);
  return id;
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
        const ch = state.challenges.find((c) => c.id === action.payload);
        if (ch) {
          ch.currentDays = Math.min(ch.targetDays, ch.currentDays + 1);
          if (ch.currentDays >= ch.targetDays) {
            ch.status = 'COMPLETED';
          }
        }
      });
  },
});

export const { recalculateHealth } = simulationSlice.actions;
export default simulationSlice.reducer;
