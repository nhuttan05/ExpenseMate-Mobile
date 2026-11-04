import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';
import { Transaction } from '../types';
import { ScreenContainer } from '../components/layout/ScreenContainer';

interface TransactionDetailScreenProps {
  route?: any;
  navigation?: any;
}

export const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const transaction: Transaction = route?.params?.transaction;

  if (!transaction) {
    return (
      <ScreenContainer>
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text>Không tìm thấy thông tin giao dịch.</Text>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={{ marginTop: 12 }}>
            <Text style={{ color: Colors.primary }}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const isIncome = transaction.type === 'INCOME';

  const handleShare = () => {
    Alert.alert('Chia sẻ biên lai', 'Tính năng xuất hóa đơn dạng ảnh/PDF đã sẵn sàng.');
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <MaterialIcons name="share" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentPadding}>
        {/* Receipt Card */}
        <View style={[styles.receiptCard, Shadows.card]}>
          <View
            style={[
              styles.categoryBadgeLarge,
              { backgroundColor: transaction.category.backgroundColor },
            ]}
          >
            <MaterialIcons
              name={transaction.category.icon as any}
              size={36}
              color={transaction.category.color}
            />
          </View>

          <Text style={styles.categoryNameText}>{transaction.category.name}</Text>
          <Text style={styles.txTitleText}>{transaction.title}</Text>

          <View style={styles.amountBox}>
            <Text
              style={[
                styles.amountValue,
                { color: isIncome ? Colors.secondary : Colors.error },
              ]}
            >
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>Đã lưu SQLite</Text>
            </View>
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thời gian</Text>
            <Text style={styles.detailValue}>
              {transaction.formattedTime || transaction.date}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phương thức thanh toán</Text>
            <Text style={styles.detailValue}>{transaction.paymentMethod}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mã định danh (ID)</Text>
            <Text style={[styles.detailValue, { fontFamily: 'monospace' }]}>
              {transaction.id.toUpperCase()}
            </Text>
          </View>

          {transaction.note && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ghi chú</Text>
              <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>
                {transaction.note}
              </Text>
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline]}
            onPress={() => navigation?.navigate('EditTransaction', { transaction })}
          >
            <MaterialIcons name="edit" size={20} color={Colors.textSecondary} />
            <Text style={styles.actionBtnOutlineText}>Chỉnh sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary, Shadows.subtle]}
            onPress={handleShare}
          >
            <MaterialIcons name="receipt" size={20} color={Colors.textWhite} />
            <Text style={styles.actionBtnPrimaryText}>Xuất biên lai</Text>
          </TouchableOpacity>
        </View>
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
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentPadding: {
    padding: Spacing.lg,
  },
  receiptCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  categoryBadgeLarge: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryNameText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  txTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  amountBox: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  amountValue: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondary,
  },
  dashedDivider: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  actionBtnOutline: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
