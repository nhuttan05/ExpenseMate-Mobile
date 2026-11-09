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
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, DarkColors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';
import { useAppDispatch, useAppSelector } from '../redux/store';
import {
  loadWalletsAndJars,
  executeTransferAsync,
  addWalletAsync,
  setWalletExactBalanceAsync,
} from '../redux/slices/walletSlice';
import { loadTransactions } from '../redux/slices/expenseSlice';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { Wallet, WalletType } from '../types';

interface WalletsScreenProps {
  navigation: any;
  route?: any;
}

export const WalletsScreen: React.FC<WalletsScreenProps> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { wallets } = useAppSelector((state) => state.wallet);
  const { isDarkMode } = useAppSelector((state) => state.auth);
  const theme = isDarkMode ? DarkColors : Colors;

  const [transferModalVisible, setTransferModalVisible] = useState(Boolean(route?.params?.openTransferModal));
  const [addWalletModalVisible, setAddWalletModalVisible] = useState(false);

  // Transfer Form State
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || 'wallet_vcb');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || 'wallet_cash');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferFee, setTransferFee] = useState('0');
  const [transferNote, setTransferNote] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  // New Wallet Form State
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<WalletType>('BANK');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [newWalletAccountNo, setNewWalletAccountNo] = useState('');

  // Edit Balance Modal State
  const [editBalanceModalVisible, setEditBalanceModalVisible] = useState(false);
  const [selectedWalletForEdit, setSelectedWalletForEdit] = useState<Wallet | null>(null);
  const [editNewBalanceInput, setEditNewBalanceInput] = useState('');
  const [editBalanceNote, setEditBalanceNote] = useState('');
  const [recordAdjustmentTx, setRecordAdjustmentTx] = useState(true);
  const [editBalanceLoading, setEditBalanceLoading] = useState(false);

  useEffect(() => {
    dispatch(loadWalletsAndJars());
  }, [dispatch, route?.params?.openTransferModal]);

  const totalLiquidBalance = wallets
    .filter((w) => w.type !== 'CREDIT' && !w.isExcludedFromTotal)
    .reduce((sum, w) => sum + w.balance, 0);

  const creditDebtTotal = wallets
    .filter((w) => w.type === 'CREDIT')
    .reduce((sum, w) => sum + Math.abs(w.balance), 0);

  const handleOpenEditBalance = (wallet: Wallet) => {
    setSelectedWalletForEdit(wallet);
    setEditNewBalanceInput(Math.abs(wallet.balance).toString());
    setEditBalanceNote('Kiểm kê khớp thực tế');
    setRecordAdjustmentTx(true);
    setEditBalanceModalVisible(true);
  };

  const handleQuickDelta = (delta: number) => {
    const currentVal = Number(editNewBalanceInput.replace(/[^0-9]/g, '')) || 0;
    const newVal = Math.max(0, currentVal + delta);
    setEditNewBalanceInput(newVal.toString());
  };

  const handleSaveEditBalance = async () => {
    if (!selectedWalletForEdit) return;

    const rawNum = Number(editNewBalanceInput.replace(/[^0-9]/g, ''));
    if (isNaN(rawNum) || rawNum < 0) {
      Alert.alert('Số dư không hợp lệ', 'Vui lòng nhập số tiền hợp lệ lớn hơn hoặc bằng 0.');
      return;
    }

    const finalBalance = selectedWalletForEdit.type === 'CREDIT' ? -rawNum : rawNum;
    setEditBalanceLoading(true);

    try {
      await dispatch(
        setWalletExactBalanceAsync({
          walletId: selectedWalletForEdit.id,
          newBalance: finalBalance,
          note: editBalanceNote.trim() || undefined,
          recordAdjustment: recordAdjustmentTx,
        })
      ).unwrap();

      await dispatch(loadWalletsAndJars());
      await dispatch(loadTransactions());

      Alert.alert(
        'Đã cập nhật số dư',
        `Ví "${selectedWalletForEdit.name}" hiện có số dư là ${formatCurrency(finalBalance)}.`
      );
      setEditBalanceModalVisible(false);
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật số dư ví lúc này.');
    } finally {
      setEditBalanceLoading(false);
    }
  };

  const handleExecuteTransfer = async () => {
    const amount = Number(transferAmount.replace(/[^0-9]/g, ''));
    const fee = Number(transferFee.replace(/[^0-9]/g, '')) || 0;

    if (!amount || amount <= 0) {
      Alert.alert('Số tiền chưa hợp lệ', 'Vui lòng nhập số tiền cần chuyển.');
      return;
    }
    if (fromWalletId === toWalletId) {
      Alert.alert('Ví nguồn và đích trùng nhau', 'Vui lòng chọn 2 ví khác nhau để điều chuyển.');
      return;
    }

    const fromWallet = wallets.find((w) => w.id === fromWalletId);
    if (fromWallet && fromWallet.type !== 'CREDIT' && fromWallet.balance < amount + fee) {
      Alert.alert('Số dư không đủ', `Ví "${fromWallet.name}" chỉ còn ${formatCurrency(fromWallet.balance)}.`);
      return;
    }

    setTransferLoading(true);
    try {
      await dispatch(
        executeTransferAsync({
          fromWalletId,
          toWalletId,
          amount,
          fee,
          note: transferNote.trim() || undefined,
        })
      ).unwrap();

      Alert.alert('Chuyển ví thành công', `Đã chuyển ${formatCurrency(amount)} giữa hai tài khoản an toàn.`);
      setTransferModalVisible(false);
      setTransferAmount('');
      setTransferNote('');
    } catch {
      Alert.alert('Lỗi', 'Không thể hoàn tất giao dịch chuyển ví.');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên ví.');
      return;
    }
    const balance = Number(newWalletBalance.replace(/[^0-9]/g, '')) || 0;

    const iconMap: Record<WalletType, string> = {
      CASH: 'payments',
      BANK: 'account-balance',
      E_WALLET: 'qr-code-scanner',
      SAVINGS: 'savings',
      CREDIT: 'credit-card',
    };

    const colorMap: Record<WalletType, { color: string; bg: string }> = {
      CASH: { color: Colors.warning, bg: Colors.warningLight },
      BANK: { color: Colors.primary, bg: Colors.primaryLight },
      E_WALLET: { color: '#A50064', bg: '#FCE7F3' },
      SAVINGS: { color: Colors.info, bg: Colors.infoLight },
      CREDIT: { color: Colors.expense, bg: Colors.expenseLight },
    };

    const config = colorMap[newWalletType];

    await dispatch(
      addWalletAsync({
        name: newWalletName.trim(),
        type: newWalletType,
        balance: newWalletType === 'CREDIT' ? -balance : balance,
        currency: 'VND',
        icon: iconMap[newWalletType],
        color: config.color,
        backgroundColor: config.bg,
        accountNumber: newWalletAccountNo.trim() || undefined,
      })
    );

    Alert.alert('Thêm ví thành công', `Đã thêm ví "${newWalletName.trim()}" vào hệ thống.`);
    setAddWalletModalVisible(false);
    setNewWalletName('');
    setNewWalletBalance('');
    setNewWalletAccountNo('');
  };

  // Preview difference calculation for Edit Modal
  const editCurrentAbsolute = selectedWalletForEdit
    ? Math.abs(selectedWalletForEdit.balance)
    : 0;
  const editTargetAbsolute = Number(editNewBalanceInput.replace(/[^0-9]/g, '')) || 0;
  const editDiff = editTargetAbsolute - editCurrentAbsolute;

  return (
    <ScreenContainer>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Hệ Thống Nguồn Tiền</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddWalletModalVisible(true)}
          activeOpacity={0.75}
        >
          <MaterialIcons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. Tổng tài sản theo nhóm */}
      <AnimatedCard
        delay={50}
        style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>TIỀN MẶT & TÀI KHOẢN</Text>
            <Text style={styles.summaryValuePositive}>{formatCurrency(totalLiquidBalance)}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>DƯ NỢ THẺ TÍN DỤNG</Text>
            <Text style={styles.summaryValueNegative}>-{formatCurrency(creditDebtTotal)}</Text>
          </View>
        </View>

        {/* Transfer Button */}
        <TouchableOpacity
          style={styles.transferButton}
          onPress={() => setTransferModalVisible(true)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="sync-alt" size={20} color={Colors.textWhite} />
          <Text style={styles.transferButtonText}>Chuyển tiền giữa các ví (Nội bộ)</Text>
        </TouchableOpacity>
      </AnimatedCard>

      {/* 3. Danh sách các ví chi tiết */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="account-balance-wallet" size={20} color={Colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Danh Sách Các Nguồn Tiền ({wallets.length})
          </Text>
        </View>
        <Text style={[styles.sectionSubHint, { color: theme.textMuted }]}>
          Chạm thẻ hoặc icon ✏️ để chỉnh sửa số dư
        </Text>
      </View>

      <View style={styles.walletsList}>
        {wallets.map((wallet) => {
          const isCredit = wallet.type === 'CREDIT';
          const isNegative = wallet.balance < 0;

          return (
            <AnimatedCard
              key={wallet.id}
              delay={100}
              style={[
                styles.walletItemCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TouchableOpacity
                style={styles.walletTouchableArea}
                onPress={() => handleOpenEditBalance(wallet)}
                activeOpacity={0.72}
              >
                <View style={styles.walletItemLeft}>
                  <View style={[styles.walletItemIcon, { backgroundColor: wallet.backgroundColor }]}>
                    <MaterialIcons name={wallet.icon as any} size={24} color={wallet.color} />
                  </View>
                  <View style={styles.walletItemInfo}>
                    <Text style={[styles.walletItemName, { color: theme.textPrimary }]}>
                      {wallet.name}
                    </Text>
                    <Text style={[styles.walletItemType, { color: theme.textMuted }]}>
                      {wallet.accountNumber ? `${wallet.accountNumber} • ` : ''}
                      {wallet.type === 'BANK'
                        ? 'Tài khoản Ngân hàng'
                        : wallet.type === 'CASH'
                        ? 'Tiền mặt tại ví'
                        : wallet.type === 'E_WALLET'
                        ? 'Ví điện tử'
                        : wallet.type === 'SAVINGS'
                        ? 'Sổ tích lũy / Quỹ dự phòng'
                        : 'Thẻ tín dụng (Hạn mức)'}
                    </Text>
                  </View>
                </View>

                <View style={styles.walletItemRight}>
                  <View style={styles.balanceWithActionRow}>
                    <Text
                      style={[
                        styles.walletItemBalance,
                        isNegative ? { color: Colors.expense } : { color: theme.textPrimary },
                      ]}
                    >
                      {formatCurrency(wallet.balance)}
                    </Text>
                    <View
                      style={[
                        styles.editPencilBadge,
                        { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' },
                      ]}
                    >
                      <MaterialIcons name="edit" size={14} color={Colors.primary} />
                    </View>
                  </View>
                  {isCredit && wallet.creditLimit ? (
                    <Text style={[styles.creditLimitText, { color: theme.textMuted }]}>
                      Hạn mức: {formatCurrency(wallet.creditLimit)}
                    </Text>
                  ) : (
                    <Text style={styles.tapToEditHint}>Chạm để chỉnh số dư</Text>
                  )}
                </View>
              </TouchableOpacity>
            </AnimatedCard>
          );
        })}
      </View>

      {/* MODAL: ĐIỀU CHỈNH SỐ DƯ NGUỒN TIỀN TRỰC TIẾP */}
      <Modal visible={editBalanceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderTitleBox}>
                <View style={styles.editModalHeaderIconBg}>
                  <MaterialIcons name="tune" size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    Điều Chỉnh Số Dư Nguồn Tiền
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                    {selectedWalletForEdit?.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setEditBalanceModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Thẻ thông tin ví hiện tại */}
              {selectedWalletForEdit && (
                <View
                  style={[
                    styles.currentWalletBadgeCard,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <View
                    style={[
                      styles.walletItemIcon,
                      { backgroundColor: selectedWalletForEdit.backgroundColor, width: 42, height: 42 },
                    ]}
                  >
                    <MaterialIcons
                      name={selectedWalletForEdit.icon as any}
                      size={20}
                      color={selectedWalletForEdit.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.badgeWalletName, { color: theme.textPrimary }]}>
                      {selectedWalletForEdit.name}
                    </Text>
                    <Text style={[styles.badgeWalletSubtitle, { color: theme.textMuted }]}>
                      {selectedWalletForEdit.type === 'CREDIT' ? 'Dư nợ hiện tại' : 'Số dư hiện tại'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.badgeWalletBalance,
                      selectedWalletForEdit.balance < 0
                        ? { color: Colors.expense }
                        : { color: Colors.income },
                    ]}
                  >
                    {formatCurrency(selectedWalletForEdit.balance)}
                  </Text>
                </View>
              )}

              {/* Ô Nhập Số Dư Mới */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                {selectedWalletForEdit?.type === 'CREDIT'
                  ? 'Dư nợ thẻ mới (VNĐ)'
                  : 'Số dư thực tế mới (VNĐ)'}
              </Text>
              <View
                style={[
                  styles.balanceInputContainer,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <TextInput
                  style={[styles.balanceNumberInput, { color: theme.textPrimary }]}
                  value={editNewBalanceInput}
                  onChangeText={(val) => setEditNewBalanceInput(val.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={theme.textMuted}
                  autoFocus
                />
                <Text style={styles.currencyBadge}>đ</Text>
                {editNewBalanceInput.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setEditNewBalanceInput('')}
                    style={styles.clearInputBtn}
                  >
                    <MaterialIcons name="cancel" size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Live Preview định dạng số tiền */}
              <Text style={[styles.formattedNumberHint, { color: Colors.primary }]}>
                ≈ {formatCurrency(editTargetAbsolute)}
              </Text>

              {/* Phím tắt cộng trừ nhanh */}
              <Text style={[styles.inputSubLabel, { color: theme.textMuted }]}>
                Phím tắt điều chỉnh nhanh:
              </Text>
              <View style={styles.quickChipsRow}>
                <TouchableOpacity
                  style={[styles.quickChip, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                  onPress={() => handleQuickDelta(500000)}
                >
                  <Text style={[styles.quickChipText, { color: Colors.income }]}>+500K</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickChip, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                  onPress={() => handleQuickDelta(1000000)}
                >
                  <Text style={[styles.quickChipText, { color: Colors.income }]}>+1 Tr</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickChip, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                  onPress={() => handleQuickDelta(5000000)}
                >
                  <Text style={[styles.quickChipText, { color: Colors.income }]}>+5 Tr</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickChip, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                  onPress={() => handleQuickDelta(10000000)}
                >
                  <Text style={[styles.quickChipText, { color: Colors.income }]}>+10 Tr</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickChip, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                  onPress={() => handleQuickDelta(-500000)}
                >
                  <Text style={[styles.quickChipText, { color: Colors.expense }]}>-500K</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickChip, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
                  onPress={() => setEditNewBalanceInput('0')}
                >
                  <Text style={[styles.quickChipText, { color: theme.textSecondary }]}>Về 0 đ</Text>
                </TouchableOpacity>
              </View>

              {/* Chênh Lệch Preview */}
              <View
                style={[
                  styles.diffCard,
                  editDiff > 0
                    ? { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5', borderColor: '#10B981' }
                    : editDiff < 0
                    ? { backgroundColor: isDarkMode ? '#7F1D1D' : '#FEF2F2', borderColor: '#EF4444' }
                    : { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <MaterialIcons
                  name={editDiff > 0 ? 'arrow-upward' : editDiff < 0 ? 'arrow-downward' : 'check'}
                  size={18}
                  color={editDiff > 0 ? '#10B981' : editDiff < 0 ? '#EF4444' : theme.textMuted}
                />
                <Text
                  style={[
                    styles.diffText,
                    editDiff > 0
                      ? { color: isDarkMode ? '#A7F3D0' : '#047857' }
                      : editDiff < 0
                      ? { color: isDarkMode ? '#FECACA' : '#B91C1C' }
                      : { color: theme.textMuted },
                  ]}
                >
                  {editDiff > 0
                    ? `Chênh lệch: +${formatCurrency(editDiff)} (Tăng số dư)`
                    : editDiff < 0
                    ? `Chênh lệch: -${formatCurrency(Math.abs(editDiff))} (Giảm số dư)`
                    : 'Số dư không đổi so với hiện tại'}
                </Text>
              </View>

              {/* Ghi chú điều chỉnh */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Lý do / Ghi chú điều chỉnh
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, color: theme.textPrimary },
                ]}
                value={editBalanceNote}
                onChangeText={setEditBalanceNote}
                placeholder="Ví dụ: Kiểm kê khớp thực tế cuối tuần"
                placeholderTextColor={theme.textMuted}
              />

              {/* Checkbox tạo giao dịch bù trừ */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRecordAdjustmentTx(!recordAdjustmentTx)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    recordAdjustmentTx && styles.checkboxBoxActive,
                    { borderColor: recordAdjustmentTx ? Colors.primary : theme.border },
                  ]}
                >
                  {recordAdjustmentTx && (
                    <MaterialIcons name="check" size={16} color={Colors.textWhite} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkboxLabel, { color: theme.textPrimary }]}>
                    Ghi nhận giao dịch bù trừ vào Lịch Sử
                  </Text>
                  <Text style={[styles.checkboxSubtext, { color: theme.textMuted }]}>
                    Tự động tạo giao dịch Thu/Chi bù trừ để đảm bảo báo cáo thu chi khớp chính xác.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.border }]}
                  onPress={() => setEditBalanceModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBalanceBtn, editBalanceLoading && { opacity: 0.8 }]}
                  onPress={handleSaveEditBalance}
                  disabled={editBalanceLoading}
                >
                  {editBalanceLoading ? (
                    <ActivityIndicator size="small" color={Colors.textWhite} />
                  ) : (
                    <>
                      <MaterialIcons name="check-circle" size={18} color={Colors.textWhite} />
                      <Text style={styles.saveBalanceBtnText}>Lưu Số Dư Mới</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 1: CHUYỂN TIỀN NỘI BỘ GIỮA CÁC VÍ */}
      <Modal visible={transferModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderTitleBox}>
                <MaterialIcons name="sync-alt" size={22} color={Colors.primary} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Chuyển Tiền Giữa Các Ví
                </Text>
              </View>
              <TouchableOpacity onPress={() => setTransferModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Ví Nguồn */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Từ ví nguồn (Trừ tiền)
              </Text>
              <View style={styles.walletsSelectRow}>
                {wallets.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.walletSelectPill,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      fromWalletId === w.id && styles.walletSelectPillActive,
                    ]}
                    onPress={() => setFromWalletId(w.id)}
                  >
                    <Text
                      style={[
                        styles.walletSelectText,
                        { color: theme.textSecondary },
                        fromWalletId === w.id && styles.walletSelectTextActive,
                      ]}
                    >
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Ví Đích */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Đến ví nhận (Cộng tiền)
              </Text>
              <View style={styles.walletsSelectRow}>
                {wallets.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.walletSelectPill,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      toWalletId === w.id && styles.walletSelectPillActiveTarget,
                    ]}
                    onPress={() => setToWalletId(w.id)}
                  >
                    <Text
                      style={[
                        styles.walletSelectText,
                        { color: theme.textSecondary },
                        toWalletId === w.id && styles.walletSelectTextActive,
                      ]}
                    >
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Số tiền */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Số tiền chuyển (VNĐ)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, color: theme.textPrimary },
                ]}
                value={transferAmount}
                onChangeText={setTransferAmount}
                placeholder="Ví dụ: 1.000.000"
                keyboardType="numeric"
                placeholderTextColor={theme.textMuted}
              />

              {/* Phí chuyển */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Phí giao dịch (nếu có)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, color: theme.textPrimary },
                ]}
                value={transferFee}
                onChangeText={setTransferFee}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={theme.textMuted}
              />

              {/* Ghi chú */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Ghi chú chuyển khoản
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, color: theme.textPrimary },
                ]}
                value={transferNote}
                onChangeText={setTransferNote}
                placeholder="Ví dụ: Rút ATM về ví tiêu dùng"
                placeholderTextColor={theme.textMuted}
              />

              <TouchableOpacity
                style={styles.confirmTransferBtn}
                onPress={handleExecuteTransfer}
                disabled={transferLoading}
              >
                <Text style={styles.confirmTransferBtnText}>
                  {transferLoading ? 'Đang chuyển ví...' : 'Xác Nhận Chuyển Tiền'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: TẠO VÍ ẢO MỚI */}
      <Modal visible={addWalletModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderTitleBox}>
                <MaterialIcons name="account-balance-wallet" size={22} color={Colors.primary} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Thêm Nguồn Tiền Mới
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAddWalletModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Tên ví / Tài khoản
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, color: theme.textPrimary },
                ]}
                value={newWalletName}
                onChangeText={setNewWalletName}
                placeholder="Ví dụ: Techcombank Priority, Ví Tiết Kiệm Vàng"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Loại nguồn tiền
              </Text>
              <View style={styles.typeSelectorRow}>
                {(['BANK', 'CASH', 'E_WALLET', 'SAVINGS', 'CREDIT'] as WalletType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeSelectorPill,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      newWalletType === type && styles.typeSelectorPillActive,
                    ]}
                    onPress={() => setNewWalletType(type)}
                  >
                    <Text
                      style={[
                        styles.typeSelectorText,
                        { color: theme.textSecondary },
                        newWalletType === type && styles.typeSelectorTextActive,
                      ]}
                    >
                      {type === 'BANK'
                        ? 'Ngân Hàng'
                        : type === 'CASH'
                        ? 'Tiền Mặt'
                        : type === 'E_WALLET'
                        ? 'Ví MoMo/Zalo'
                        : type === 'SAVINGS'
                        ? 'Sổ Tiết Kiệm'
                        : 'Thẻ Tín Dụng'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Số dư ban đầu (VNĐ)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, color: theme.textPrimary },
                ]}
                value={newWalletBalance}
                onChangeText={setNewWalletBalance}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Số tài khoản / Ghi chú thẻ (Tùy chọn)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, color: theme.textPrimary },
                ]}
                value={newWalletAccountNo}
                onChangeText={setNewWalletAccountNo}
                placeholder="•••• 1234"
                placeholderTextColor={theme.textMuted}
              />

              <TouchableOpacity style={styles.confirmTransferBtn} onPress={handleCreateWallet}>
                <Text style={styles.confirmTransferBtnText}>Tạo Ví Ảo</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  summaryCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    marginHorizontal: Spacing.md,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  summaryValuePositive: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.income,
  },
  summaryValueNegative: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.expense,
  },
  transferButton: {
    height: 48,
    backgroundColor: Colors.navyDeep,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  transferButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textWhite,
  },

  sectionHeaderRow: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubHint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  walletsList: {
    gap: Spacing.md,
  },
  walletItemCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadows.card,
    overflow: 'hidden',
  },
  walletTouchableArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  walletItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  walletItemIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletItemInfo: {
    flex: 1,
  },
  walletItemName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  walletItemType: {
    fontSize: 12,
  },
  walletItemRight: {
    alignItems: 'flex-end',
  },
  balanceWithActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletItemBalance: {
    fontSize: 16,
    fontWeight: '900',
  },
  editPencilBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditLimitText: {
    fontSize: 11,
    marginTop: 2,
  },
  tapToEditHint: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 3,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editModalHeaderIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
  },

  currentWalletBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  badgeWalletName: {
    fontSize: 14,
    fontWeight: '800',
  },
  badgeWalletSubtitle: {
    fontSize: 11,
  },
  badgeWalletBalance: {
    fontSize: 15,
    fontWeight: '900',
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  inputSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: 6,
  },

  balanceInputContainer: {
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  balanceNumberInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    padding: 0,
  },
  currencyBadge: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginLeft: 6,
    marginRight: 6,
  },
  clearInputBtn: {
    padding: 4,
  },
  formattedNumberHint: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    paddingHorizontal: 4,
  },

  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '800',
  },

  diffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  textInput: {
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: Spacing.lg,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxBoxActive: {
    backgroundColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxSubtext: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },

  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBalanceBtn: {
    flex: 2,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveBalanceBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textWhite,
  },

  walletsSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  walletSelectPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  walletSelectPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  walletSelectPillActiveTarget: {
    backgroundColor: Colors.infoLight,
    borderColor: Colors.info,
  },
  walletSelectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  walletSelectTextActive: {
    fontWeight: '800',
    color: Colors.primary,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  typeSelectorPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  typeSelectorPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeSelectorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeSelectorTextActive: {
    fontWeight: '800',
    color: Colors.primary,
  },
  confirmTransferBtn: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  confirmTransferBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textWhite,
  },
});
