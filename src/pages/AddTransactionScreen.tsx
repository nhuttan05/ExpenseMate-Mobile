import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { addTransactionAsync } from '../redux/slices/expenseSlice';
import { categories } from '../data/mockData';
import { Category, TransactionType, JarCode } from '../types';
import { AIService } from '../services/aiService';
import { ScreenContainer } from '../components/layout/ScreenContainer';

interface AddTransactionScreenProps {
  navigation: any;
}

export const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { wallets, jars } = useAppSelector((state) => state.wallet);

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || 'wallet_vcb');
  const [selectedJarCode, setSelectedJarCode] = useState<JarCode>('NEC');
  const [aiNaturalInput, setAiNaturalInput] = useState('');
  const [aiSuggested, setAiSuggested] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  // Natural Language Parser Handler
  const handleApplyNaturalLanguage = () => {
    if (!aiNaturalInput.trim()) return;
    const parsed = AIService.parseNaturalLanguage(aiNaturalInput.trim(), wallets);
    if (!parsed) {
      Alert.alert(
        'Không nhận diện được',
        'Vui lòng nhập rõ số tiền và nội dung (Ví dụ: "Hôm nay ăn phở 65k trừ ví momo").'
      );
      return;
    }

    setAmountStr(parsed.amount.toLocaleString('vi-VN'));
    setTitle(parsed.title);
    setSelectedCategory(parsed.category);
    setSelectedWalletId(parsed.walletId);
    setSelectedJarCode(parsed.jarCode);
    setAiSuggested(true);
    setAiNaturalInput('');
    Alert.alert('✨ AI Đã Tự Động Phân Loại', `Tiêu đề: ${parsed.title}\nSố tiền: ${parsed.amount.toLocaleString('vi-VN')} đ\nDanh mục: ${parsed.category.name}\nVí trừ tiền: ${wallets.find(w => w.id === parsed.walletId)?.name || 'Mặc định'}\nHũ JARS: ${parsed.jarCode}`);
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    if (text.trim().length >= 3) {
      const predicted = AIService.predictCategory(text);
      if (predicted.type === type) {
        setSelectedCategory(predicted);
        setSelectedJarCode(AIService.predictJarCode(predicted, text));
        setAiSuggested(true);
      }
    }
  };

  const addQuickAmount = (delta: number) => {
    const current = Number(amountStr.replace(/[^0-9]/g, '')) || 0;
    const next = current + delta;
    setAmountStr(next.toLocaleString('vi-VN'));
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

    const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

    dispatch(
      addTransactionAsync({
        title: title.trim(),
        amount: numericAmount,
        type,
        category: selectedCategory,
        date: new Date().toISOString().split('T')[0],
        formattedTime: 'Vừa xong',
        paymentMethod: selectedWallet?.name || 'Tiền mặt',
        walletId: selectedWalletId,
        jarCode: type === 'EXPENSE' ? selectedJarCode : undefined,
        note: note.trim() || undefined,
      })
    );

    Alert.alert('Thành công', 'Đã lưu giao dịch vào SQLite Database & Cập nhật số dư ví!', [
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

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm giao dịch mới</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* KHUNG NHẬP LIỆU AI BẰNG CÂU NÓI TỰ NHIÊN */}
        <View style={styles.aiBox}>
          <View style={styles.aiHeaderRow}>
            <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
            <Text style={styles.aiBoxLabel}>GHI CHÉP SIÊU TỐC BẰNG AI TIẾNG VIỆT</Text>
          </View>
          <View style={styles.aiInputRow}>
            <TextInput
              style={styles.aiInput}
              value={aiNaturalInput}
              onChangeText={setAiNaturalInput}
              placeholder="VD: Hôm nay ăn lẩu 350k trừ ví momo..."
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity style={styles.aiApplyBtn} onPress={handleApplyNaturalLanguage} activeOpacity={0.8}>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Type Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentItem, type === 'EXPENSE' && styles.segmentExpenseActive]}
            onPress={() => {
              setType('EXPENSE');
              const firstExp = categories.find((c) => c.type === 'EXPENSE');
              if (firstExp) setSelectedCategory(firstExp);
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="arrow-upward"
              size={18}
              color={type === 'EXPENSE' ? Colors.textWhite : Colors.expense}
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
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="arrow-downward"
              size={18}
              color={type === 'INCOME' ? Colors.textWhite : Colors.income}
            />
            <Text style={[styles.segmentText, type === 'INCOME' && styles.segmentTextActive]}>
              Khoản thu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Currency Input Card */}
        <View style={styles.amountCard}>
          <Text style={styles.inputLabel}>SỐ TIỀN GIAO DỊCH</Text>
          <View style={styles.amountInputRow}>
            <TextInput
              style={[
                styles.amountInput,
                { color: type === 'INCOME' ? Colors.income : Colors.expense },
              ]}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={amountStr}
              onChangeText={handleAmountChange}
              autoFocus
            />
            <Text style={styles.currencyBadge}>VNĐ</Text>
          </View>

          {/* Quick Amount Chips */}
          <View style={styles.quickChipsRow}>
            {[50000, 100000, 200000, 500000, 1000000].map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.quickChip}
                onPress={() => addQuickAmount(val)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>+{val >= 1000000 ? `${val / 1000000}tr` : `${val / 1000}k`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title Input */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>TÊN GIAO DỊCH</Text>
            {aiSuggested && (
              <View style={styles.aiBadge}>
                <MaterialIcons name="auto-awesome" size={12} color={Colors.primary} />
                <Text style={styles.aiBadgeText}>AI gợi ý</Text>
              </View>
            )}
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Ví dụ: Ăn trưa phở bò, Mua sách Fahasa..."
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={handleTitleChange}
          />
        </View>

        {/* CHỌN VÍ NGUỒN TIỀN */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>NGUỒN TIỀN / VÍ TRỪ TIỀN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletsRow}>
            {wallets.map((w) => {
              const isSelected = selectedWalletId === w.id;
              return (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.walletPill, isSelected && styles.walletPillActive]}
                  onPress={() => setSelectedWalletId(w.id)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name={w.icon as any} size={16} color={isSelected ? Colors.textWhite : w.color} />
                  <Text style={[styles.walletPillText, isSelected && styles.walletPillTextActive]}>
                    {w.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* CHỌN HŨ JARS (NẾU LÀ KHOẢN CHI) */}
        {type === 'EXPENSE' && (
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>GẮN VÀO HŨ CHI TIÊU (JARS)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletsRow}>
              {jars.map((j) => {
                const isSelected = selectedJarCode === j.code;
                return (
                  <TouchableOpacity
                    key={j.id}
                    style={[styles.jarPill, isSelected && styles.jarPillActive]}
                    onPress={() => setSelectedJarCode(j.code)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.jarDot, { backgroundColor: j.color }]} />
                    <Text style={[styles.jarPillText, isSelected && styles.jarPillTextActive]}>
                      {j.code} ({j.vietnameseName.split(' ')[0]})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Category Grid */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>DANH MỤC PHÂN LOẠI</Text>
          <View style={styles.categoryGrid}>
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategory.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    isSelected && { borderColor: cat.color, backgroundColor: cat.backgroundColor },
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    if (cat.jarCode) setSelectedJarCode(cat.jarCode);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryIconCircle, { backgroundColor: cat.backgroundColor }]}>
                    <MaterialIcons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      isSelected ? { color: cat.color, fontWeight: '800' } : { color: Colors.textSecondary },
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

        {/* Note */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>GHI CHÚ THÊM (TÙY CHỌN)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Ghi chú chi tiết, ai đi cùng, địa điểm..."
            placeholderTextColor={Colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <MaterialIcons name="check" size={22} color={Colors.textWhite} />
          <Text style={styles.saveButtonText}>Lưu giao dịch</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.lg,
  },

  // AI NATURAL BOX
  aiBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderEmerald,
    gap: Spacing.xs,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBoxLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  aiInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  aiInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: 13,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiApplyBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // SEGMENTED
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.xl,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  segmentExpenseActive: {
    backgroundColor: Colors.expense,
  },
  segmentIncomeActive: {
    backgroundColor: Colors.income,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.textWhite,
  },

  // AMOUNT
  amountCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountInput: {
    flex: 1,
    fontSize: 34,
    fontWeight: '900',
    paddingVertical: Spacing.xs,
  },
  currencyBadge: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.sm,
  },
  quickChip: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },

  formGroup: {
    gap: Spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.sm,
    textAlignVertical: 'top',
  },

  // WALLETS & JARS ROW
  walletsRow: {
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  walletPillActive: {
    backgroundColor: Colors.navyDeep,
    borderColor: Colors.navyDeep,
  },
  walletPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  walletPillTextActive: {
    color: Colors.textWhite,
    fontWeight: '800',
  },

  jarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jarPillActive: {
    backgroundColor: Colors.surfaceSubtle,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  jarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  jarPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  jarPillTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },

  // CATEGORY GRID
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryItem: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // SAVE
  saveButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    ...Shadows.floating,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textWhite,
  },
});
