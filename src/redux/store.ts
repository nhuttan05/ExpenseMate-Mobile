import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import expenseReducer from './slices/expenseSlice';
import budgetReducer from './slices/budgetSlice';
import aiReducer from './slices/aiSlice';

export const store = configureStore({
  reducer: {
    expense: expenseReducer,
    budget: budgetReducer,
    ai: aiReducer,
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
