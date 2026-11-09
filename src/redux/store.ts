import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import expenseReducer from './slices/expenseSlice';
import budgetReducer from './slices/budgetSlice';
import aiReducer from './slices/aiSlice';
import walletReducer from './slices/walletSlice';
import recurringReducer from './slices/recurringSlice';
import simulationReducer from './slices/simulationSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    expense: expenseReducer,
    budget: budgetReducer,
    ai: aiReducer,
    wallet: walletReducer,
    recurring: recurringReducer,
    simulation: simulationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
