import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, DarkColors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatCurrency, getJarName, getJarShortName } from '../utils/formatters';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { toggleBalanceVisibility, loadTransactions } from '../redux/slices/expenseSlice';
import { loadBudgets } from '../redux/slices/budgetSlice';
import { loadWalletsAndJars, updateAllJarsAsync } from '../redux/slices/walletSlice';
import { updateCurrentUserProfile } from '../redux/slices/authSlice';
import { loadRecurringAndDebts } from '../redux/slices/recurringSlice';
import { loadSimulationData } from '../redux/slices/simulationSlice';
import { useResponsive } from '../hooks/useResponsive';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { CashflowTrendChart } from '../components/dashboard/CashflowTrendChart';
import { mockUser } from '../data/mockData';
import { JarEnvelope } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isTablet, width } = useResponsive();
  const isCompact = !isTablet && width < 400;

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

  // Tính toán thu nhập và chi tiêu realtime từ transactions
  const totalIncomeFromTx = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseFromTx = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyIncome = totalIncomeFromTx > 0 ? totalIncomeFromTx : (user.monthlyIncome || 35000000);
  const monthlyExpense = totalExpenseFromTx > 0 ? totalExpenseFromTx : (user.monthlyExpense || 18200000);
  const savingsRate = Math.max(0, Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100));

  // TÍNH TOÁN REALTIME CHO 6 HŨ TÀI CHÍNH (Đồng bộ trực tiếp theo các giao dịch thực tế)
  const realtimeJars = useMemo(() => {
    return jars.map((jar) => {
      // Tổng chi tiêu EXPENSE thực tế thuộc về hũ này từ các giao dịch
      const txSpent = transactions
        .filter(
          (t) =>
            t.type === 'EXPENSE' &&
            (t.jarCode === jar.code || t.category?.jarCode === jar.code)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const effectiveSpent = txSpent > 0 ? txSpent : jar.spentAmount;

      return {
        ...jar,
        spentAmount: effectiveSpent,
      };
    });
  }, [jars, transactions]);

  const pendingDebtsCount = debtsList.filter((d) => d.status === 'PENDING').length;
  const activeRecurringCount = recurringList.filter((r) => r.status === 'ACTIVE').length;

  // Điều khiển cuộn ngang hệ thống ví ảo đa tầng
  const walletsScrollRef = useRef<any>(null);
  const [walletScrollX, setWalletScrollX] = useState(0);

  const scrollWallets = (direction: 'left' | 'right') => {
    const scrollStep = 240;
    const nextX = direction === 'left' ? Math.max(0, walletScrollX - scrollStep) : walletScrollX + scrollStep;
    walletsScrollRef.current?.scrollTo({ x: nextX, animated: true });
    setWalletScrollX(nextX);
  };

  const handleWalletWheel = (e: any) => {
    if (Platform.OS === 'web' && walletsScrollRef.current) {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta !== 0) {
        const nextX = Math.max(0, walletScrollX + delta);
        walletsScrollRef.current.scrollTo({ x: nextX, animated: false });
        setWalletScrollX(nextX);
      }
    }
  };

  // State Cài Đặt Hạn Mức 6 Hũ Chi Tiêu Theo Túi Tiền
  const [isJarModalOpen, setIsJarModalOpen] = useState(false);
  const [jarModalIncome, setJarModalIncome] = useState(monthlyIncome.toString());
  const [tempJars, setTempJars] = useState<JarEnvelope[]>([]);
  const [jarConfigTab, setJarConfigTab] = useState<'PERCENT' | 'AMOUNT'>('PERCENT');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const handleOpenJarSettings = () => {
    setJarModalIncome(monthlyIncome.toString());
    setTempJars(jars.map((j) => ({ ...j })));
    setSaveSuccessNotice(null);
    setIsJarModalOpen(true);
  };

  const handleApplyPreset = (presetType: 'DEFAULT' | 'INVEST' | 'SAVING' | 'BALANCED') => {
    const incomeVal = parseFloat(jarModalIncome) || monthlyIncome;
    let percentages: Record<string, number> = {
      NEC: 55,
      FFA: 10,
      LTSS: 10,
      EDU: 10,
      PLAY: 10,
      GIVE: 5,
    };

    if (presetType === 'INVEST') {
      percentages = { NEC: 45, FFA: 25, LTSS: 10, EDU: 10, PLAY: 5, GIVE: 5 };
    } else if (presetType === 'SAVING') {
      percentages = { NEC: 50, FFA: 10, LTSS: 20, EDU: 10, PLAY: 5, GIVE: 5 };
    } else if (presetType === 'BALANCED') {
      percentages = { NEC: 50, FFA: 15, LTSS: 10, EDU: 10, PLAY: 10, GIVE: 5 };
    }

    setTempJars((prev) =>
      prev.map((j) => {
        const pct = percentages[j.code] ?? j.percentage;
        return {
          ...j,
          percentage: pct,
          allocatedAmount: Math.round((incomeVal * pct) / 100),
        };
      })
    );
  };

  const handleJarPercentageChange = (code: string, newPct: number) => {
    const incomeVal = parseFloat(jarModalIncome) || monthlyIncome;
    const clampedPct = Math.max(0, Math.min(100, newPct));
    setTempJars((prev) =>
      prev.map((j) =>
        j.code === code
          ? {
              ...j,
              percentage: clampedPct,
              allocatedAmount: Math.round((incomeVal * clampedPct) / 100),
            }
          : j
      )
    );
  };

  const handleJarAmountChange = (code: string, newAmountStr: string) => {
    const incomeVal = parseFloat(jarModalIncome) || monthlyIncome;
    const amountVal = parseFloat(newAmountStr.replace(/[^0-9]/g, '')) || 0;
    const calculatedPct = incomeVal > 0 ? Math.round((amountVal / incomeVal) * 100) : 0;

    setTempJars((prev) =>
      prev.map((j) =>
        j.code === code
          ? {
              ...j,
              allocatedAmount: amountVal,
              percentage: calculatedPct,
            }
          : j
      )
    );
  };

  const handleSaveJarSettings = async () => {
    const incomeVal = parseFloat(jarModalIncome) || monthlyIncome;

    if (incomeVal !== user.monthlyIncome) {
      dispatch(updateCurrentUserProfile({ monthlyIncome: incomeVal }));
    }

    await dispatch(updateAllJarsAsync(tempJars));

    setSaveSuccessNotice('Đã lưu thành công hạn mức 6 hũ theo túi tiền của bạn!');
    setTimeout(() => {
      setIsJarModalOpen(false);
      setSaveSuccessNotice(null);
    }, 700);
  };

  const totalTempPercentage = tempJars.reduce((sum, j) => sum + j.percentage, 0);
  const totalTempAllocated = tempJars.reduce((sum, j) => sum + j.allocatedAmount, 0);

  return (
    <ScreenContainer>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <View style={styles.userTextContainer}>
            <View style={styles.tierBadge}>
              <MaterialIcons name="verified" size={12} color={Colors.primary} />
            <Text style={styles.tierBadgeText} numberOfLines={1}>{user.tier}</Text>
            </View>
            <Text style={[styles.userNameText, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
              Chào bạn, {user.name}
            </Text>
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
            <Text style={styles.heroLabel} numberOfLines={1}>TỔNG TÀI SẢN KHẢ DỤNG</Text>
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
            <Text style={styles.heroSubtitle} numberOfLines={1}>Cập nhật theo thời gian thực</Text>
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
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Hệ Thống Ví Ảo Đa Tầng</Text>
        </View>

        <View style={styles.walletHeaderActions}>
          {/* Nút điều hướng cuộn ngang sang trái / phải khi có ví bị khuất */}
          <View style={styles.walletScrollButtonsRow}>
            <TouchableOpacity
              style={[
                styles.walletScrollNavBtn,
                { backgroundColor: theme.surfaceContainerLow, borderColor: theme.border },
                walletScrollX <= 5 && styles.walletScrollNavBtnDisabled,
              ]}
              onPress={() => scrollWallets('left')}
              disabled={walletScrollX <= 5}
              activeOpacity={0.7}
              accessibilityLabel="Cuộn sang trái"
            >
              <MaterialIcons
                name="chevron-left"
                size={20}
                color={walletScrollX <= 5 ? theme.textMuted : theme.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.walletScrollNavBtn,
                { backgroundColor: theme.surfaceContainerLow, borderColor: theme.border },
              ]}
              onPress={() => scrollWallets('right')}
              activeOpacity={0.7}
              accessibilityLabel="Cuộn sang phải"
            >
              <MaterialIcons name="chevron-right" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Wallets')} activeOpacity={0.7}>
            <Text style={styles.sectionSeeAll}>Quản lý ({wallets.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.walletsSliderWrapper}>
        <ScrollView
          ref={walletsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={Platform.OS === 'web'}
          contentContainerStyle={styles.walletsScrollContent}
          onScroll={(e) => {
            setWalletScrollX(e.nativeEvent.contentOffset.x);
          }}
          scrollEventThrottle={16}
          {...(Platform.OS === 'web'
            ? {
                onWheel: handleWalletWheel,
              }
            : {})}
        >
          {wallets.map((wallet) => (
            <TouchableOpacity
              key={wallet.id}
              style={[
                styles.walletCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: wallet.color + '40',
                },
              ]}
              onPress={() => navigation.navigate('Wallets')}
              activeOpacity={0.85}
            >
              <View style={styles.walletCardHeader}>
                <View style={[styles.walletIconBox, { backgroundColor: wallet.backgroundColor }]}>
                  <MaterialIcons name={wallet.icon as any} size={20} color={wallet.color} />
                </View>
                <Text style={[styles.walletAccountNo, { color: theme.textMuted }]}>
                  {wallet.accountNumber || 'Ví chính'}
                </Text>
              </View>

              <Text style={[styles.walletName, { color: theme.textSecondary }]} numberOfLines={1}>
                {wallet.name}
              </Text>

              <Text
                style={[
                  styles.walletBalance,
                  wallet.balance < 0 ? { color: Colors.expense } : { color: theme.textPrimary },
                ]}
              >
                {isBalanceVisible ? formatCurrency(wallet.balance) : '••••••'}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Add Wallet Card */}
          <TouchableOpacity
            style={[
              styles.addWalletCard,
              { backgroundColor: theme.surfaceContainerLow, borderColor: theme.border },
            ]}
            onPress={() => navigation.navigate('Wallets')}
            activeOpacity={0.75}
          >
            <View style={styles.addWalletIconBox}>
              <MaterialIcons name="add" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.addWalletText}>Thêm ví mới</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 4. BENTO GRID 2 COLUMNS (Health Score & Monthly Cashflow) */}
      <View style={[styles.bentoRow, isTablet && { flexWrap: 'nowrap' }, isCompact && styles.bentoRowCompact]}>
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

      {/* 7. 6 CHIẾC LỌ TÀI CHÍNH (QUY TẮC PHÂN BỔ T. HARV EKER - HIỂN THỊ REALTIME) */}
      <AnimatedCard delay={200} style={[styles.jarsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.sectionHeaderRowInside}>
          <View style={styles.sectionTitleWithIcon}>
            <MaterialIcons name="savings" size={20} color={Colors.primary} />
            <Text style={[styles.cardHeaderTitle, { color: theme.textPrimary }]}>
              6 Hũ Quản Lý Chi Tiêu (Quy Tắc 6 Chiếc Lọ)
            </Text>
          </View>
          <View style={styles.jarsCardHeaderActions}>
            <TouchableOpacity
              style={[styles.jarSettingsBtn, { backgroundColor: theme.primaryLight }]}
              onPress={handleOpenJarSettings}
              activeOpacity={0.8}
            >
              <MaterialIcons name="tune" size={14} color={theme.primary} />
              <Text style={[styles.jarSettingsBtnText, { color: theme.primary }]}>Cài đặt hạn mức</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Budget')} activeOpacity={0.7}>
              <Text style={styles.sectionSeeAll}>Chi tiết</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.jarsDescription, { color: theme.textMuted }]}>
          Hạn mức tự động cân đối theo túi tiền của bạn. Tiến độ chi tiêu cập nhật thời gian thực (Realtime) từ các giao dịch.
        </Text>

        <View style={styles.jarsGrid}>
          {realtimeJars.map((jar) => {
            const spentPercent = jar.allocatedAmount > 0
              ? Math.min(100, Math.round((jar.spentAmount / jar.allocatedAmount) * 100))
              : 0;
            const isWarning = spentPercent >= 80;
            const jarVietnameseTitle = getJarName(jar.code);
            const remainingAmount = Math.max(0, jar.allocatedAmount - jar.spentAmount);

            return (
              <TouchableOpacity
                key={jar.id}
                style={[styles.jarItem, { backgroundColor: theme.surfaceContainerLow }]}
                onPress={handleOpenJarSettings}
                activeOpacity={0.85}
              >
                <View style={styles.jarItemHeader}>
                  <View style={styles.jarBadgeWithIcon}>
                    <View style={[styles.jarMiniDot, { backgroundColor: jar.color }]} />
                    <Text style={[styles.jarNameText, { color: theme.textPrimary }]}>{jarVietnameseTitle}</Text>
                    <View style={[styles.jarPercentBadge, { backgroundColor: theme.surface }]}>
                      <Text style={[styles.jarPercentText, { color: theme.textSecondary }]}>{jar.percentage}%</Text>
                    </View>
                  </View>

                  {isWarning ? (
                    <View style={styles.warningPill}>
                      <MaterialIcons name="warning" size={12} color={Colors.expense} />
                      <Text style={styles.warningPillText}>Đã tiêu {spentPercent}% (Cảnh báo vượt 80%)</Text>
                    </View>
                  ) : (
                    <Text style={[styles.jarSpentPercent, { color: theme.textSecondary }]}>Đã dùng {spentPercent}%</Text>
                  )}
                </View>

                {/* Progress bar */}
                <View style={[styles.jarProgressBarTrack, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
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
                  <Text style={[styles.jarMoneyLeft, { color: theme.textSecondary }]}>
                    Đã chi: <Text style={[styles.boldText, { color: theme.textPrimary }]}>{formatCurrency(jar.spentAmount)}</Text> / {formatCurrency(jar.allocatedAmount)}
                  </Text>
                  <Text style={[styles.jarMoneyRight, isWarning ? { color: Colors.expense } : { color: Colors.income }]}>
                    Còn lại: {formatCurrency(remainingAmount)}
                  </Text>
                </View>

                <Text style={[styles.jarSubtext, { color: theme.textMuted }]}>
                  {jar.description}
                </Text>
              </TouchableOpacity>
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

      {/* MODAL CÀI ĐẶT HẠN MỨC 6 HŨ THEO TÚI TIỀN */}
      <Modal
        visible={isJarModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsJarModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Cài Đặt Hạn Mức 6 Hũ Chi Tiêu
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Thiết lập hạn mức phân bổ theo túi tiền thực tế của bạn
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsJarModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Thông báo lưu thành công */}
            {saveSuccessNotice && (
              <View style={styles.successBanner}>
                <MaterialIcons name="check-circle" size={18} color="#166534" />
                <Text style={styles.successBannerText}>{saveSuccessNotice}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
              {/* Card Thu Nhập Hàng Tháng Của Túi Tiền */}
              <View style={[styles.incomeConfigCard, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.border }]}>
                <View style={styles.incomeConfigHeader}>
                  <MaterialIcons name="account-balance-wallet" size={20} color={theme.primary} />
                  <Text style={[styles.incomeConfigLabel, { color: theme.textPrimary }]}>
                    Thu nhập / Túi tiền hàng tháng của bạn
                  </Text>
                </View>

                <View style={[styles.incomeInputRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <TextInput
                    style={[styles.incomeInput, { color: theme.textPrimary }]}
                    value={jarModalIncome}
                    onChangeText={(val) => {
                      setJarModalIncome(val);
                      const inc = parseFloat(val) || 0;
                      setTempJars((prev) =>
                        prev.map((j) => ({
                          ...j,
                          allocatedAmount: Math.round((inc * j.percentage) / 100),
                        }))
                      );
                    }}
                    placeholder="35000000"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.currencySuffix, { color: theme.primary }]}>VNĐ / tháng</Text>
                </View>

                <Text style={[styles.incomeHelperText, { color: theme.textMuted }]}>
                  💡 Khi bạn thay đổi thu nhập, hạn mức đề xuất của từng hũ sẽ tự động điều chỉnh theo % phân bổ.
                </Text>
              </View>

              {/* Nhóm Nút Cấu Hình Nhanh (Presets) */}
              <Text style={[styles.groupTitleLabel, { color: theme.textSecondary }]}>
                BỘ CẤU HÌNH NHANH THEO MỤC TIÊU:
              </Text>
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={[styles.presetChip, { borderColor: theme.primary, backgroundColor: theme.primaryLight }]}
                  onPress={() => handleApplyPreset('DEFAULT')}
                >
                  <Text style={[styles.presetChipText, { color: theme.primary }]}>
                    ⭐ Chuẩn Eker (55-10-10-10-10-5%)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, { borderColor: '#0284C7', backgroundColor: '#F0F9FF' }]}
                  onPress={() => handleApplyPreset('INVEST')}
                >
                  <Text style={[styles.presetChipText, { color: '#0284C7' }]}>
                    📈 Đầu tư & Tự do (45-25-10-10-5-5%)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, { borderColor: '#D97706', backgroundColor: '#FFFBEB' }]}
                  onPress={() => handleApplyPreset('SAVING')}
                >
                  <Text style={[styles.presetChipText, { color: '#D97706' }]}>
                    🛡️ Tối ưu tích lũy (50-10-20-10-5-5%)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, { borderColor: '#7C3AED', backgroundColor: '#FAF5FF' }]}
                  onPress={() => handleApplyPreset('BALANCED')}
                >
                  <Text style={[styles.presetChipText, { color: '#7C3AED' }]}>
                    ⚖️ Cân bằng linh hoạt (50-15-10-10-10-5%)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Chuyển đổi Tab Điều Chỉnh: Theo % hoặc Theo Tiền VNĐ */}
              <View style={[styles.tabToggleRow, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.border }]}>
                <TouchableOpacity
                  style={[
                    styles.tabToggleBtn,
                    jarConfigTab === 'PERCENT' && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setJarConfigTab('PERCENT')}
                >
                  <Text
                    style={[
                      styles.tabToggleBtnText,
                      { color: jarConfigTab === 'PERCENT' ? '#FFF' : theme.textSecondary },
                    ]}
                  >
                    Điều chỉnh theo tỷ lệ %
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabToggleBtn,
                    jarConfigTab === 'AMOUNT' && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setJarConfigTab('AMOUNT')}
                >
                  <Text
                    style={[
                      styles.tabToggleBtnText,
                      { color: jarConfigTab === 'AMOUNT' ? '#FFF' : theme.textSecondary },
                    ]}
                  >
                    Nhập số tiền hạn mức (VNĐ)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Danh sách 6 Hũ tùy chỉnh */}
              <View style={styles.jarsEditList}>
                {tempJars.map((jar) => {
                  const jarTitle = getJarName(jar.code);
                  return (
                    <View
                      key={jar.id}
                      style={[
                        styles.jarEditCard,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <View style={styles.jarEditHeader}>
                        <View style={styles.jarEditTitleRow}>
                          <View style={[styles.jarMiniDot, { backgroundColor: jar.color }]} />
                          <Text style={[styles.jarEditName, { color: theme.textPrimary }]}>
                            {jarTitle}
                          </Text>
                        </View>
                        <Text style={[styles.jarEditCurrentAmount, { color: theme.primary }]}>
                          {formatCurrency(jar.allocatedAmount)}
                        </Text>
                      </View>

                      {jarConfigTab === 'PERCENT' ? (
                        <View style={styles.pctStepperRow}>
                          <TouchableOpacity
                            style={[styles.pctStepBtn, { borderColor: theme.border, backgroundColor: theme.surfaceContainerLow }]}
                            onPress={() => handleJarPercentageChange(jar.code, jar.percentage - 5)}
                          >
                            <MaterialIcons name="remove" size={16} color={theme.textPrimary} />
                          </TouchableOpacity>

                          <View style={styles.pctValueBox}>
                            <Text style={[styles.pctValueText, { color: theme.textPrimary }]}>
                              {jar.percentage}%
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={[styles.pctStepBtn, { borderColor: theme.border, backgroundColor: theme.surfaceContainerLow }]}
                            onPress={() => handleJarPercentageChange(jar.code, jar.percentage + 5)}
                          >
                            <MaterialIcons name="add" size={16} color={theme.textPrimary} />
                          </TouchableOpacity>

                          <Text style={[styles.pctEquivalentText, { color: theme.textMuted }]}>
                            = {formatCurrency(jar.allocatedAmount)}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.amountInputRow}>
                          <TextInput
                            style={[
                              styles.amountInput,
                              { backgroundColor: theme.surfaceContainerLow, color: theme.textPrimary, borderColor: theme.border },
                            ]}
                            value={jar.allocatedAmount.toString()}
                            onChangeText={(val) => handleJarAmountChange(jar.code, val)}
                            keyboardType="numeric"
                            placeholder="Nhập số tiền hạn mức"
                            placeholderTextColor={theme.textMuted}
                          />
                          <Text style={[styles.amountEquivalentPct, { color: theme.textMuted }]}>
                            Tương đương {jar.percentage}%
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Tổng kết và cảnh báo */}
              <View style={[styles.summaryFooterBox, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.border }]}>
                <View style={styles.summaryFooterRow}>
                  <Text style={[styles.summaryFooterLabel, { color: theme.textSecondary }]}>
                    Tổng tỷ lệ phân bổ:
                  </Text>
                  <Text
                    style={[
                      styles.summaryFooterValue,
                      totalTempPercentage === 100 ? { color: '#166534' } : { color: Colors.expense },
                    ]}
                  >
                    {totalTempPercentage}% {totalTempPercentage === 100 ? '(Chuẩn 100%)' : '(Cần cân đối đủ 100%)'}
                  </Text>
                </View>

                <View style={styles.summaryFooterRow}>
                  <Text style={[styles.summaryFooterLabel, { color: theme.textSecondary }]}>
                    Tổng hạn mức 6 hũ:
                  </Text>
                  <Text style={[styles.summaryFooterValue, { color: theme.textPrimary }]}>
                    {formatCurrency(totalTempAllocated)}
                  </Text>
                </View>
              </View>

              {/* Nút Lưu Cài Đặt */}
              <TouchableOpacity
                style={[styles.saveModalBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveJarSettings}
                activeOpacity={0.85}
              >
                <MaterialIcons name="check" size={20} color="#FFF" />
                <Text style={styles.saveModalBtnText}>Lưu Cài Đặt Hạn Mức 6 Hũ</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    minWidth: 0,
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
    flexShrink: 1,
    minWidth: 0,
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
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  userNameText: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexShrink: 0,
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
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLabel: {
    flexShrink: 1,
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
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  heroBadge: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  heroBadgeText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.income,
  },
  heroSubtitle: {
    flexShrink: 1,
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
    minWidth: 0,
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
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textWhite,
    textAlign: 'center',
  },

  // SECTION HEADERS
  sectionHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    flexShrink: 1,
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
  walletHeaderActions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  walletScrollButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 2,
  },
  walletScrollNavBtn: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  walletScrollNavBtnDisabled: {
    opacity: 0.35,
  },
  walletsSliderWrapper: {
    position: 'relative',
    width: '100%',
  },

  // WALLETS SCROLL
  walletsScrollContent: {
    paddingBottom: Spacing.md,
    paddingRight: Spacing.xl,
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
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bentoCard: {
    minWidth: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  bentoRowCompact: {
    flexDirection: 'column',
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
  jarsCardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  jarSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  jarSettingsBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
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

  // JARS CONFIG MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '90%',
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    ...Shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  successBannerText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  incomeConfigCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  incomeConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  incomeConfigLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  incomeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 46,
    marginTop: 4,
  },
  incomeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  currencySuffix: {
    fontSize: 12,
    fontWeight: '700',
  },
  incomeHelperText: {
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },
  groupTitleLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: Spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabToggleRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  tabToggleBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  jarsEditList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  jarEditCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  jarEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jarEditTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  jarEditName: {
    fontSize: 13,
    fontWeight: '700',
  },
  jarEditCurrentAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  pctStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  pctStepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pctValueBox: {
    width: 44,
    alignItems: 'center',
  },
  pctValueText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pctEquivalentText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  amountInput: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    fontSize: 13,
    fontWeight: '700',
  },
  amountEquivalentPct: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryFooterBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: 4,
  },
  summaryFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryFooterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryFooterValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  saveModalBtn: {
    height: 48,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  saveModalBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
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
