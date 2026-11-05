import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { addMessage } from '../redux/slices/aiSlice';
import { addTransactionAsync } from '../redux/slices/expenseSlice';
import { AIService } from '../services/aiService';
import { AIChatMessage } from '../types';

interface AIAssistantScreenProps {
  navigation: any;
}

const createMessageId = () => `msg_${Date.now()}`;

export const AIAssistantScreen: React.FC<AIAssistantScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { messages } = useAppSelector((state) => state.ai);
  const { transactions, monthlyIncome, monthlyExpense } = useAppSelector((state) => state.expense);

  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: AIChatMessage = {
      id: createMessageId(),
      sender: 'user',
      message: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    dispatch(addMessage(userMsg));
    if (!textToSend) setInputText('');

    const parsedTransaction = AIService.parseNaturalLanguage(text);
    if (parsedTransaction) {
      dispatch(addTransactionAsync({
        title: parsedTransaction.title,
        amount: parsedTransaction.amount,
        type: 'EXPENSE',
        category: parsedTransaction.category,
        date: new Date().toISOString().split('T')[0],
        formattedTime: 'Vừa xong',
        paymentMethod: 'Tiền mặt',
      }));
    }

    // AI Processing
    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = parsedTransaction
        ? `Đã tạo khoản chi ${parsedTransaction.title} trị giá ${parsedTransaction.amount.toLocaleString('vi-VN')} đ trong danh mục ${parsedTransaction.category.name}.`
        : 'Tôi đã phân tích dữ liệu tài chính của bạn.';
      let suggestions: string[] | undefined = undefined;

      if (lower.includes('phân tích') || lower.includes('chi tiêu')) {
        const { savingsRate, insights } = AIService.generateInsights(
          transactions,
          monthlyIncome,
          monthlyExpense
        );
        reply = `Theo tính toán AI từ dữ liệu SQLite:\n• Tổng thu: ${monthlyIncome.toLocaleString('vi-VN')} đ\n• Tổng chi: ${monthlyExpense.toLocaleString('vi-VN')} đ\n• Tỷ lệ tiết kiệm: ${savingsRate}%\n\nĐánh giá:\n${insights.map((i: string) => `✓ ${i}`).join('\n')}`;
        suggestions = ['Làm sao để tiết kiệm 5 triệu?', 'Hạn mức ăn uống hiện tại'];
      } else if (lower.includes('ăn uống') || lower.includes('ngân sách')) {
        reply =
          'Danh mục Ăn uống & Tiêu dùng đang chi 8.200.000 đ (82% hạn mức 10 triệu). ExpenseMate AI đề xuất bạn nên giới hạn mức ăn ngoài dưới 200.000 đ/ngày trong những ngày còn lại của tháng.';
      } else if (lower.includes('tiết kiệm') || lower.includes('5 triệu')) {
        reply =
          'Để tích lũy thêm 5.000.000 đ tháng tới, AI khuyên bạn:\n1. Tự nấu ăn tối (tiết kiệm ~2.500.000 đ)\n2. Tối ưu gói cước & dịch vụ đăng ký định kỳ (~500.000 đ)\n3. Trì hoãn mua sắm đồ công nghệ/quần áo không cấp thiết (~2.000.000 đ).';
      }

      const botMsg: AIChatMessage = {
        id: createMessageId(),
        sender: 'assistant',
        message: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions,
      };
      dispatch(addMessage(botMsg));
    }, 400);
  };

  const samplePrompts = [
    'Phân tích chi tiêu tháng này của tôi',
    'Tôi còn bao nhiêu tiền ngân sách ăn uống?',
    'Làm thế nào để tiết kiệm 5 triệu tháng tới?',
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.aiBadgeIcon}>
              <MaterialIcons name="auto-awesome" size={20} color={Colors.textWhite} />
            </View>
            <View>
              <Text style={styles.headerTitle}>ExpenseMate AI</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.statusText}>Trợ lý tài chính Redux + SQLite</Text>
              </View>
            </View>
          </View>

          <View style={{ width: 36 }} />
        </View>

        {/* Quick Prompts */}
        <View style={styles.quickPromptsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPromptsScroll}
          >
            {samplePrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.promptPill}
                onPress={() => handleSend(prompt)}
              >
                <MaterialIcons name="help-outline" size={14} color={Colors.primary} />
                <Text style={styles.promptPillText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isAI = msg.sender === 'assistant';
            return (
              <View
                key={msg.id}
                style={[styles.messageRow, isAI ? styles.messageRowAI : styles.messageRowUser]}
              >
                {isAI && (
                  <View style={styles.botAvatar}>
                    <MaterialIcons name="auto-awesome" size={16} color={Colors.textWhite} />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isAI ? styles.bubbleAI : styles.bubbleUser,
                    isAI && Shadows.subtle,
                  ]}
                >
                  <Text
                    style={[styles.messageText, isAI ? styles.messageTextAI : styles.messageTextUser]}
                  >
                    {msg.message}
                  </Text>
                  <Text style={[styles.timeText, isAI ? styles.timeTextAI : styles.timeTextUser]}>
                    {msg.timestamp}
                  </Text>

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      {msg.suggestions.map((sug, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.suggestionBtn}
                          onPress={() => handleSend(sug)}
                        >
                          <Text style={styles.suggestionBtnText}>{sug}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Hỏi AI về ngân sách, chi tiêu..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                inputText.trim() ? styles.sendBtnActive : styles.sendBtnInactive,
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
            >
              <MaterialIcons
                name="send"
                size={20}
                color={inputText.trim() ? Colors.textWhite : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 60,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  quickPromptsWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F9',
    paddingVertical: Spacing.sm,
  },
  quickPromptsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  promptPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  chatContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  messageRowAI: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  bubbleAI: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#ECEFF8',
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  messageTextAI: {
    color: Colors.textPrimary,
  },
  messageTextUser: {
    color: Colors.textWhite,
  },
  timeText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timeTextAI: {
    color: Colors.textMuted,
  },
  timeTextUser: {
    color: '#DAD7FF',
  },
  suggestionsContainer: {
    marginTop: Spacing.sm,
    gap: 6,
  },
  suggestionBtn: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E7FF',
  },
  suggestionBtnText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F9',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.primary,
  },
  sendBtnInactive: {
    backgroundColor: 'transparent',
  },
});
