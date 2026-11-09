import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, DarkColors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatCurrency, getJarName, getJarShortName } from '../utils/formatters';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { toggleBalanceVisibility, loadTransactions } from '../redux/slices/expenseSlice';
import { loadBudgets } from '../redux/slices/budgetSlice';
import { loadWalletsAndJars } from '../redux/slices/walletSlice';
import { loadRecurringAndDebts } from '../redux/slices/recurringSlice';
import { loadSimulationData } from '../redux/slices/simulationSlice';
import { useResponsive } from '../hooks/useResponsive';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { CashflowTrendChart } from '../components/dashboard/CashflowTrendChart';
import { mockUser } from '../data/mockData';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isTablet } = useResponsive();

  const { transactions, isBalanceVisible } = useAppSelector((state) => state.expense);
  const { wallets, jars } = useAppSelector((state) => state.wallet);
  const { health } = useAppSelector((state) => state.simulation);
  const { recurringList, debtsList } = useAppSelector((state) => state.recurring);
  const { currentUser, isDarkMode } = useAppSelector((state) => state.auth);

  const theme = isDarkMode ? DarkColors : Colors;
  const user = currentUser || mockUser;

  useEffect(() => {
    dispatch(loadTransactions());
    dispatch(loadBudgets());
    dispatch(loadWalletsAndJars());
    dispatch(loadRecurringAndDebts());
    dispatch(loadSimulationData());
  }, [dispatch]);

  // Tính tổng tài sản ròng (Net Worth = Tổng tiền mặt + Bank + MoMo + Tiết kiệm - Nợ tín dụng)
  const totalNetWorth = wallets.reduce((sum, w) => {
    if (w.isExcludedFromTotal) return sum;
    return sum + w.balance;
  }, 0);

  const monthlyIncome = user.monthlyIncome || 35000000;
  const monthlyExpense = user.monthlyExpense || 18200000;
  const savingsRate = Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100);

  const pendingDebtsCount = debtsList.filter((d) => d.status === 'PENDING').length;
  const activeRecurringCount = recurringList.filter((r) => r.status === 'ACTIVE').length;

  return (
    <ScreenContainer>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <View style={styles.userTextContainer}>
            <View style={styles.tierBadge}>
              <MaterialIcons name="verified" size={12} color={Colors.primary} />
              <Text style={styles.tierBadgeText}>{user.tier}</Text>
            </View>
            <Text style={[styles.userNameText, { color: theme.textPrimary }]}>Chào bạn, {user.name}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {user.role === 'ADMIN' && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: '#F3E8FF' }]}
              onPress={() => navigation.navigate('Admin')}
              activeOpacity={0.75}
            >
              <MaterialIcons name="admin-panel-settings" size={22} color="#7C3AED" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('AIAssistant')}
            activeOpacity={0.75}
          >
            <MaterialIcons name="smart-toy" size={22} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.75}
          >
            <MaterialIcons name="notifications-none" size={22} color={Colors.textPrimary} />
            <View style={styles.unreadDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. HERO NET WORTH CARD (Bento Master Card) */}
      <AnimatedCard delay={50} style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTitleRow}>
            <MaterialIcons name="shield" size={16} color={Colors.incomeLight} />
            <Text style={styles.heroLabel}>TỔNG TÀI SẢN KHẢ DỤNG</Text>
          </View>
          <TouchableOpacity
            onPress={() => dispatch(toggleBalanceVisibility())}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons
              name={isBalanceVisible ? 'visibility' : 'visibility-off'}
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroBalance}>
          {isBalanceVisible ? formatCurrency(totalNetWorth) : '••••••••••'}
        </Text>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroBadge}>
            <MaterialIcons name="account-balance-wallet" size={14} color={Colors.income} />
            <Text style={styles.heroBadgeText}>{wallets.length} Ví ảo đang hoạt động</Text>
          </View>
          <Text style={styles.heroSubtitle}>Cập nhật theo thời gian thực</Text>
        </View>

        {/* Quick Action Pills inside Hero */}
        <View style={styles.heroActionsRow}>
          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={() => navigation.navigate('Wallets', { openTransferModal: true })}
            activeOpacity={0.8}
          >
            <MaterialIcons name="sync-alt" size={18} color={Colors.textWhite} />
            <Text style={styles.heroActionText}>Chuyển ví</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={() => navigation.navigate('WhatIfSimulator')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="auto-fix-high" size={18} color={Colors.textWhite} />
            <Text style={styles.heroActionText}>Cỗ máy What-If</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={() => navigation.navigate('Recurring')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="event-repeat" size={18} color={Colors.textWhite} />
            <Text style={styles.heroActionText}>Định kỳ & Nợ</Text>
          </TouchableOpacity>
        </View>
      </AnimatedCard>

      {/* 3. VIRTUAL WALLETS HORIZONTAL SLIDER */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWithIcon}>
          <MaterialIcons name="account-balance" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Hệ Thống Ví Ảo Đa Tầng</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Wallets')} activeOpacity={0.7}>
          <Text style={styles.sectionSeeAll}>Quản lý ({wallets.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.walletsScrollContent}
      >
        {wallets.map((wallet) => (
          <TouchableOpacity
            key={wallet.id}
            style={[styles.walletCard, { borderColor: wallet.color + '40' }]}
            onPress={() => navigation.navigate('Wallets')}
            activeOpacity={0.85}
          >
            <View style={styles.walletCardHeader}>
              <View style={[styles.walletIconBox, { backgroundColor: wallet.backgroundColor }]}>
                <MaterialIcons name={wallet.icon as any} size={20} color={wallet.color} />
              </View>
              <Text style={styles.walletAccountNo}>{wallet.accountNumber || 'Ví chính'}</Text>
            </View>

            <Text style={styles.walletName} numberOfLines={1}>
              {wallet.name}
            </Text>

            <Text
              style={[
                styles.walletBalance,
                wallet.balance < 0 ? { color: Colors.expense } : { color: Colors.textPrimary },
              ]}
            >
              {isBalanceVisible ? formatCurrency(wallet.balance) : '••••••'}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Add Wallet Card */}
        <TouchableOpacity
          style={styles.addWalletCard}
          onPress={() => navigation.navigate('Wallets')}
          activeOpacity={0.75}
        >
          <View style={styles.addWalletIconBox}>
            <MaterialIcons name="add" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.addWalletText}>Thêm ví mới</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 4. BENTO GRID 2 COLUMNS (Health Score & Monthly Cashflow) */}
      <View style={[styles.bentoRow, isTablet && { flexWrap: 'nowrap' }]}>
        {/* Left Bento: Financial Health Score */}
        <AnimatedCard delay={100} style={[styles.bentoCard, { flex: 1 }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('WhatIfSimulator')}
            activeOpacity={0.85}
          >
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoSubtitle}>SỨC KHỎE TÀI CHÍNH</Text>
              <MaterialIcons name="bolt" size={18} color={Colors.warning} />
            </View>
            <View style={styles.healthGaugeRow}>
              <Text style={styles.healthScoreBig}>{health.score}</Text>
              <Text style={styles.healthScoreMax}>/1000</Text>
            </View>
            <View style={styles.healthTag}>
              <MaterialIcons name="verified" size={13} color={Colors.primary} />
              <Text style={styles.healthTagText}>{health.tier}</Text>
            </View>
            <Text style={styles.healthTipText} numberOfLines={2}>
              Quỹ khẩn cấp đảm bảo {health.emergencyFundMonths} tháng chi tiêu an toàn.
            </Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* Right Bento: Monthly Cashflow */}
        <AnimatedCard delay={150} style={[styles.bentoCard, { flex: 1 }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Statistics')}
            activeOpacity={0.85}
          >
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoSubtitle}>DÒNG TIỀN THÁNG NÀY</Text>
              <MaterialIcons name="trending-up" size={18} color={Colors.income} />
            </View>
            <View style={styles.cashflowRow}>
              <Text style={styles.cashflowValue}>+{savingsRate}%</Text>
              <Text style={styles.cashflowLabel}>Tỷ lệ tích lũy</Text>
            </View>
            <View style={styles.incomeExpenseBars}>
              <View style={styles.incomePill}>
                <Text style={styles.incomePillText}>Thu: 35.0 tr</Text>
              </View>
              <View style={styles.expensePill}>
                <Text style={styles.expensePillText}>Chi: 18.2 tr</Text>
              </View>
            </View>
            <Text style={styles.healthTipText} numberOfLines={2}>
              Thặng dư dòng tiền: +{(monthlyIncome - monthlyExpense).toLocaleString('vi-VN')} đ
            </Text>
          </TouchableOpacity>
        </AnimatedCard>
      </View>

      {/* 5. INTERACTIVE CASHFLOW TREND VISUALIZER (Bento Dynamic Bar Chart) */}
      <AnimatedCard delay={180}>
        <CashflowTrendChart
          transactions={transactions}
          onNavigateDetail={() => navigation.navigate('Statistics')}
        />
      </AnimatedCard>

      {/* 6. AI FINANCIAL INSIGHT BANNER */}
      <AnimatedCard delay={190} style={styles.aiInsightCard}>
        <View style={styles.aiInsightHeader}>
          <View style={styles.aiInsightBadge}>
            <MaterialIcons name="smart-toy" size={14} color={Colors.primary} />
            <Text style={styles.aiInsightBadgeText}>AI CỐ VẤN TÀI CHÍNH</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('AIAssistant')}
            style={styles.aiActionBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.aiActionBtnText}>Hỏi AI ngay</Text>
            <MaterialIcons name="arrow-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.aiInsightText}>
          {savingsRate >= 30
            ? '🔥 Bạn đang tiết kiệm xuất sắc (' + savingsRate + '% thu nhập). Hũ Tự Do Tài Chính (FFA) đã sẵn sàng để đầu tư sinh lời thêm!'
            : '💡 Dòng tiền tuần này tương đối ổn định. Chú ý giữ Hũ Nhu Cầu Thiết Yếu (NEC) dưới 55% để không ảnh hưởng quỹ tiết kiệm dài hạn.'}
        </Text>
      </AnimatedCard>

      {/* 7. 6 CHIẾC LỌ TÀI CHÍNH (QUY TẮC PHÂN BỔ T. HARV EKER) */}
      <AnimatedCard delay={200} style={styles.jarsCard}>
        <View style={styles.sectionHeaderRowInside}>
          <View style={styles.sectionTitleWithIcon}>
            <MaterialIcons name="savings" size={20} color={Colors.primary} />
            <Text style={styles.cardHeaderTitle}>6 Hũ Quản Lý Chi Tiêu (Quy Tắc 6 Chiếc Lọ)</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Budget')} activeOpacity={0.7}>
            <Text style={styles.sectionSeeAll}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.jarsDescription}>
          Phương pháp phân bổ thu nhập thông minh theo chuẩn T. Harv Eker giúp kiểm soát dòng tiền bền vững.
        </Text>

        <View style={styles.jarsGrid}>
          {jars.map((jar) => {
            const spentPercent = Math.min(100, Math.round((jar.spentAmount / jar.allocatedAmount) * 100));
            const isWarning = spentPercent >= 80;
            const jarVietnameseTitle = getJarName(jar.code);
            const remainingAmount = Math.max(0, jar.allocatedAmount - jar.spentAmount);

            return (
              <View key={jar.id} style={styles.jarItem}>
                <View style={styles.jarItemHeader}>
                  <View style={styles.jarBadgeWithIcon}>
                    <View style={[styles.jarMiniDot, { backgroundColor: jar.color }]} />
                    <Text style={styles.jarNameText}>{jarVietnameseTitle}</Text>
                    <View style={styles.jarPercentBadge}>
                      <Text style={styles.jarPercentText}>{jar.percentage}%</Text>
                    </View>
                  </View>

                  {isWarning ? (
                    <View style={styles.warningPill}>
                      <MaterialIcons name="warning" size={12} color={Colors.expense} />
                      <Text style={styles.warningPillText}>Đã tiêu {spentPercent}% (Vượt 80%)</Text>
                    </View>
                  ) : (
                    <Text style={styles.jarSpentPercent}>Đã dùng {spentPercent}%</Text>
                  )}
                </View>

                {/* Progress bar */}
                <View style={styles.jarProgressBarTrack}>
                  <View
                    style={[
                      styles.jarProgressBarFill,
                      {
                        width: `${spentPercent}%`,
                        backgroundColor: isWarning ? Colors.expense : jar.color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.jarMoneyRow}>
                  <Text style={styles.jarMoneyLeft}>
                    Đã chi: <Text style={styles.boldText}>{formatCurrency(jar.spentAmount)}</Text> / {formatCurrency(jar.allocatedAmount)}
                  </Text>
                  <Text style={[styles.jarMoneyRight, isWarning ? { color: Colors.expense } : { color: Colors.income }]}>
                    Còn lại: {formatCurrency(remainingAmount)}
                  </Text>
                </View>

                <Text style={styles.jarSubtext}>
                  {jar.description}
                </Text>
              </View>
            );
          })}
        </View>
      </AnimatedCard>

      {/* 6. GIAO DỊCH GẦN ĐÂY */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWithIcon}>
          <MaterialIcons name="receipt-long" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Giao Dịch Gần Đây</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Transactions')}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionSeeAll}>Tất cả ({transactions.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsContainer}>
        {transactions.slice(0, 5).map((tx) => {
          const isIncome = tx.type === 'INCOME';
          const isTransfer = tx.type === 'TRANSFER';

          return (
            <TouchableOpacity
              key={tx.id}
              style={styles.txRow}
              onPress={() => navigation.navigate('TransactionDetail', { transactionId: tx.id })}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.txIconBox,
                  { backgroundColor: tx.category?.backgroundColor || Colors.surfaceSubtle },
                ]}
              >
                <MaterialIcons
                  name={(tx.category?.icon as any) || 'receipt'}
                  size={22}
                  color={tx.category?.color || Colors.primary}
                />
              </View>

              <View style={styles.txInfo}>
                <Text style={styles.txTitle} numberOfLines={1}>
                  {tx.title}
                </Text>
                <View style={styles.txMetaRow}>
                  <Text style={styles.txTime}>{tx.formattedTime || tx.date}</Text>
                  {tx.paymentMethod ? (
                    <Text style={styles.txWalletTag}>• {tx.paymentMethod}</Text>
                  ) : null}
                  {tx.jarCode ? (
                    <Text style={styles.txJarTag}>• Hũ {getJarShortName(tx.jarCode)}</Text>
                  ) : null}
                </View>
              </View>

              <Text
                style={[
                  styles.txAmount,
                  isIncome
                    ? { color: Colors.income }
                    : isTransfer
                    ? { color: Colors.info }
                    : { color: Colors.textPrimary },
                ]}
              >
                {isIncome ? '+' : isTransfer ? '' : '-'}
                {formatCurrency(tx.amount)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Spacing for bottom tab bar */}
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.borderEmerald,
  },
  userTextContainer: {
    gap: 2,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.expense,
  },

  // HERO CARD
  heroCard: {
    backgroundColor: Colors.navyDeep,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.hero,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  heroBalance: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.textWhite,
    letterSpacing: -0.5,
    marginVertical: Spacing.xs,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.income,
  },
  heroSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: Spacing.md,
  },
  heroActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    backgroundColor: '#1E293B',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textWhite,
  },

  // SECTION HEADERS
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionHeaderRowInside: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSeeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // WALLETS SCROLL
  walletsScrollContent: {
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  walletCard: {
    width: 170,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    ...Shadows.card,
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  walletIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletAccountNo: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  walletName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: '900',
  },
  addWalletCard: {
    width: 130,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addWalletIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addWalletText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  // BENTO GRID
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bentoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  bentoSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  healthGaugeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginVertical: 4,
  },
  healthScoreBig: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  healthScoreMax: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  healthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  healthTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  healthTipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  cashflowRow: {
    marginVertical: 4,
  },
  cashflowValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.income,
  },
  cashflowLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  incomeExpenseBars: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: Spacing.xs,
  },
  incomePill: {
    backgroundColor: Colors.incomeLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  incomePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.income,
  },
  expensePill: {
    backgroundColor: Colors.expenseLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  expensePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.expense,
  },

  // JARS ENVELOPES
  jarsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  jarsDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  jarsGrid: {
    gap: Spacing.md,
  },
  jarItem: {
    gap: 4,
  },
  jarItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jarBadgeWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  jarMiniDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  jarNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  jarPercentBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
  },
  jarPercentText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  jarSpentPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.expenseLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  warningPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.expense,
  },
  jarProgressBarTrack: {
    height: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  jarProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  jarMoneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  jarMoneyLeft: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  jarMoneyRight: {
    fontSize: 11,
    fontWeight: '700',
  },
  boldText: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  jarSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },

  // TRANSACTIONS
  transactionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: Spacing.md,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  txTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  txWalletTag: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  txJarTag: {
    fontSize: 11,
    color: Colors.purple,
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  aiInsightCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  aiInsightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  aiInsightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  aiInsightBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  aiActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  aiInsightText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
