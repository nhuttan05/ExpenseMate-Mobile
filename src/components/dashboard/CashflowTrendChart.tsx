import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CashflowTrendChartProps {
  transactions: Transaction[];
  onNavigateDetail?: () => void;
}

type PeriodType = '7D' | '30D' | '6M';

interface ChartPoint {
  label: string;
  subLabel: string;
  income: number;
  expense: number;
  net: number;
}

export const CashflowTrendChart: React.FC<CashflowTrendChartProps> = ({
  transactions,
  onNavigateDetail,
}) => {
  const [period, setPeriod] = useState<PeriodType>('7D');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handlePeriodChange = (nextPeriod: PeriodType) => {
    setPeriod(nextPeriod);
    setSelectedIdx(null);
  };

  // Tính toán dữ liệu theo khoảng thời gian được chọn
  const chartData: ChartPoint[] = useMemo(() => {
    if (period === '7D') {
      const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const subLabels = ['03/11', '04/11', '05/11', '06/11', '07/11', '08/11', '09/11'];
      // Mock seed distributions based on real transactions
      const incomeMap = [0, 5000000, 0, 0, 15000000, 0, 2000000];
      const expenseMap = [450000, 1250000, 320000, 890000, 2100000, 1400000, 680000];

      return days.map((d, i) => {
        const inc = incomeMap[i];
        const exp = expenseMap[i];
        return {
          label: d,
          subLabel: subLabels[i],
          income: inc,
          expense: exp,
          net: inc - exp,
        };
      });
    }

    if (period === '30D') {
      const weeks = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
      const subLabels = ['01-07', '08-14', '15-21', '22-28'];
      const incomeMap = [10000000, 5000000, 15000000, 5000000];
      const expenseMap = [4200000, 3800000, 5900000, 4300000];

      return weeks.map((w, i) => ({
        label: w,
        subLabel: subLabels[i],
        income: incomeMap[i],
        expense: expenseMap[i],
        net: incomeMap[i] - expenseMap[i],
      }));
    }

    // 6M
    const months = ['T6', 'T7', 'T8', 'T9', 'T10', 'T11'];
    const subLabels = ['2026', '2026', '2026', '2026', '2026', '2026'];
    const incomeMap = [32000000, 35000000, 35000000, 38000000, 35000000, 35000000];
    const expenseMap = [19500000, 18000000, 22100000, 17500000, 18200000, 14200000];

    return months.map((m, i) => ({
      label: m,
      subLabel: subLabels[i],
      income: incomeMap[i],
      expense: expenseMap[i],
      net: incomeMap[i] - expenseMap[i],
    }));
  }, [period]);

  // Tìm giá trị max để scale chiều cao cột
  const maxVal = useMemo(() => {
    let max = 1;
    chartData.forEach((p) => {
      if (p.income > max) max = p.income;
      if (p.expense > max) max = p.expense;
    });
    return max;
  }, [chartData]);

  // Điểm được chọn hoặc mặc định điểm cuối cùng
  const activePoint = selectedIdx !== null ? chartData[selectedIdx] : chartData[chartData.length - 1];

  const totalPeriodIncome = useMemo(() => chartData.reduce((acc, c) => acc + c.income, 0), [chartData]);
  const totalPeriodExpense = useMemo(() => chartData.reduce((acc, c) => acc + c.expense, 0), [chartData]);
  const netSavingsRate = totalPeriodIncome > 0
    ? Math.round(((totalPeriodIncome - totalPeriodExpense) / totalPeriodIncome) * 100)
    : 0;

  return (
    <View style={[styles.container, Shadows.card]}>
      {/* 1. Header with Period Tabs */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={styles.titleIconBox}>
            <MaterialIcons name="auto-graph" size={18} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Xu Hướng Dòng Tiền</Text>
            <Text style={styles.subtitle}>Phân tích trực quan Thu & Chi</Text>
          </View>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          {(['7D', '30D', '6M'] as const).map((p) => {
            const isActive = period === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                onPress={() => handlePeriodChange(p)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {p === '7D' ? '7 Ngày' : p === '30D' ? '30 Ngày' : '6 Tháng'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Interactive Tooltip Card for Active Point */}
      {activePoint && (
        <View style={styles.tooltipCard}>
          <View style={styles.tooltipTopRow}>
            <View style={styles.tooltipTag}>
              <MaterialIcons name="calendar-today" size={12} color={Colors.primary} />
              <Text style={styles.tooltipTagText}>
                {activePoint.label} ({activePoint.subLabel})
              </Text>
            </View>
            <Text
              style={[
                styles.netPillText,
                activePoint.net >= 0 ? { color: Colors.income } : { color: Colors.expense },
              ]}
            >
              {activePoint.net >= 0 ? 'Thặng dư: +' : 'Thâm hụt: '}
              {formatCurrency(Math.abs(activePoint.net))}
            </Text>
          </View>

          <View style={styles.tooltipStatsRow}>
            <View style={styles.tooltipStat}>
              <View style={[styles.indicatorDot, { backgroundColor: Colors.income }]} />
              <Text style={styles.tooltipLabel}>Thu:</Text>
              <Text style={styles.tooltipIncomeValue}>{formatCurrency(activePoint.income)}</Text>
            </View>

            <View style={styles.tooltipDivider} />

            <View style={styles.tooltipStat}>
              <View style={[styles.indicatorDot, { backgroundColor: Colors.expense }]} />
              <Text style={styles.tooltipLabel}>Chi:</Text>
              <Text style={styles.tooltipExpenseValue}>{formatCurrency(activePoint.expense)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* 3. Bar Chart Visualization */}
      <View style={styles.chartWrapper}>
        <View style={styles.barsContainer}>
          {chartData.map((item, idx) => {
            const isSelected = selectedIdx === idx;
            const incHeight = Math.max(8, (item.income / maxVal) * 110);
            const expHeight = Math.max(8, (item.expense / maxVal) * 110);

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.barColumn, isSelected && styles.barColumnSelected]}
                onPress={() => setSelectedIdx(idx)}
                activeOpacity={0.7}
              >
                <View style={styles.barsPair}>
                  {/* Inflow Bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: incHeight,
                        backgroundColor: Colors.income,
                        opacity: isSelected ? 1 : 0.85,
                      },
                    ]}
                  />
                  {/* Outflow Bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: expHeight,
                        backgroundColor: Colors.expense,
                        opacity: isSelected ? 1 : 0.85,
                      },
                    ]}
                  />
                </View>

                {/* X-axis Label */}
                <Text
                  style={[
                    styles.columnLabel,
                    isSelected && { color: Colors.primary, fontWeight: '700' },
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={styles.columnSubLabel}>{item.subLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Legend & Summary Badges */}
      <View style={styles.footerRow}>
        <View style={styles.legendGroup}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.income }]} />
            <Text style={styles.legendText}>Thu vào</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.expense }]} />
            <Text style={styles.legendText}>Chi ra</Text>
          </View>
        </View>

        <View style={styles.savingsRateBadge}>
          <MaterialIcons name="trending-up" size={14} color={Colors.income} />
          <Text style={styles.savingsRateText}>Tích lũy: {netSavingsRate}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  titleIconBox: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.full,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  tooltipCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tooltipTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tooltipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tooltipTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  netPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tooltipStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tooltipStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tooltipIncomeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.income,
  },
  tooltipExpenseValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.expense,
  },
  tooltipDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#CBD5E1',
  },
  chartWrapper: {
    height: 155,
    justifyContent: 'flex-end',
    paddingVertical: Spacing.xs,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 2,
    borderRadius: BorderRadius.md,
    paddingVertical: 4,
  },
  barColumnSelected: {
    backgroundColor: '#F0FDF4',
  },
  barsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: 6,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  columnLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  columnSubLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
  },
  legendGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  savingsRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  savingsRateText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
});
