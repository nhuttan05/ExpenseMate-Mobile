import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { useAppSelector } from '../redux/store';
import { formatCurrency } from '../utils/formatters';

interface StatisticsScreenProps { navigation?: any; }

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ navigation }) => {
  const { transactions, monthlyIncome, monthlyExpense } = useAppSelector((state) => state.expense);
  const stats = useMemo(() => {
    const expenseTransactions = transactions.filter((item) => item.type === 'EXPENSE');
    const totals = expenseTransactions.reduce<Record<string, number>>((result, item) => { result[item.category.name] = (result[item.category.name] || 0) + item.amount; return result; }, {});
    return Object.entries(totals).sort(([, a], [, b]) => b - a).map(([name, amount]) => ({ name, amount }));
  }, [transactions]);
  const max = stats[0]?.amount || 1;
  const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0;

  return (
    <ScreenContainer>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation?.goBack()}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></TouchableOpacity><Text style={styles.headerTitle}>Thống kê chi tiêu</Text><View style={{ width: 24 }} /></View>
      <View style={styles.content}>
        <View style={styles.summaryCard}><Text style={styles.summaryTitle}>TỔNG QUAN THÁNG NÀY</Text><View style={styles.summaryRow}><View><Text style={styles.summaryLabel}>Tổng thu</Text><Text style={[styles.summaryValue, { color: Colors.secondary }]}>{formatCurrency(monthlyIncome)}</Text></View><View><Text style={styles.summaryLabel}>Tổng chi</Text><Text style={[styles.summaryValue, { color: Colors.error }]}>{formatCurrency(monthlyExpense)}</Text></View><View><Text style={styles.summaryLabel}>Tiết kiệm</Text><Text style={[styles.summaryValue, { color: Colors.primary }]}>{savingsRate}%</Text></View></View></View>
        <View style={[styles.chartCard, Shadows.card]}><Text style={styles.cardTitle}>Chi theo danh mục</Text>{stats.length === 0 ? <Text style={styles.empty}>Chưa có dữ liệu chi tiêu.</Text> : stats.map((item) => <View key={item.name} style={styles.barRow}><View style={styles.barLabel}><Text style={styles.categoryName}>{item.name}</Text><Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text></View><View style={styles.track}><View style={[styles.bar, { width: `${Math.max((item.amount / max) * 100, 4)}%` }]} /></View></View>)}</View>
        {stats[0] && <View style={styles.insight}><MaterialIcons name="auto-awesome" size={22} color={Colors.primary} /><Text style={styles.insightText}>Khoản chi lớn nhất là <Text style={styles.bold}>{stats[0].name}</Text>, chiếm {Math.round((stats[0].amount / Math.max(monthlyExpense, 1)) * 100)}% tổng chi tháng này.</Text></View>}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: { height: 56, paddingHorizontal: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F3F9' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Spacing.lg },
  summaryCard: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  summaryTitle: { color: '#DCD8FF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.lg },
  summaryLabel: { color: '#DCD8FF', fontSize: 12 },
  summaryValue: { color: Colors.textWhite, fontSize: 16, fontWeight: '800', marginTop: 4 },
  chartCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg },
  cardTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: Spacing.lg },
  barRow: { marginBottom: Spacing.lg },
  barLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  categoryName: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  categoryAmount: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  track: { height: 10, backgroundColor: Colors.surfaceContainerLow, borderRadius: BorderRadius.full, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  empty: { color: Colors.textMuted, paddingVertical: Spacing.xl },
  insight: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.lg },
  insightText: { flex: 1, color: Colors.onPrimaryFixed, lineHeight: 19, fontSize: 13 },
  bold: { fontWeight: '800' },
});
