import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { setFilterType, setSearchQuery } from '../redux/slices/expenseSlice';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AnimatedCard } from '../components/ui/AnimatedCard';

interface TransactionsScreenProps {
  navigation: any;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { transactions, filterType, searchQuery } = useAppSelector((state) => state.expense);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <MaterialIcons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentPadding}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên, danh mục, ghi chú..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={(text) => dispatch(setSearchQuery(text))}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => dispatch(setSearchQuery(''))}>
              <MaterialIcons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabItem, filterType === 'ALL' && styles.tabItemActive]}
            onPress={() => dispatch(setFilterType('ALL'))}
          >
            <Text style={[styles.tabText, filterType === 'ALL' && styles.tabTextActive]}>
              Tất cả ({transactions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, filterType === 'EXPENSE' && styles.tabItemActive]}
            onPress={() => dispatch(setFilterType('EXPENSE'))}
          >
            <Text style={[styles.tabText, filterType === 'EXPENSE' && styles.tabTextActive]}>
              Khoản chi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, filterType === 'INCOME' && styles.tabItemActive]}
            onPress={() => dispatch(setFilterType('INCOME'))}
          >
            <Text style={[styles.tabText, filterType === 'INCOME' && styles.tabTextActive]}>
              Khoản thu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Summary Row */}
        <View style={[styles.summaryContainer, Shadows.subtle]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng thu</Text>
            <Text style={[styles.summaryVal, { color: Colors.secondary }]}>
              +{formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng chi</Text>
            <Text style={[styles.summaryVal, { color: Colors.error }]}>
              -{formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={48} color={Colors.outlineVariant} />
            <Text style={styles.emptyTitle}>Không tìm thấy giao dịch nào</Text>
            <Text style={styles.emptySubtitle}>
              Thử tìm kiếm với từ khóa khác hoặc nhấn nút + để ghi nhận giao dịch mới
            </Text>
          </View>
        ) : (
          <AnimatedCard delay={100} style={[styles.listCard, Shadows.card]}>
            {filteredTransactions.map((tx, index) => {
              const isIncome = tx.type === 'INCOME';
              const isLast = index === filteredTransactions.length - 1;
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
          </AnimatedCard>
        )}

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
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textWhite,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF8',
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  listCard: {
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
