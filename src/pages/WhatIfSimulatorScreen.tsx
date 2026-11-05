import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';
import { useAppDispatch, useAppSelector } from '../redux/store';
import {
  loadSimulationData,
  createWhatIfScenarioAsync,
  checkInChallengeAsync,
} from '../redux/slices/simulationSlice';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AnimatedCard } from '../components/ui/AnimatedCard';

interface WhatIfSimulatorScreenProps {
  navigation: any;
}

export const WhatIfSimulatorScreen: React.FC<WhatIfSimulatorScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { scenarios, health, challenges } = useAppSelector((state) => state.simulation);
  const { wallets } = useAppSelector((state) => state.wallet);

  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'CHALLENGES'>('SIMULATOR');

  // Simulator Form State
  const [targetTitle, setTargetTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [durationMonths, setDurationMonths] = useState(12);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    dispatch(loadSimulationData());
  }, [dispatch]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const handleRunSimulation = async () => {
    const amount = Number(targetAmount.replace(/[^0-9]/g, ''));
    if (!targetTitle.trim() || !amount) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên món đồ muốn mua và số tiền dự tính.');
      return;
    }

    setIsSimulating(true);
    try {
      await dispatch(
        createWhatIfScenarioAsync({
          title: targetTitle.trim(),
          amount,
          durationMonths,
          income: 35000000,
          expense: 18200000,
          balance: totalBalance,
        })
      ).unwrap();

      Alert.alert('Mô phỏng thành công', 'AI đã phân tích dòng tiền và lập kịch bản tương lai cho quyết định này.');
      setTargetTitle('');
      setTargetAmount('');
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể khởi động cỗ máy mô phỏng.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCheckIn = async (challengeId: string) => {
    await dispatch(checkInChallengeAsync(challengeId));
    Alert.alert('🎉 Điểm danh thành công', 'Bạn đã tích lũy thêm 1 ngày kỷ luật tài chính!');
  };

  return (
    <ScreenContainer>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cỗ Máy Tương Lai & Thử Thách</Text>
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => navigation.navigate('AIAssistant')}
          activeOpacity={0.75}
        >
          <MaterialIcons name="smart-toy" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'SIMULATOR' && styles.tabButtonActive]}
          onPress={() => setActiveTab('SIMULATOR')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="auto-fix-high"
            size={18}
            color={activeTab === 'SIMULATOR' ? Colors.textWhite : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'SIMULATOR' && styles.tabButtonTextActive,
            ]}
          >
            Cỗ Máy Tương Lai (What-If)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'CHALLENGES' && styles.tabButtonActive]}
          onPress={() => setActiveTab('CHALLENGES')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="emoji-events"
            size={18}
            color={activeTab === 'CHALLENGES' ? Colors.textWhite : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'CHALLENGES' && styles.tabButtonTextActive,
            ]}
          >
            Thử Thách & Điểm Sức Khỏe
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: CỖ MÁY WHAT-IF */}
      {activeTab === 'SIMULATOR' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Form input mô phỏng */}
          <AnimatedCard delay={50} style={styles.simulatorFormCard}>
            <View style={styles.formHeader}>
              <View style={styles.formIconBox}>
                <MaterialIcons name="psychology" size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formTitle}>Thử Nghiệm Mua Sắm / Chi Tiêu Lớn</Text>
                <Text style={styles.formSubtitle}>
                  Nhập khoản tiền bạn đang đắn đo, AI sẽ tính toán trước tương lai ví tiền 12 tháng tới!
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Bạn đang định mua gì hoặc chi vào việc gì?</Text>
            <TextInput
              style={styles.textInput}
              value={targetTitle}
              onChangeText={setTargetTitle}
              placeholder="Ví dụ: Mua iPhone 16, Mua xe máy điện, Đi du lịch Nhật..."
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>Số tiền dự toán (VNĐ)</Text>
            <TextInput
              style={styles.textInput}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="Ví dụ: 30.000.000"
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>Kỳ hạn chi trả</Text>
            <View style={styles.durationRow}>
              {[
                { label: 'Chi 1 lần', months: 1 },
                { label: '3 tháng', months: 3 },
                { label: '6 tháng', months: 6 },
                { label: '12 tháng', months: 12 },
                { label: '24 tháng', months: 24 },
              ].map((item) => (
                <TouchableOpacity
                  key={item.months}
                  style={[
                    styles.durationPill,
                    durationMonths === item.months && styles.durationPillActive,
                  ]}
                  onPress={() => setDurationMonths(item.months)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.durationPillText,
                      durationMonths === item.months && styles.durationPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.runSimulatorBtn}
              onPress={handleRunSimulation}
              disabled={isSimulating}
              activeOpacity={0.85}
            >
              <MaterialIcons name="bolt" size={20} color={Colors.textWhite} />
              <Text style={styles.runSimulatorBtnText}>
                {isSimulating ? 'Đang chạy mô phỏng...' : 'Khởi Động Cỗ Máy Tương Lai'}
              </Text>
            </TouchableOpacity>
          </AnimatedCard>

          {/* Danh sách kịch bản đã lưu */}
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="history" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Các Kịch Bản Đã Mô Phỏng ({scenarios.length})</Text>
          </View>

          <View style={styles.scenariosList}>
            {scenarios.map((sc) => {
              const isSafe = sc.safeToBuy;

              return (
                <AnimatedCard key={sc.id} delay={100} style={styles.scenarioCard}>
                  <View style={styles.scenarioTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scenarioTitle}>{sc.title}</Text>
                      <Text style={styles.scenarioAmount}>
                        {formatCurrency(sc.targetAmount)}
                        {sc.durationMonths && sc.durationMonths > 1
                          ? ` • Trả góp ${formatCurrency(sc.monthlyPayment || 0)}/tháng (${sc.durationMonths} tháng)`
                          : ' • Chi trả 1 lần'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.feasibilityBadge,
                        { backgroundColor: isSafe ? Colors.incomeLight : Colors.expenseLight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.feasibilityBadgeText,
                          { color: isSafe ? Colors.income : Colors.expense },
                        ]}
                      >
                        {sc.feasibilityScore}/100
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.assessmentBox,
                      { borderColor: isSafe ? Colors.borderEmerald : Colors.expenseLight },
                    ]}
                  >
                    <View style={styles.assessmentHeader}>
                      <MaterialIcons
                        name={isSafe ? 'check-circle' : 'warning'}
                        size={16}
                        color={isSafe ? Colors.income : Colors.expense}
                      />
                      <Text
                        style={[
                          styles.assessmentStatusText,
                          { color: isSafe ? Colors.income : Colors.expense },
                        ]}
                      >
                        {isSafe ? 'QUYẾT ĐỊNH AN TOÀN' : 'CẢNH BÁO RỦI RO THÂM HỤT'}
                      </Text>
                    </View>
                    <Text style={styles.assessmentText}>{sc.impactAssessment}</Text>
                  </View>

                  <View style={styles.recommendationRow}>
                    <MaterialIcons name="lightbulb" size={16} color={Colors.warning} />
                    <Text style={styles.recommendationText}>
                      <Text style={{ fontWeight: '800' }}>Lời khuyên AI: </Text>
                      {sc.recommendation}
                    </Text>
                  </View>
                </AnimatedCard>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* TAB 2: THỬ THÁCH & ĐIỂM SỨC KHỎE */}
      {activeTab === 'CHALLENGES' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Health Score Overview */}
          <AnimatedCard delay={50} style={styles.healthHeroCard}>
            <View style={styles.healthHeroHeader}>
              <View>
                <Text style={styles.healthHeroLabel}>ĐIỂM SỨC KHỎE TÀI CHÍNH</Text>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreBig}>{health.score}</Text>
                  <Text style={styles.scoreTotal}>/1000</Text>
                </View>
              </View>

              <View style={styles.tierPill}>
                <MaterialIcons name="verified" size={16} color={Colors.textWhite} />
                <Text style={styles.tierPillText}>{health.tier}</Text>
              </View>
            </View>

            {/* 4 Radar Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{health.savingsRate}%</Text>
                <Text style={styles.metricLab}>Tỷ lệ tích lũy</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{health.debtToIncomeRatio}%</Text>
                <Text style={styles.metricLab}>Tỷ lệ nợ/thu nhập</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{health.emergencyFundMonths} thg</Text>
                <Text style={styles.metricLab}>Quỹ khẩn cấp</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{health.budgetAdherence}%</Text>
                <Text style={styles.metricLab}>Kỷ luật hạn mức</Text>
              </View>
            </View>

            {/* Actionable Tips */}
            <View style={styles.tipsContainer}>
              {health.actionableTips.map((tip, idx) => (
                <View key={idx} style={styles.tipItem}>
                  <MaterialIcons name="check" size={14} color={Colors.income} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </AnimatedCard>

          {/* Challenges List */}
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="flag" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Thử Thách Rèn Luyện Tài Chính</Text>
          </View>

          <View style={styles.challengesList}>
            {challenges.map((ch) => {
              const isCompleted = ch.status === 'COMPLETED';
              const progressPercent = Math.min(100, Math.round((ch.currentDays / ch.targetDays) * 100));

              return (
                <AnimatedCard key={ch.id} delay={100} style={styles.challengeCard}>
                  <View style={styles.challengeTop}>
                    <View
                      style={[
                        styles.challengeIconBox,
                        { backgroundColor: isCompleted ? Colors.incomeLight : Colors.warningLight },
                      ]}
                    >
                      <MaterialIcons
                        name={isCompleted ? 'emoji-events' : (ch.icon as any) || 'bolt'}
                        size={24}
                        color={isCompleted ? Colors.income : Colors.warning}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.challengeTitle}>{ch.title}</Text>
                      <Text style={styles.challengeDesc}>{ch.description}</Text>
                      <Text style={styles.potentialSavingText}>
                        Tiết kiệm dự kiến: +{formatCurrency(ch.potentialSavings)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.challengeProgressRow}>
                    <Text style={styles.progressText}>
                      Tiến độ: {ch.currentDays}/{ch.targetDays} ngày ({progressPercent}%)
                    </Text>

                    {isCompleted ? (
                      <View style={styles.completedBadge}>
                        <MaterialIcons name="verified" size={14} color={Colors.income} />
                        <Text style={styles.completedBadgeText}>Đạt huy hiệu</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.checkInBtn}
                        onPress={() => handleCheckIn(ch.id)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="alarm-on" size={16} color={Colors.textWhite} />
                        <Text style={styles.checkInBtnText}>Điểm danh hôm nay</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${progressPercent}%`,
                          backgroundColor: isCompleted ? Colors.income : Colors.primary,
                        },
                      ]}
                    />
                  </View>
                </AnimatedCard>
              );
            })}
          </View>
        </ScrollView>
      )}

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
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  aiButton: {
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

  // FORM CARD
  simulatorFormCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  formHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  formIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  formSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
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
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  durationPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durationPillActive: {
    backgroundColor: Colors.navyDeep,
    borderColor: Colors.navyDeep,
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  durationPillTextActive: {
    color: Colors.textWhite,
  },
  runSimulatorBtn: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xl,
  },
  runSimulatorBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textWhite,
  },

  // SCENARIOS
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
  scenariosList: {
    gap: Spacing.md,
  },
  scenarioCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  scenarioTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scenarioTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scenarioAmount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  feasibilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  feasibilityBadgeText: {
    fontSize: 13,
    fontWeight: '900',
  },
  assessmentBox: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    gap: 4,
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assessmentStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  assessmentText: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // HEALTH HERO
  healthHeroCard: {
    backgroundColor: Colors.navyDeep,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.hero,
  },
  healthHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  healthHeroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  scoreBig: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.textWhite,
  },
  scoreTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tierPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  metricsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.income,
  },
  metricLab: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  tipsContainer: {
    gap: Spacing.xs,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },

  // CHALLENGES
  challengesList: {
    gap: Spacing.md,
  },
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.card,
  },
  challengeTop: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  challengeIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  challengeDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  potentialSavingText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.income,
    marginTop: 4,
  },
  challengeProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.incomeLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.income,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.navyDeep,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  checkInBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
