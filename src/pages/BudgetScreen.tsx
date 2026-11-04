import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { loadBudgets } from '../redux/slices/budgetSlice';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { AnimatedProgressBar } from '../components/ui/AnimatedProgressBar';

interface BudgetScreenProps {
  navigation: any;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { budgets, totalAllocated } = useAppSelector((state) => state.budget);
  const { monthlyExpense } = useAppSelector((state) => state.expense);

  useEffect(() => {
    dispatch(loadBudgets());
  }, [dispatch]);

  const percentage = Math.min(Math.round((monthlyExpense / totalAllocated) * 100), 100);
  const remaining = totalAllocated - monthlyExpense;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý ngân sách</Text>
        <TouchableOpacity style={styles.monthBadge}>
          <Text style={styles.monthBadgeText}>Tháng 11/2026</Text>
          <MaterialIcons name="keyboard-arrow-down" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentPadding}>
        {/* Overall Budget Overview Card with Animated Progress */}
        <AnimatedCard delay={50} style={[styles.overviewCard, Shadows.card]}>
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.overviewLabel}>TỔNG NGÂN SÁCH THÁNG</Text>
              <Text style={styles.overviewTotalAmount}>
                {formatCurrency(totalAllocated)}
              </Text>
            </View>
            <View
              style={[
                styles.percentageBadge,
                percentage > 80 ? styles.badgeWarning : styles.badgeSafe,
              ]}
            >
              <Text
                style={[
                  styles.percentageText,
                  percentage > 80 ? styles.textWarning : styles.textSafe,
                ]}
              >
                Đã dùng {percentage}%
              </Text>
            </View>
          </View>

          {/* Large Animated Progress Bar */}
          <View style={styles.progressContainer}>
            <AnimatedProgressBar
              progress={percentage}
              height={12}
              color={percentage > 80 ? Colors.error : Colors.primary}
            />
          </View>

          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>Đã chi tiêu (SQLite)</Text>
              <Text style={[styles.statValue, { color: Colors.error }]}>
                {formatCurrency(monthlyExpense)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View>
              <Text style={styles.statLabel}>Còn lại an toàn</Text>
              <Text style={[styles.statValue, { color: Colors.secondary }]}>
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>

          {percentage >= 80 && (
            <View style={styles.alertBanner}>
              <MaterialIcons name="warning" size={18} color={Colors.error} />
              <Text style={styles.alertText}>
                Bạn đã dùng hơn 80% ngân sách tháng. Hãy cẩn trọng với các chi tiêu ăn uống & giải trí sắp tới!
              </Text>
            </View>
          )}
        </AnimatedCard>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ngân sách theo danh mục</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AIAssistant')}>
            <Text style={styles.aiAdvisorLink}>AI tư vấn hạn mức</Text>
          </TouchableOpacity>
        </View>

        {/* Category Budget Items */}
        <View style={styles.budgetList}>
          {budgets.map((b, index) => {
            const catPercent = Math.min(Math.round((b.spentAmount / b.allocatedAmount) * 100), 100);
            const isNearLimit = catPercent >= 80;

            return (
              <AnimatedCard key={b.id} delay={100 + index * 50} style={[styles.budgetItemCard, Shadows.card]}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleGroup}>
                    <View style={[styles.categoryColorDot, { backgroundColor: b.color }]} />
                    <Text style={styles.categoryTitle}>{b.categoryName}</Text>
                  </View>
                  <Text
                    style={[
                      styles.itemPercent,
                      { color: isNearLimit ? Colors.error : Colors.textSecondary },
                    ]}
                  >
                    {catPercent}%
                  </Text>
                </View>

                {/* Animated Progress bar */}
                <AnimatedProgressBar
                  progress={catPercent}
                  height={8}
                  color={isNearLimit ? Colors.error : b.color}
                  style={{ marginVertical: Spacing.xs }}
                />

                <View style={styles.itemFooter}>
                  <Text style={styles.itemSpent}>
                    Đã chi {formatCurrency(b.spentAmount)}
                  </Text>
                  <Text style={styles.itemAllocated}>
                    Hạn mức: {formatCurrency(b.allocatedAmount)}
                  </Text>
                </View>
              </AnimatedCard>
            );
          })}
        </View>

        <TouchableOpacity style={styles.addBudgetBtn}>
          <MaterialIcons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addBudgetBtnText}>Thiết lập ngân sách danh mục mới</Text>
        </TouchableOpacity>

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  contentPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  overviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  overviewTotalAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  percentageBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeWarning: {
    backgroundColor: '#FFDAD6',
  },
  badgeSafe: {
    backgroundColor: '#D1FAE5',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textWarning: {
    color: Colors.error,
  },
  textSafe: {
    color: Colors.secondary,
  },
  progressContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  alertText: {
    fontSize: 12,
    color: Colors.error,
    flex: 1,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  aiAdvisorLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  budgetList: {
    gap: Spacing.md,
  },
  budgetItemCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  itemTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  itemSpent: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  itemAllocated: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  addBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  addBudgetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
