import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useAppDispatch } from '../redux/store';
import { addTransactionAsync } from '../redux/slices/expenseSlice';
import { categories } from '../data/mockData';
import { Category, TransactionType } from '../types';
import { AIService } from '../services/aiService';
import { ScreenContainer } from '../components/layout/ScreenContainer';

interface AddTransactionScreenProps {
  navigation: any;
}

export const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0]);
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
  const [aiSuggested, setAiSuggested] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    if (text.trim().length >= 3) {
      const predicted = AIService.predictCategory(text);
      if (predicted.type === type) {
        setSelectedCategory(predicted);
        setAiSuggested(true);
      }
    }
  };

  const handleSave = () => {
    const numericAmount = parseFloat(amountStr.replace(/[^0-9]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Thông báo', 'Vui lòng nhập số tiền hợp lệ lớn hơn 0.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên giao dịch (ví dụ: Ăn trưa, Tiền xăng...).');
      return;
    }

    dispatch(
      addTransactionAsync({
        title: title.trim(),
        amount: numericAmount,
        type,
        category: selectedCategory,
        date: new Date().toISOString().split('T')[0],
        formattedTime: 'Vừa xong',
        paymentMethod,
        note: note.trim() || undefined,
      })
    );

    Alert.alert('Thành công', 'Đã lưu giao dịch vào SQLite Database!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleAmountChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (clean === '') {
      setAmountStr('');
      return;
    }
    const formatted = parseInt(clean, 10).toLocaleString('vi-VN');
    setAmountStr(formatted);
  };

  const paymentOptions = ['Tiền mặt', 'Chuyển khoản', 'Ví điện tử'];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm giao dịch mới</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.formPadding}>
        {/* Type Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentItem, type === 'EXPENSE' && styles.segmentExpenseActive]}
            onPress={() => {
              setType('EXPENSE');
              const firstExp = categories.find((c) => c.type === 'EXPENSE');
              if (firstExp) setSelectedCategory(firstExp);
            }}
          >
            <MaterialIcons
              name="arrow-upward"
              size={18}
              color={type === 'EXPENSE' ? Colors.textWhite : Colors.error}
            />
            <Text style={[styles.segmentText, type === 'EXPENSE' && styles.segmentTextActive]}>
              Khoản chi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentItem, type === 'INCOME' && styles.segmentIncomeActive]}
            onPress={() => {
              setType('INCOME');
              const firstInc = categories.find((c) => c.type === 'INCOME');
              if (firstInc) setSelectedCategory(firstInc);
            }}
          >
            <MaterialIcons
              name="arrow-downward"
              size={18}
              color={type === 'INCOME' ? Colors.textWhite : Colors.secondary}
            />
            <Text style={[styles.segmentText, type === 'INCOME' && styles.segmentTextActive]}>
              Khoản thu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Currency Input Card */}
        <View style={[styles.amountCard, Shadows.card]}>
          <Text style={styles.inputLabel}>SỐ TIỀN GIAO DỊCH</Text>
          <View style={styles.amountInputRow}>
            <TextInput
              style={[
                styles.amountInput,
                { color: type === 'INCOME' ? Colors.secondary : Colors.error },
              ]}
              placeholder="0"
              placeholderTextColor={Colors.outlineVariant}
              keyboardType="numeric"
              value={amountStr}
              onChangeText={handleAmountChange}
              autoFocus
            />
            <Text
              style={[
                styles.amountSuffix,
                { color: type === 'INCOME' ? Colors.secondary : Colors.error },
              ]}
            >
              đ
            </Text>
          </View>
        </View>

        {/* Title Input with AI Auto-categorization */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>Tên giao dịch</Text>
            {aiSuggested && (
              <View style={styles.aiTag}>
                <MaterialIcons name="auto-awesome" size={12} color={Colors.primary} />
                <Text style={styles.aiTagText}>AI gợi ý danh mục</Text>
              </View>
            )}
          </View>
          <View style={styles.inputBox}>
            <MaterialIcons name="edit" size={20} color={Colors.textMuted} />
            <TextInput
              style={styles.textInput}
              placeholder="Gõ 'Winmart', 'Cafe Highlands', 'Tiền xăng'..."
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={handleTitleChange}
            />
          </View>
        </View>

        {/* Category Picker Grid */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Danh mục</Text>
          <View style={styles.categoriesGrid}>
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategory.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isSelected && {
                      borderColor: Colors.primary,
                      backgroundColor: Colors.primaryLight,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setAiSuggested(false);
                  }}
                >
                  <View style={[styles.categoryIconCircle, { backgroundColor: cat.backgroundColor }]}>
                    <MaterialIcons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      isSelected && { color: Colors.primary, fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Phương thức thanh toán</Text>
          <View style={styles.paymentMethodRow}>
            {paymentOptions.map((opt) => {
              const isSelected = paymentMethod === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.paymentOption, isSelected && styles.paymentOptionActive]}
                  onPress={() => setPaymentMethod(opt)}
                >
                  <Text
                    style={[
                      styles.paymentOptionText,
                      isSelected && styles.paymentOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Note */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Ghi chú (tùy chọn)</Text>
          <View style={[styles.inputBox, { height: 72, alignItems: 'flex-start', paddingTop: 10 }]}>
            <TextInput
              style={[styles.textInput, { height: '100%', textAlignVertical: 'top' }]}
              placeholder="Thêm mô tả chi tiết giao dịch..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={note}
              onChangeText={setNote}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={[styles.submitBtn, Shadows.floating]} onPress={handleSave}>
          <MaterialIcons name="check" size={22} color={Colors.textWhite} />
          <Text style={styles.submitBtnText}>Lưu vào Database</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F9',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  formPadding: {
    padding: Spacing.lg,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  segmentExpenseActive: {
    backgroundColor: Colors.error,
  },
  segmentIncomeActive: {
    backgroundColor: Colors.secondary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.textWhite,
  },
  amountCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '800',
    minWidth: 120,
    textAlign: 'center',
  },
  amountSuffix: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: Spacing.xs,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  aiTagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#ECEFF8',
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  paymentOptionActive: {
    backgroundColor: Colors.primaryFixed,
    borderColor: Colors.primary,
  },
  paymentOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  paymentOptionTextActive: {
    color: Colors.onPrimaryFixed,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
