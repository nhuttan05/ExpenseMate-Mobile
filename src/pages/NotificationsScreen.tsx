import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { ScreenContainer } from '../components/layout/ScreenContainer';

interface NotificationsScreenProps {
  navigation: any;
}

interface NotificationItem {
  id: string;
  type: 'WARNING' | 'INCOME' | 'REMINDER' | 'AI';
  title: string;
  description: string;
  time: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  isRead: boolean;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const notifications: NotificationItem[] = [
    {
      id: 'nt_01',
      type: 'WARNING',
      title: 'Cảnh báo hạn mức ngân sách',
      description: 'Hạng mục "Ăn uống & Tiêu dùng" đã chạm 82% ngân sách tháng 11 (8.200.000 đ / 10.000.000 đ).',
      time: '15 phút trước',
      icon: 'warning',
      iconBg: '#FFDAD6',
      iconColor: Colors.error,
      isRead: false,
    },
    {
      id: 'nt_02',
      type: 'INCOME',
      title: 'Biến động số dư tài khoản',
      description: 'Đã nhận +35.000.000 đ từ Công ty Công nghệ FPT (Lương tháng 10).',
      time: 'Hôm qua, 09:15',
      icon: 'payments',
      iconBg: '#D1FAE5',
      iconColor: Colors.secondary,
      isRead: true,
    },
    {
      id: 'nt_03',
      type: 'AI',
      title: 'Gợi ý từ Trợ lý ExpenseMate AI',
      description: 'Tuần này bạn đã tiết kiệm được 15% so với cùng kỳ tháng trước nhờ giảm tần suất ăn ngoài.',
      time: '2 ngày trước',
      icon: 'auto-awesome',
      iconBg: '#EEF2FF',
      iconColor: Colors.primary,
      isRead: true,
    },
    {
      id: 'nt_04',
      type: 'REMINDER',
      title: 'Nhắc nhở hóa đơn định kỳ',
      description: 'Hóa đơn tiền nước và Internet sẽ được thanh toán tự động vào ngày 10/11/2026.',
      time: '3 ngày trước',
      icon: 'schedule',
      iconBg: '#FEF3C7',
      iconColor: '#B45309',
      isRead: true,
    },
  ];

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trung tâm Thông báo</Text>
        <TouchableOpacity>
          <Text style={styles.markAllText}>Đã đọc</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentPadding}>
        <View style={[styles.notifCard, Shadows.card]}>
          {notifications.map((item, index) => {
            const isLast = index === notifications.length - 1;
            return (
              <View
                key={item.id}
                style={[
                  styles.notifItem,
                  !isLast && styles.itemBorder,
                  !item.isRead && styles.unreadBg,
                ]}
              >
                <View style={[styles.notifIcon, { backgroundColor: item.iconBg }]}>
                  <MaterialIcons name={item.icon as any} size={22} color={item.iconColor} />
                </View>

                <View style={styles.notifContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifDesc}>{item.description}</Text>
                  <Text style={styles.notifTime}>{item.time}</Text>
                </View>
              </View>
            );
          })}
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
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  contentPadding: {
    padding: Spacing.lg,
  },
  notifCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  notifItem: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  unreadBg: {
    backgroundColor: '#FAF9FF',
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5FA',
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notifDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
});
