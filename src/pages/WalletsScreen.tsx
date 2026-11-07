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
  loadWalletsAndJars,
  executeTransferAsync,
  addWalletAsync,
} from '../redux/slices/walletSlice';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { WalletType } from '../types';

interface WalletsScreenProps {
  navigation: any;
  route?: any;
}

export const WalletsScreen: React.FC<WalletsScreenProps> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { wallets } = useAppSelector((state) => state.wallet);

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

  useEffect(() => {
    dispatch(loadWalletsAndJars());
  }, [dispatch, route?.params?.openTransferModal]);

  const totalLiquidBalance = wallets
    .filter((w) => w.type !== 'CREDIT' && !w.isExcludedFromTotal)
    .reduce((sum, w) => sum + w.balance, 0);

  const creditDebtTotal = wallets
    .filter((w) => w.type === 'CREDIT')
    .reduce((sum, w) => sum + Math.abs(w.balance), 0);

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

  return (
    <ScreenContainer>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hệ Thống Ví Ảo</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddWalletModalVisible(true)}
          activeOpacity={0.75}
        >
          <MaterialIcons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. Tổng tài sản theo nhóm */}
      <AnimatedCard delay={50} style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TIỀN MẶT & TÀI KHOẢN</Text>
            <Text style={styles.summaryValuePositive}>{formatCurrency(totalLiquidBalance)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>DƯ NỢ THẺ TÍN DỤNG</Text>
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
          <Text style={styles.transferButtonText}>Chuyển tiền giữa các ví ảo (Nội bộ)</Text>
        </TouchableOpacity>
      </AnimatedCard>

      {/* 3. Danh sách các ví chi tiết */}
      <View style={styles.sectionTitleRow}>
        <MaterialIcons name="wallet" size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Danh Sách Các Nguồn Tiền ({wallets.length})</Text>
      </View>

      <View style={styles.walletsList}>
        {wallets.map((wallet) => {
          const isCredit = wallet.type === 'CREDIT';
          const isNegative = wallet.balance < 0;

          return (
            <AnimatedCard key={wallet.id} delay={100} style={styles.walletItemCard}>
              <View style={styles.walletItemLeft}>
                <View style={[styles.walletItemIcon, { backgroundColor: wallet.backgroundColor }]}>
                  <MaterialIcons name={wallet.icon as any} size={24} color={wallet.color} />
                </View>
                <View style={styles.walletItemInfo}>
                  <Text style={styles.walletItemName}>{wallet.name}</Text>
                  <Text style={styles.walletItemType}>
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
                <Text
                  style={[
                    styles.walletItemBalance,
                    isNegative ? { color: Colors.expense } : { color: Colors.textPrimary },
                  ]}
                >
                  {formatCurrency(wallet.balance)}
                </Text>
                {isCredit && wallet.creditLimit ? (
                  <Text style={styles.creditLimitText}>
                    Hạn mức: {formatCurrency(wallet.creditLimit)}
                  </Text>
                ) : null}
              </View>
            </AnimatedCard>
          );
        })}
      </View>

      {/* MODAL 1: CHUYỂN TIỀN NỘI BỘ GIỮA CÁC VÍ */}
      <Modal visible={transferModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBox}>
                <MaterialIcons name="sync-alt" size={22} color={Colors.primary} />
                <Text style={styles.modalTitle}>Chuyển Tiền Giữa Các Ví</Text>
              </View>
              <TouchableOpacity onPress={() => setTransferModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Ví Nguồn */}
              <Text style={styles.inputLabel}>Từ ví nguồn (Trừ tiền)</Text>
              <View style={styles.walletsSelectRow}>
                {wallets.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.walletSelectPill,
                      fromWalletId === w.id && styles.walletSelectPillActive,
                    ]}
                    onPress={() => setFromWalletId(w.id)}
                  >
                    <Text
                      style={[
                        styles.walletSelectText,
                        fromWalletId === w.id && styles.walletSelectTextActive,
                      ]}
                    >
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Ví Đích */}
              <Text style={styles.inputLabel}>Đến ví nhận (Cộng tiền)</Text>
              <View style={styles.walletsSelectRow}>
                {wallets.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.walletSelectPill,
                      toWalletId === w.id && styles.walletSelectPillActiveTarget,
                    ]}
                    onPress={() => setToWalletId(w.id)}
                  >
                    <Text
                      style={[
                        styles.walletSelectText,
                        toWalletId === w.id && styles.walletSelectTextActive,
                      ]}
                    >
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Số tiền */}
              <Text style={styles.inputLabel}>Số tiền chuyển (VNĐ)</Text>
              <TextInput
                style={styles.textInput}
                value={transferAmount}
                onChangeText={setTransferAmount}
                placeholder="Ví dụ: 1.000.000"
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />

              {/* Phí chuyển */}
              <Text style={styles.inputLabel}>Phí giao dịch (nếu có)</Text>
              <TextInput
                style={styles.textInput}
                value={transferFee}
                onChangeText={setTransferFee}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />

              {/* Ghi chú */}
              <Text style={styles.inputLabel}>Ghi chú chuyển khoản</Text>
              <TextInput
                style={styles.textInput}
                value={transferNote}
                onChangeText={setTransferNote}
                placeholder="Ví dụ: Rút ATM về ví tiêu dùng"
                placeholderTextColor={Colors.textMuted}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBox}>
                <MaterialIcons name="account-balance-wallet" size={22} color={Colors.primary} />
                <Text style={styles.modalTitle}>Thêm Nguồn Tiền Mới</Text>
              </View>
              <TouchableOpacity onPress={() => setAddWalletModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Tên ví / Tài khoản</Text>
              <TextInput
                style={styles.textInput}
                value={newWalletName}
                onChangeText={setNewWalletName}
                placeholder="Ví dụ: Techcombank Priority, Ví Tiết Kiệm Vàng"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Loại nguồn tiền</Text>
              <View style={styles.typeSelectorRow}>
                {(['BANK', 'CASH', 'E_WALLET', 'SAVINGS', 'CREDIT'] as WalletType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeSelectorPill,
                      newWalletType === type && styles.typeSelectorPillActive,
                    ]}
                    onPress={() => setNewWalletType(type)}
                  >
                    <Text
                      style={[
                        styles.typeSelectorText,
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

              <Text style={styles.inputLabel}>Số dư ban đầu (VNĐ)</Text>
              <TextInput
                style={styles.textInput}
                value={newWalletBalance}
                onChangeText={setNewWalletBalance}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Số tài khoản / Ghi chú thẻ (Tùy chọn)</Text>
              <TextInput
                style={styles.textInput}
                value={newWalletAccountNo}
                onChangeText={setNewWalletAccountNo}
                placeholder="•••• 1234"
                placeholderTextColor={Colors.textMuted}
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

  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
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

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  walletsList: {
    gap: Spacing.md,
  },
  walletItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
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
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  walletItemType: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  walletItemRight: {
    alignItems: 'flex-end',
  },
  walletItemBalance: {
    fontSize: 16,
    fontWeight: '900',
  },
  creditLimitText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeSelectorPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
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
