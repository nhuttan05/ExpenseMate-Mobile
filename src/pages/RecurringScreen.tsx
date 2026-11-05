import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';
import { useAppDispatch, useAppSelector } from '../redux/store';
import {
  loadRecurringAndDebts,
  addRecurringAsync,
  toggleRecurringAsync,
  addDebtAsync,
  settleDebtAsync,
  setActiveTab,
} from '../redux/slices/recurringSlice';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AnimatedCard } from '../components/ui/AnimatedCard';

interface RecurringScreenProps {
  navigation: any;
}

export const RecurringScreen: React.FC<RecurringScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { recurringList, debtsList, activeTab } = useAppSelector((state) => state.recurring);
  const { wallets } = useAppSelector((state) => state.wallet);

  const [addRecurringModal, setAddRecurringModal] = useState(false);
  const [addDebtModal, setAddDebtModal] = useState(false);
  const [reminderModal, setReminderModal] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: '',
  });

  // Recurring Form State
  const [recTitle, setRecTitle] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recType, setRecType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [recDay, setRecDay] = useState('1');
  const [recWalletId, setRecWalletId] = useState(wallets[0]?.id || 'wallet_vcb');
  const [recNote, setRecNote] = useState('');

  // Debt Form State
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtType, setDebtType] = useState<'LENT' | 'BORROWED'>('LENT');
  const [debtDueDate, setDebtDueDate] = useState('2026-11-20');
  const [debtNote, setDebtNote] = useState('');

  useEffect(() => {
    dispatch(loadRecurringAndDebts());
  }, [dispatch]);

  // Thống kê định kỳ
  const totalMonthlyRecurringExpense = recurringList
    .filter((r) => r.type === 'EXPENSE' && r.status === 'ACTIVE')
    .reduce((sum, r) => sum + r.amount, 0);

  // Thống kê nợ
  const totalLent = debtsList
    .filter((d) => d.type === 'LENT' && d.status === 'PENDING')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalBorrowed = debtsList
    .filter((d) => d.type === 'BORROWED' && d.status === 'PENDING')
    .reduce((sum, d) => sum + d.amount, 0);

  const handleCreateRecurring = async () => {
    const amount = Number(recAmount.replace(/[^0-9]/g, ''));
    const day = Number(recDay) || 1;
    if (!recTitle.trim() || !amount) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên khoản định kỳ và số tiền.');
      return;
    }

    await dispatch(
      addRecurringAsync({
        title: recTitle.trim(),
        amount,
        type: recType,
        categoryId: recType === 'EXPENSE' ? 'cat_utilities' : 'cat_salary',
        walletId: recWalletId,
        frequency: 'MONTHLY',
        dayOfMonth: day,
        status: 'ACTIVE',
        nextDueDate: `2026-12-${String(day).padStart(2, '0')}`,
        note: recNote.trim() || undefined,
      })
    );

    Alert.alert('Thành công', 'Đã thêm khoản chi/thu định kỳ mới.');
    setAddRecurringModal(false);
    setRecTitle('');
    setRecAmount('');
    setRecNote('');
  };

  const handleCreateDebt = async () => {
    const amount = Number(debtAmount.replace(/[^0-9]/g, ''));
    if (!debtPerson.trim() || !amount) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên người và số tiền nợ.');
      return;
    }

    await dispatch(
      addDebtAsync({
        personName: debtPerson.trim(),
        amount,
        type: debtType,
        dueDate: debtDueDate,
        status: 'PENDING',
        note: debtNote.trim() || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      })
    );

    Alert.alert('Đã lưu vào sổ nợ', `Đã ghi nhận khoản ${debtType === 'LENT' ? 'cho vay' : 'mượn'} của ${debtPerson}.`);
    setAddDebtModal(false);
    setDebtPerson('');
    setDebtAmount('');
    setDebtNote('');
  };

  const openSmartReminder = (item: any) => {
    const text = `Chào ${item.personName} nhé! Mình gửi lời nhắn nhắc nhẹ khoản ${formatCurrency(
      item.amount
    )} hẹn thanh toán ngày ${item.dueDate} (${item.note || 'tiền ăn uống/sinh hoạt'}). Khi nào tiện bạn chuyển khoản giúp mình qua STK: Vietcombank 9988112233 nha. Cảm ơn bạn nhiều! ✨`;
    setReminderModal({ visible: true, text });
  };

  return (
    <ScreenContainer>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Phí Định Kỳ & Nợ</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (activeTab === 'RECURRING' ? setAddRecurringModal(true) : setAddDebtModal(true))}
          activeOpacity={0.75}
        >
          <MaterialIcons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'RECURRING' && styles.tabButtonActive]}
          onPress={() => dispatch(setActiveTab('RECURRING'))}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="event-repeat"
            size={18}
            color={activeTab === 'RECURRING' ? Colors.textWhite : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'RECURRING' && styles.tabButtonTextActive,
            ]}
          >
            Định Kỳ Hàng Tháng ({recurringList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'DEBTS' && styles.tabButtonActive]}
          onPress={() => dispatch(setActiveTab('DEBTS'))}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="menu-book"
            size={18}
            color={activeTab === 'DEBTS' ? Colors.textWhite : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'DEBTS' && styles.tabButtonTextActive,
            ]}
          >
            Sổ Nợ & Cho Vay ({debtsList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: ĐỊNH KỲ HÀNG THÁNG */}
      {activeTab === 'RECURRING' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <AnimatedCard delay={50} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TỔNG CHI PHÍ CỐ ĐỊNH THÁNG NÀY</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalMonthlyRecurringExpense)}</Text>
            <Text style={styles.summarySub}>
              Bao gồm tiền thuê nhà, internet, phí sinh hoạt, gói dịch vụ tự động trừ.
            </Text>
          </AnimatedCard>

          <View style={styles.listContainer}>
            {recurringList.map((rec) => {
              const isExpense = rec.type === 'EXPENSE';
              const isActive = rec.status === 'ACTIVE';

              return (
                <AnimatedCard key={rec.id} delay={100} style={styles.itemCard}>
                  <View style={styles.itemRow}>
                    <View
                      style={[
                        styles.itemIconBox,
                        { backgroundColor: isExpense ? Colors.warningLight : Colors.primaryLight },
                      ]}
                    >
                      <MaterialIcons
                        name={isExpense ? 'receipt' : 'payments'}
                        size={22}
                        color={isExpense ? Colors.warning : Colors.primary}
                      />
                    </View>

                    <View style={styles.itemDetails}>
                      <Text style={styles.itemTitle}>{rec.title}</Text>
                      <Text style={styles.itemDate}>
                        Ngày {rec.dayOfMonth} hàng tháng • Đến hạn: {rec.nextDueDate}
                      </Text>
                      {rec.note ? <Text style={styles.itemNote}>{rec.note}</Text> : null}
                    </View>

                    <View style={styles.itemRight}>
                      <Text
                        style={[
                          styles.itemAmount,
                          isExpense ? { color: Colors.textPrimary } : { color: Colors.income },
                        ]}
                      >
                        {isExpense ? '-' : '+'}
                        {formatCurrency(rec.amount)}
                      </Text>

                      <TouchableOpacity
                        style={[styles.statusToggle, isActive ? styles.statusActive : styles.statusPaused]}
                        onPress={() => dispatch(toggleRecurringAsync(rec.id))}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.statusToggleText,
                            isActive ? { color: Colors.primary } : { color: Colors.textMuted },
                          ]}
                        >
                          {isActive ? 'Đang bật' : 'Tạm dừng'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </AnimatedCard>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* TAB 2: SỔ NỢ & CHO VAY */}
      {activeTab === 'DEBTS' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <AnimatedCard delay={50} style={styles.summaryCard}>
            <View style={styles.debtSummaryRow}>
              <View style={styles.debtSummaryCol}>
                <Text style={styles.summaryLabel}>TÔI CHO VAY (CẦN THU)</Text>
                <Text style={[styles.summaryValue, { color: Colors.income }]}>
                  {formatCurrency(totalLent)}
                </Text>
              </View>
              <View style={styles.debtSummaryDivider} />
              <View style={styles.debtSummaryCol}>
                <Text style={styles.summaryLabel}>TÔI ĐANG MƯỢN (PHẢI TRẢ)</Text>
                <Text style={[styles.summaryValue, { color: Colors.expense }]}>
                  {formatCurrency(totalBorrowed)}
                </Text>
              </View>
            </View>
          </AnimatedCard>

          <View style={styles.listContainer}>
            {debtsList.map((debt) => {
              const isLent = debt.type === 'LENT';
              const isSettled = debt.status === 'SETTLED';

              return (
                <AnimatedCard key={debt.id} delay={100} style={styles.itemCard}>
                  <View style={styles.itemRow}>
                    <View
                      style={[
                        styles.itemIconBox,
                        { backgroundColor: isLent ? Colors.incomeLight : Colors.expenseLight },
                      ]}
                    >
                      <MaterialIcons
                        name={isLent ? 'arrow-upward' : 'arrow-downward'}
                        size={22}
                        color={isLent ? Colors.income : Colors.expense}
                      />
                    </View>

                    <View style={styles.itemDetails}>
                      <View style={styles.personHeader}>
                        <Text style={styles.itemTitle}>{debt.personName}</Text>
                        <View
                          style={[
                            styles.debtTypeBadge,
                            { backgroundColor: isLent ? Colors.incomeLight : Colors.expenseLight },
                          ]}
                        >
                          <Text
                            style={[
                              styles.debtTypeBadgeText,
                              { color: isLent ? Colors.income : Colors.expense },
                            ]}
                          >
                            {isLent ? 'Tôi cho vay' : 'Tôi mượn'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.itemDate}>
                        Hạn hẹn: {debt.dueDate} • Tạo ngày {debt.createdAt}
                      </Text>
                      {debt.note ? <Text style={styles.itemNote}>{debt.note}</Text> : null}
                    </View>

                    <View style={styles.itemRight}>
                      <Text
                        style={[
                          styles.itemAmount,
                          isLent ? { color: Colors.income } : { color: Colors.expense },
                        ]}
                      >
                        {formatCurrency(debt.amount)}
                      </Text>

                      {isSettled ? (
                        <View style={styles.settledBadge}>
                          <MaterialIcons name="check-circle" size={14} color={Colors.income} />
                          <Text style={styles.settledBadgeText}>Đã xong</Text>
                        </View>
                      ) : (
                        <View style={styles.debtActionRow}>
                          {isLent ? (
                            <TouchableOpacity
                              style={styles.remindBtn}
                              onPress={() => openSmartReminder(debt)}
                              activeOpacity={0.75}
                            >
                              <MaterialIcons name="chat-bubble-outline" size={14} color={Colors.primary} />
                              <Text style={styles.remindBtnText}>Nhắc</Text>
                            </TouchableOpacity>
                          ) : null}

                          <TouchableOpacity
                            style={styles.settleBtn}
                            onPress={() => dispatch(settleDebtAsync(debt.id))}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.settleBtnText}>Tất toán</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </AnimatedCard>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* POPUP: TIN NHẮN NHẮC NỢ KHÉO LÉO */}
      <Modal visible={reminderModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.reminderContent}>
            <View style={styles.reminderHeader}>
              <MaterialIcons name="auto-awesome" size={24} color={Colors.primary} />
              <Text style={styles.reminderTitle}>Tin Nhắn Nhắc Nợ Khéo Léo</Text>
            </View>
            <Text style={styles.reminderSub}>
              Đã tạo sẵn mẫu tin nhắn lịch sự, thân thiện. Bạn có thể copy để gửi qua Zalo hoặc tin nhắn SMS!
            </Text>
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{reminderModal.text}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => {
                Alert.alert('Đã sao chép', 'Nội dung tin nhắn đã sẵn sàng để dán vào Zalo/SMS.');
                setReminderModal({ visible: false, text: '' });
              }}
            >
              <MaterialIcons name="content-copy" size={18} color={Colors.textWhite} />
              <Text style={styles.copyBtnText}>Sao Chép Tin Nhắn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeReminderBtn}
              onPress={() => setReminderModal({ visible: false, text: '' })}
            >
              <Text style={styles.closeReminderText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL THÊM KHOẢN ĐỊNH KỲ */}
      <Modal visible={addRecurringModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm Khoản Định Kỳ</Text>
              <TouchableOpacity onPress={() => setAddRecurringModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Tên khoản thanh toán</Text>
              <TextInput
                style={styles.textInput}
                value={recTitle}
                onChangeText={setRecTitle}
                placeholder="Ví dụ: Tiền thuê trọ, Netflix, Lương"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Số tiền (VNĐ)</Text>
              <TextInput
                style={styles.textInput}
                value={recAmount}
                onChangeText={setRecAmount}
                placeholder="Ví dụ: 3.500.000"
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Loại dòng tiền</Text>
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[styles.pill, recType === 'EXPENSE' && styles.pillActive]}
                  onPress={() => setRecType('EXPENSE')}
                >
                  <Text style={[styles.pillText, recType === 'EXPENSE' && styles.pillTextActive]}>
                    Khoản Chi Trả
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pill, recType === 'INCOME' && styles.pillActive]}
                  onPress={() => setRecType('INCOME')}
                >
                  <Text style={[styles.pillText, recType === 'INCOME' && styles.pillTextActive]}>
                    Khoản Thu Về
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Ngày thanh toán trong tháng (1 - 31)</Text>
              <TextInput
                style={styles.textInput}
                value={recDay}
                onChangeText={setRecDay}
                placeholder="1"
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Ghi chú thêm</Text>
              <TextInput
                style={styles.textInput}
                value={recNote}
                onChangeText={setRecNote}
                placeholder="Ghi chú người nhận, điều kiện..."
                placeholderTextColor={Colors.textMuted}
              />

              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateRecurring}>
                <Text style={styles.confirmBtnText}>Lưu Khoản Định Kỳ</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL THÊM KHOẢN NỢ */}
      <Modal visible={addDebtModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm Khoản Vay / Nợ</Text>
              <TouchableOpacity onPress={() => setAddDebtModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Họ tên người liên quan</Text>
              <TextInput
                style={styles.textInput}
                value={debtPerson}
                onChangeText={setDebtPerson}
                placeholder="Ví dụ: Hoàng Tuấn, Chị Lan..."
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Số tiền (VNĐ)</Text>
              <TextInput
                style={styles.textInput}
                value={debtAmount}
                onChangeText={setDebtAmount}
                placeholder="Ví dụ: 1.000.000"
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Phân loại</Text>
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[styles.pill, debtType === 'LENT' && styles.pillActive]}
                  onPress={() => setDebtType('LENT')}
                >
                  <Text style={[styles.pillText, debtType === 'LENT' && styles.pillTextActive]}>
                    Tôi Cho Vay (Cần đòi)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pill, debtType === 'BORROWED' && styles.pillActive]}
                  onPress={() => setDebtType('BORROWED')}
                >
                  <Text style={[styles.pillText, debtType === 'BORROWED' && styles.pillTextActive]}>
                    Tôi Đi Mượn (Cần trả)
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Ngày hẹn thanh toán (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={debtDueDate}
                onChangeText={setDebtDueDate}
                placeholder="2026-11-30"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Lý do / Ghi chú</Text>
              <TextInput
                style={styles.textInput}
                value={debtNote}
                onChangeText={setDebtNote}
                placeholder="Tiền ăn uống, mua đồ công nghệ..."
                placeholderTextColor={Colors.textMuted}
              />

              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateDebt}>
                <Text style={styles.confirmBtnText}>Lưu Vào Sổ Nợ</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  backButton: {
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
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.xl,
    padding: 4,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.navyDeep,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.textWhite,
  },

  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    marginBottom: 4,
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  summarySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  debtSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtSummaryCol: {
    flex: 1,
  },
  debtSummaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },

  listContainer: {
    gap: Spacing.md,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  debtTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  debtTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  itemDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  statusToggle: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.borderEmerald,
  },
  statusPaused: {
    backgroundColor: Colors.surfaceSubtle,
    borderColor: Colors.border,
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },

  debtActionRow: {
    flexDirection: 'row',
    gap: 4,
  },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
  },
  remindBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  settleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.navyDeep,
    borderRadius: BorderRadius.md,
  },
  settleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.incomeLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  settledBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.income,
  },

  // REMINDER POPUP
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  reminderContent: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.hero,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  reminderSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  messageBox: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  copyBtn: {
    height: 46,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  closeReminderBtn: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeReminderText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  // FORM MODAL
  modalContent: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  textInput: {
    height: 48,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pill: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.navyDeep,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: Colors.textWhite,
  },
  confirmBtn: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textWhite,
  },
});
