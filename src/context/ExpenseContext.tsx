import React, { createContext, useContext, useState } from 'react';
import { Transaction, Budget, UserProfile, AIChatMessage } from '../types';
import { initialTransactions, initialBudgets, mockUser, initialAIChat } from '../data/mockData';

interface ExpenseContextType {
  user: UserProfile;
  transactions: Transaction[];
  budgets: Budget[];
  aiMessages: AIChatMessage[];
  isBalanceVisible: boolean;
  toggleBalanceVisibility: () => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  sendAIMessage: (text: string) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(mockUser);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>(initialAIChat);
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true);

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible((prev) => !prev);
  };

  const addTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: `tx_${Date.now()}`,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update user balance
    setUser((prev) => {
      const isIncome = newTx.type === 'INCOME';
      const balanceChange = isIncome ? newTx.amount : -newTx.amount;
      return {
        ...prev,
        totalBalance: prev.totalBalance + balanceChange,
        monthlyIncome: isIncome ? prev.monthlyIncome + newTx.amount : prev.monthlyIncome,
        monthlyExpense: !isIncome ? prev.monthlyExpense + newTx.amount : prev.monthlyExpense,
      };
    });

    // Update budget if matching category
    if (newTx.type === 'EXPENSE') {
      setBudgets((prevBudgets) =>
        prevBudgets.map((b) =>
          b.categoryId === newTx.category.id
            ? { ...b, spentAmount: b.spentAmount + newTx.amount }
            : b
        )
      );
    }
  };

  const sendAIMessage = (text: string) => {
    const userMsg: AIChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      message: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Generate intelligent AI response based on questions
    let reply = 'Tôi đã ghi nhận câu hỏi của bạn và đang tính toán phân tích dữ liệu giao dịch.';
    let suggestions: string[] | undefined = undefined;

    const lower = text.toLowerCase();
    if (lower.includes('phân tích') || lower.includes('chi tiêu')) {
      reply = `Theo dữ liệu tháng này, bạn đã chi tiêu ${user.monthlyExpense.toLocaleString('vi-VN')} đ (đạt 82% hạn mức kế hoạch 35.000.000 đ).\n\nKhoản chi lớn nhất tập trung vào:\n1. Ăn uống & Tiêu dùng: 8.200.000 đ (chiếm 28.6%)\n2. Mua sắm cá nhân: 6.450.000 đ (chiếm 22.5%)\n3. Hóa đơn & Tiện ích: 4.300.000 đ\n\nBạn còn 6.350.000 đ hạn mức an toàn cho những ngày còn lại của tháng.`;
      suggestions = ['Cắt giảm chi tiêu ăn uống như thế nào?', 'Gợi ý tỷ lệ phân bổ 50/30/20'];
    } else if (lower.includes('ăn uống') || lower.includes('ngân sách')) {
      reply = 'Ngân sách danh mục Ăn uống & Tiêu dùng của bạn là 10.000.000 đ, bạn đã chi 8.200.000 đ (còn lại 1.800.000 đ, tương đương 18%). Hãy chú ý duy trì mức trung bình khoảng 250.000 đ/ngày để không vượt ngưỡng!';
    } else if (lower.includes('tiết kiệm') || lower.includes('5 triệu')) {
      reply = 'Để tiết kiệm 5.000.000 đ cho tháng sau, ExpenseMate AI đề xuất:\n- Giảm tần suất ăn ngoài (tiết kiệm ~2.500.000 đ)\n- Trì hoãn các món mua sắm không thiết yếu (tiết kiệm ~1.800.000 đ)\n- Hạn chế cafe hàng quán, tự pha tại văn phòng (tiết kiệm ~700.000 đ).';
    }

    const assistantMsg: AIChatMessage = {
      id: `msg_${Date.now() + 1}`,
      sender: 'assistant',
      message: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions,
    };

    setAiMessages((prev) => [...prev, userMsg, assistantMsg]);
  };

  return (
    <ExpenseContext.Provider
      value={{
        user,
        transactions,
        budgets,
        aiMessages,
        isBalanceVisible,
        toggleBalanceVisibility,
        addTransaction,
        sendAIMessage,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
