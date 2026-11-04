import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { toggleBalanceVisibility, loadTransactions } from '../redux/slices/expenseSlice';
import { loadBudgets } from '../redux/slices/budgetSlice';
import { useResponsive } from '../hooks/useResponsive';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { mockUser } from '../data/mockData';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isTablet, isLandscape } = useResponsive();

  const { transactions, totalBalance, monthlyIncome, monthlyExpense, isBalanceVisible } =
    useAppSelector((state) => state.expense);
  const { budgets } = useAppSelector((state) => state.budget);

  const [activeFilter, setActiveFilter] = useState<'WEEK' | 'MONTH'>('WEEK');

  useEffect(() => {
    dispatch(loadTransactions());
    dispatch(loadBudgets());
  }, [dispatch]);

  const weekData = [
    { day: 'T2', incomeH: 45, expenseH: 30 },
    { day: 'T3', incomeH: 60, expenseH: 35 },
    { day: 'T4', incomeH: 25, expenseH: 50 },
    { day: 'T5', incomeH: 70, expenseH: 55 },
    { day: 'T6', incomeH: 80, expenseH: 42 },
    { day: 'T7', incomeH: 35, expenseH: 65 },
    { day: 'CN', incomeH: 50, expenseH: 60 },
  ];

  return (
    <ScreenContainer>
      {/* 1. Top Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoIcon}>
            <MaterialIcons name="account-balance-wallet" size={22} color={Colors.textWhite} />
          </View>
          <Text style={styles.headerTitle}>ExpenseMate</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialIcons name="notifications-none" size={24} color={Colors.textSecondary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Image source={{ uri: mockUser.avatarUrl }} style={styles.avatarMini} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentPadding}>
        {/* 2. User Greeting Row */}
        <AnimatedCard delay={50} style={styles.userGreetingRow}>
          <View style={styles.userInfo}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: mockUser.avatarUrl }} style={styles.avatarMain} />
              <View style={styles.onlineBadge} />
            </View>
            <View>
              <View style={styles.badgeRow}>
                <Text style={styles.greetingText}>Chào buổi sáng</Text>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierText}>{mockUser.tier}</Text>
                </View>
              </View>
              <Text style={styles.userName}>{mockUser.name}</Text>
            </View>
          </View>

          <View style={styles.quickAccessButtons}>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={() => navigation.navigate('Transactions')}
            >
              <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={() => navigation.navigate('Budget')}
            >
              <MaterialIcons name="pie-chart" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* 3. Gradient Balance Card with Animation */}
        <AnimatedCard delay={100}>
          <LinearGradient
            colors={['#4F46E5', '#3730A3', '#312E81']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceCardHeader}>
              <View style={styles.balanceLabelRow}>
                <Text style={styles.balanceCardLabel}>TỔNG SỐ DƯ KHẢ DỤNG</Text>
                <TouchableOpacity
                  onPress={() => dispatch(toggleBalanceVisibility())}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name={isBalanceVisible ? 'visibility' : 'visibility-off'}
                    size={18}
                    color="#DAD7FF"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.walletBadge}>
                <View style={styles.walletDot} />
                <Text style={styles.walletBadgeText}>Ví SQLite</Text>
              </View>
            </View>

            <View style={styles.balanceAmountRow}>
              <Text style={styles.balanceAmount}>
                {isBalanceVisible ? formatCurrency(totalBalance, false) : '••••••••'}
              </Text>
              <Text style={styles.currencySymbol}>đ</Text>
            </View>

            <View style={styles.balanceCardFooter}>
              <View style={styles.growthBadge}>
                <MaterialIcons name="trending-up" size={16} color="#6CF8BB" />
                <Text style={styles.growthText}>+12.4% so với tháng trước</Text>
              </View>
              <Text style={styles.updateTimeText}>Đã đồng bộ SQLite</Text>
            </View>
          </LinearGradient>
        </AnimatedCard>

        {/* 4. Dual Income / Expense Cards (Adaptive for Tablet/Landscape) */}
        <AnimatedCard delay={150}>
          <View style={[styles.metricRow, (isTablet || isLandscape) && styles.metricRowWide]}>
            <View style={[styles.metricCard, Shadows.card]}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Tổng thu nhập</Text>
                <View style={[styles.metricIconBox, { backgroundColor: '#E6F4EA' }]}>
                  <MaterialIcons name="arrow-downward" size={16} color={Colors.secondary} />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: Colors.secondary }]}>
                +{formatCurrency(monthlyIncome)}
              </Text>
              <View style={styles.subMetricRow}>
                <MaterialIcons name="arrow-upward" size={14} color={Colors.secondary} />
                <Text style={[styles.subMetricText, { color: Colors.secondary }]}>
                  8.2% tuần này
                </Text>
              </View>
            </View>

            <View style={[styles.metricCard, Shadows.card]}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Tổng chi tiêu</Text>
                <View style={[styles.metricIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialIcons name="arrow-upward" size={16} color={Colors.error} />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: Colors.error }]}>
                -{formatCurrency(monthlyExpense)}
              </Text>
              <View style={styles.subMetricRow}>
                <MaterialIcons name="trending-up" size={14} color={Colors.error} />
                <Text style={[styles.subMetricText, { color: Colors.error }]}>65% định mức</Text>
              </View>
            </View>
          </View>
        </AnimatedCard>

        {/* 5. Quick Actions */}
        <AnimatedCard delay={200}>
          <View style={[styles.quickActionsCard, Shadows.card]}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <View style={[styles.actionCircle, { backgroundColor: '#E2DFFF' }]}>
                <MaterialIcons name="send" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Chuyển tiền</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <View style={[styles.actionCircle, { backgroundColor: '#D1FAE5' }]}>
                <MaterialIcons name="add-card" size={22} color={Colors.secondary} />
              </View>
              <Text style={styles.actionLabel}>Nạp ví</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Transactions')}
            >
              <View style={[styles.actionCircle, { backgroundColor: '#EAEDFF' }]}>
                <MaterialIcons name="qr-code-scanner" size={22} color={Colors.textPrimary} />
              </View>
              <Text style={styles.actionLabel}>Quét QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('AIAssistant')}
            >
              <View style={[styles.actionCircle, { backgroundColor: '#FFDAD6' }]}>
                <MaterialIcons name="auto-awesome" size={22} color="#960014" />
              </View>
              <Text style={styles.actionLabel}>Trợ lý AI</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* 6. Weekly Cashflow Chart */}
        <AnimatedCard delay={250}>
          <View style={[styles.chartCard, Shadows.card]}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.cardSectionTitle}>Biểu đồ thu chi</Text>
                <Text style={styles.cardSectionSubtitle}>Dòng tiền thực nhận & thanh toán</Text>
              </View>
              <View style={styles.filterPillGroup}>
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    activeFilter === 'WEEK' && styles.filterPillActive,
                  ]}
                  onPress={() => setActiveFilter('WEEK')}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      activeFilter === 'WEEK' && styles.filterPillTextActive,
                    ]}
                  >
                    Tuần này
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    activeFilter === 'MONTH' && styles.filterPillActive,
                  ]}
                  onPress={() => setActiveFilter('MONTH')}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      activeFilter === 'MONTH' && styles.filterPillTextActive,
                    ]}
                  >
                    Tháng này
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
                <Text style={styles.legendText}>Thu nhập</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                <Text style={styles.legendText}>Chi tiêu</Text>
              </View>
            </View>

            <View style={styles.barChartContainer}>
              {weekData.map((item, index) => (
                <View key={index} style={styles.barGroup}>
                  <View style={styles.barsArea}>
                    <View
                      style={[
                        styles.barItem,
                        { height: item.incomeH, backgroundColor: Colors.secondary },
                      ]}
                    />
                    <View
                      style={[
                        styles.barItem,
                        { height: item.expenseH, backgroundColor: Colors.error },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </AnimatedCard>

        {/* 7. Recent Transactions List */}
        <AnimatedCard delay={300}>
          <View style={styles.recentSectionHeader}>
            <Text style={styles.cardSectionTitle}>Giao dịch gần đây</Text>
            <TouchableOpacity
              style={styles.viewAllRow}
              onPress={() => navigation.navigate('Transactions')}
            >
              <Text style={styles.viewAllText}>Xem tất cả</Text>
              <MaterialIcons name="chevron-right" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.transactionsCard, Shadows.card]}>
            {transactions.slice(0, 4).map((tx, index) => {
              const isIncome = tx.type === 'INCOME';
              const isLast = index === Math.min(transactions.length, 4) - 1;
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={[styles.txItem, !isLast && styles.txItemBorder]}
                  onPress={() => navigation.navigate('TransactionDetail', { transaction: tx })}
                >
                  <View style={styles.txLeft}>
                    <View
                      style={[
                        styles.txCategoryIcon,
                        { backgroundColor: tx.category.backgroundColor },
                      ]}
                    >
                      <MaterialIcons
                        name={tx.category.icon as any}
                        size={20}
                        color={tx.category.color}
                      />
                    </View>
                    <View style={styles.txMeta}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {tx.title}
                      </Text>
                      <Text style={styles.txSubtitle} numberOfLines={1}>
                        {tx.category.name} • {tx.formattedTime || tx.date}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: isIncome ? Colors.secondary : Colors.error },
                      ]}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </Text>
                    <Text style={styles.txPaymentMethod}>{tx.paymentMethod}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </AnimatedCard>

        <View style={{ height: 100 }} />
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
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  avatarMini: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  contentPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarMain: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  greetingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tierBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryFixed,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onPrimaryFixed,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  quickAccessButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.floating,
  },
  balanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  balanceCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: '#DAD7FF',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  walletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6CF8BB',
  },
  walletBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textWhite,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: Spacing.md,
    gap: Spacing.xs,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textWhite,
    letterSpacing: -0.5,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DAD7FF',
  },
  balanceCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 108, 73, 0.4)',
  },
  growthText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6CF8BB',
  },
  updateTimeText: {
    fontSize: 11,
    color: 'rgba(218, 215, 255, 0.8)',
  },
  metricRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricRowWide: {
    gap: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  metricIconBox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  subMetricText: {
    fontSize: 11,
    fontWeight: '500',
  },
  quickActionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  actionItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterPillGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.textWhite,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  barGroup: {
    alignItems: 'center',
    gap: 6,
  },
  barsArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 90,
  },
  barItem: {
    width: 8,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  transactionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  txItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5FA',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  txCategoryIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txMeta: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  txSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txPaymentMethod: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
