import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AIChatMessage } from '../../types';
import { initialAIChat } from '../../data/mockData';

interface AIState {
  messages: AIChatMessage[];
  isTyping: boolean;
}

const initialState: AIState = {
  messages: initialAIChat,
  isTyping: false,
};

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<AIChatMessage>) => {
      state.messages.push(action.payload);
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
  },
});

export const { addMessage, setTyping } = aiSlice.actions;
export default aiSlice.reducer;
