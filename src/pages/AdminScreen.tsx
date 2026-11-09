import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import {
  toggleUserStatus,
  updateUserRole,
  switchViewMode,
  setCurrentUser,
} from '../redux/slices/authSlice';
import { switchActiveAccountDatabase } from '../services/database';
import { loadTransactions } from '../redux/slices/expenseSlice';
import { loadBudgets } from '../redux/slices/budgetSlice';
import { loadWalletsAndJars } from '../redux/slices/walletSlice';
import { loadRecurringAndDebts } from '../redux/slices/recurringSlice';
import { loadSimulationData } from '../redux/slices/simulationSlice';
import { formatCurrency } from '../utils/formatters';

interface AdminScreenProps {
  navigation: any;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { currentUser, usersList, auditLogs } = useAppSelector((state) => state.auth);

  // Tabs in Admin: USERS | JARS_CONFIG | AUDIT_LOGS | SERVER_HEALTH
  const [activeTab, setActiveTab] = useState<'USERS' | 'JARS_CONFIG' | 'AUDIT_LOGS' | 'SYSTEM'>('USERS');

  // JARS Config State
  const [warningThreshold, setWarningThreshold] = useState('80');
  const [autoLockPolicy, setAutoLockPolicy] = useState(true);

  // Search User State
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Switch User (Login As / Impersonate with full data isolation)
  const handleSwitchToUserAccount = async (targetUser: any) => {
    Alert.alert(
      'Chuyển đổi tài khoản',
      `Bạn có muốn đăng nhập vào không gian làm việc của "${targetUser.name}" (${targetUser.email})? Toàn bộ giao dịch và số dư ví sẽ được cô lập theo đúng tài khoản này.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chuyển Đổi',
          style: 'default',
          onPress: async () => {
            await switchActiveAccountDatabase(targetUser.id);
            dispatch(setCurrentUser(targetUser));
            dispatch(loadTransactions());
            dispatch(loadBudgets());
            dispatch(loadWalletsAndJars());
            dispatch(loadRecurringAndDebts());
            dispatch(loadSimulationData());
            navigation.navigate('Main');
          },
        },
      ]
    );
  };

  const handleToggleLock = (userId: string, currentStatus: string) => {
    const actionText = currentStatus === 'ACTIVE' ? 'KHÓA' : 'MỞ KHÓA';
    Alert.alert(
      `Xác nhận ${actionText}`,
      `Bạn có chắc chắn muốn ${actionText.toLowerCase()} tài khoản này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: actionText,
          style: currentStatus === 'ACTIVE' ? 'destructive' : 'default',
          onPress: () => dispatch(toggleUserStatus(userId)),
        },
      ]
    );
  };

  const handleChangeRole = (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    Alert.alert(
      'Thay đổi vai trò (RBAC)',
      `Chuyển vai trò tài khoản thành "${nextRole}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận đổi',
          onPress: () => dispatch(updateUserRole({ userId, role: nextRole })),
        },
      ]
    );
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScreenContainer>
      {/* 1. ADMIN HEADER */}
      <View style={styles.adminHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadge}>
            <MaterialIcons name="admin-panel-settings" size={14} color="#FFF" />
            <Text style={styles.adminBadgeText}>ADMIN CONSOLE PRO</Text>
          </View>
          <Text style={styles.headerTitle}>Hệ Thống Quản Trị</Text>
        </View>

        <TouchableOpacity
          style={styles.previewBtn}
          onPress={() => {
            dispatch(switchViewMode('USER'));
            navigation.navigate('Main');
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="visibility" size={16} color={Colors.primary} />
          <Text style={styles.previewBtnText}>Xem Góc Độ Khách Hàng</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 2. BENTO SYSTEM HEALTH PULSE */}
        <View style={styles.bentoGrid}>
          {/* Bento Card 1: Postgres Host Port */}
          <View style={[styles.bentoMetricCard, Shadows.card]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>DOCKER POSTGRES</Text>
              <View style={styles.liveIndicator}>
                <View style={[styles.dotLive, { backgroundColor: Colors.income }]} />
                <Text style={styles.dotLiveText}>5433:5432</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>ONLINE</Text>
            <Text style={styles.metricSub}>Cơ sở dữ liệu đám mây hoạt động</Text>
          </View>

          {/* Bento Card 2: Server API */}
          <View style={[styles.bentoMetricCard, Shadows.card]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>API BACKEND</Text>
              <View style={styles.liveIndicator}>
                <View style={[styles.dotLive, { backgroundColor: Colors.income }]} />
                <Text style={styles.dotLiveText}>3000</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>14 ms</Text>
            <Text style={styles.metricSub}>Độ trễ phản hồi cực thấp</Text>
          </View>

          {/* Bento Card 3: Users Count */}
          <View style={[styles.bentoMetricCard, Shadows.card]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>TÀI KHOẢN HỆ THỐNG</Text>
              <MaterialIcons name="people" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.metricValue}>{usersList.length} Accounts</Text>
            <Text style={styles.metricSub}>Đã phân lập dữ liệu Multi-Tenant</Text>
          </View>

          {/* Bento Card 4: System Volume */}
          <View style={[styles.bentoMetricCard, Shadows.card]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>QUY MÔ TOÀN SÀN</Text>
              <MaterialIcons name="auto-graph" size={18} color={Colors.income} />
            </View>
            <Text style={styles.metricValue}>12.8 TỶ ₫</Text>
            <Text style={styles.metricSub}>Tổng lưu lượng dòng tiền quản lý</Text>
          </View>
        </View>

        {/* 3. NAVIGATION TABS */}
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'USERS' && styles.tabNavBtnActive]}
            onPress={() => setActiveTab('USERS')}
          >
            <MaterialIcons
              name="manage-accounts"
              size={18}
              color={activeTab === 'USERS' ? '#FFF' : Colors.textSecondary}
            />
            <Text
              style={[styles.tabNavText, activeTab === 'USERS' && styles.tabNavTextActive]}
            >
              Người Dùng ({usersList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'JARS_CONFIG' && styles.tabNavBtnActive]}
            onPress={() => setActiveTab('JARS_CONFIG')}
          >
            <MaterialIcons
              name="tune"
              size={18}
              color={activeTab === 'JARS_CONFIG' ? '#FFF' : Colors.textSecondary}
            />
            <Text
              style={[styles.tabNavText, activeTab === 'JARS_CONFIG' && styles.tabNavTextActive]}
            >
              Cấu Hình 6 Hũ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'AUDIT_LOGS' && styles.tabNavBtnActive]}
            onPress={() => setActiveTab('AUDIT_LOGS')}
          >
            <MaterialIcons
              name="history"
              size={18}
              color={activeTab === 'AUDIT_LOGS' ? '#FFF' : Colors.textSecondary}
            />
            <Text
              style={[styles.tabNavText, activeTab === 'AUDIT_LOGS' && styles.tabNavTextActive]}
            >
              Nhật Ký Bảo Mật
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* TAB 1: QUẢN LÝ NGƯỜI DÙNG & CÔ LẬP ACCOUNT */}
        {/* ======================================================== */}
        {activeTab === 'USERS' && (
          <View style={styles.tabContentSection}>
            <View style={styles.searchRow}>
              <MaterialIcons name="search" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm tài khoản theo tên hoặc email..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.noticeIsolationBox}>
              <MaterialIcons name="security" size={18} color="#006C49" />
              <Text style={styles.noticeIsolationText}>
                Cơ chế Cô lập dữ liệu: Dữ liệu giao dịch & số dư ví thuộc tài khoản nào chỉ được hiển thị đúng khi đăng nhập tài khoản đó.
              </Text>
            </View>

            {filteredUsers.map((item) => {
              const isCurrent = item.id === currentUser.id;
              const isLocked = item.status === 'LOCKED';

              return (
                <View key={item.id} style={[styles.userCard, Shadows.card]}>
                  <View style={styles.userCardTopRow}>
                    <Image source={{ uri: item.avatarUrl }} style={styles.userAvatar} />
                    <View style={styles.userInfoCol}>
                      <View style={styles.userTitleRow}>
                        <Text style={styles.userNameText}>{item.name}</Text>
                        {isCurrent && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Đang Đăng Nhập</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.userEmailText}>{item.email}</Text>
                      <Text style={styles.userJoinText}>
                        Gia nhập: {item.joinedDate} • {item.walletsCount} ví • {item.transactionsCount} giao dịch
                      </Text>
                    </View>

                    <View style={styles.statusCol}>
                      <View
                        style={[
                          styles.rolePill,
                          item.role === 'ADMIN' ? styles.roleAdmin : styles.roleUser,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rolePillText,
                            item.role === 'ADMIN' ? { color: '#7C3AED' } : { color: Colors.primary },
                          ]}
                        >
                          {item.role}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statePill,
                          isLocked ? styles.stateLocked : styles.stateActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statePillText,
                            isLocked ? { color: Colors.error } : { color: Colors.income },
                          ]}
                        >
                          {isLocked ? 'ĐÃ KHÓA' : 'HOẠT ĐỘNG'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions for this user */}
                  <View style={styles.userActionsRow}>
                    <TouchableOpacity
                      style={styles.actionPillBtn}
                      onPress={() => handleSwitchToUserAccount(item)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="login" size={16} color={Colors.primary} />
                      <Text style={styles.actionPillText}>Đăng nhập vào Account này</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionPillBtn, { borderColor: '#E2E8F0' }]}
                      onPress={() => handleChangeRole(item.id, item.role)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="swap-horiz" size={16} color={Colors.textSecondary} />
                      <Text style={[styles.actionPillText, { color: Colors.textSecondary }]}>
                        {item.role === 'ADMIN' ? 'Hạ quyền User' : 'Gán quyền Admin'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionPillBtn,
                        isLocked ? { borderColor: Colors.income } : { borderColor: Colors.error },
                      ]}
                      onPress={() => handleToggleLock(item.id, item.status)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons
                        name={isLocked ? 'lock-open' : 'lock'}
                        size={16}
                        color={isLocked ? Colors.income : Colors.error}
                      />
                      <Text
                        style={[
                          styles.actionPillText,
                          isLocked ? { color: Colors.income } : { color: Colors.error },
                        ]}
                      >
                        {isLocked ? 'Mở khóa' : 'Khóa'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CẤU HÌNH QUY TẮC 6 CHIẾC LỌ TOÀN CỤC */}
        {/* ======================================================== */}
        {activeTab === 'JARS_CONFIG' && (
          <View style={styles.tabContentSection}>
            <View style={[styles.configCard, Shadows.card]}>
              <Text style={styles.configCardTitle}>TỶ LỆ PHÂN BỔ 6 CHIẾC LỌ (MẶC ĐỊNH HỆ THỐNG)</Text>
              <Text style={styles.configCardSub}>
                Cấu hình tham số chuẩn phân bổ thu nhập cho toàn bộ người dùng mới gia nhập ExpenseMate.
              </Text>

              {[
                { code: 'NEC', name: 'Nhu cầu thiết yếu', rate: '55%', color: '#0284C7' },
                { code: 'FFA', name: 'Tự do tài chính & Đầu tư', rate: '10%', color: '#059669' },
                { code: 'LTSS', name: 'Tiết kiệm mua sắm dài hạn', rate: '10%', color: '#7C3AED' },
                { code: 'EDU', name: 'Học vấn & Phát triển', rate: '10%', color: '#D97706' },
                { code: 'PLAY', name: 'Hưởng thụ & Giải trí', rate: '10%', color: '#EC4899' },
                { code: 'GIVE', name: 'Cho đi & Hiếu hỉ', rate: '5%', color: '#10B981' },
              ].map((jar) => (
                <View key={jar.code} style={styles.jarConfigRow}>
                  <View style={[styles.jarConfigDot, { backgroundColor: jar.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jarConfigName}>{jar.name}</Text>
                    <Text style={styles.jarConfigCode}>Mã tham chiếu: {jar.code}</Text>
                  </View>
                  <View style={styles.jarRateBadge}>
                    <Text style={styles.jarRateText}>{jar.rate}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.configCard, Shadows.card, { marginTop: 16 }]}>
              <Text style={styles.configCardTitle}>NGƯỠNG CẢNH BÁO BỘI CHI TỰ ĐỘNG</Text>
              <Text style={styles.configCardSub}>
                Khi hũ chi tiêu vượt quá ngưỡng này, hệ thống sẽ tự động đổi màu cảnh báo đỏ san hô và gửi thông báo cho người dùng.
              </Text>

              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Ngưỡng kích hoạt cảnh báo:</Text>
                <View style={styles.thresholdInputBox}>
                  <TextInput
                    style={styles.thresholdInput}
                    value={warningThreshold}
                    onChangeText={setWarningThreshold}
                    keyboardType="numeric"
                  />
                  <Text style={styles.thresholdPercent}>%</Text>
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Chính sách tự động bảo vệ khi vượt hạn mức</Text>
                  <Text style={styles.switchSub}>Nhắc nhở người dùng điều chuyển tiền từ Hũ PLAY sang NEC</Text>
                </View>
                <Switch
                  value={autoLockPolicy}
                  onValueChange={setAutoLockPolicy}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              </View>

              <TouchableOpacity
                style={styles.saveConfigBtn}
                onPress={() => Alert.alert('Thành công', 'Đã lưu và cập nhật cấu hình 6 Chiếc Lọ toàn cục!')}
                activeOpacity={0.85}
              >
                <MaterialIcons name="save" size={18} color="#FFF" />
                <Text style={styles.saveConfigBtnText}>Lưu Thay Đổi Cấu Hình</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 3: NHẬT KÝ BẢO MẬT & AUDIT LOGS */}
        {/* ======================================================== */}
        {activeTab === 'AUDIT_LOGS' && (
          <View style={styles.tabContentSection}>
            <View style={styles.auditHeaderRow}>
              <Text style={styles.auditHeaderTitle}>NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOGS)</Text>
              <Text style={styles.auditCountText}>{auditLogs.length} sự kiện</Text>
            </View>

            {auditLogs.map((log) => {
              const isWarning = log.status === 'WARNING';
              return (
                <View key={log.id} style={[styles.logCard, Shadows.card]}>
                  <View style={styles.logTopRow}>
                    <View style={styles.logCategoryTag}>
                      <MaterialIcons
                        name={log.category === 'SECURITY' ? 'security' : log.category === 'AUTH' ? 'key' : 'settings'}
                        size={14}
                        color={isWarning ? Colors.error : Colors.primary}
                      />
                      <Text style={[styles.logCategoryText, isWarning && { color: Colors.error }]}>
                        {log.category}
                      </Text>
                    </View>
                    <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                  </View>

                  <Text style={styles.logActionTitle}>{log.action}</Text>
                  <Text style={styles.logDetailsText}>{log.details}</Text>
                  <Text style={styles.logActorText}>Tài khoản: {log.actorEmail}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  adminHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    gap: 4,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  previewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  content: {
    padding: Spacing.lg,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bentoMetricCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotLiveText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metricSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tabNavRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 4,
    gap: 4,
    marginBottom: Spacing.lg,
  },
  tabNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  tabNavBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabNavTextActive: {
    color: '#FFF',
  },
  tabContentSection: {
    gap: Spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  noticeIsolationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  noticeIsolationText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
    lineHeight: 16,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.borderEmerald,
  },
  userInfoCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  currentBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  userEmailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  userJoinText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  roleAdmin: {
    backgroundColor: '#F3E8FF',
  },
  roleUser: {
    backgroundColor: Colors.primaryLight,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  stateActive: {
    backgroundColor: '#ECFDF5',
  },
  stateLocked: {
    backgroundColor: '#FEE2E2',
  },
  statePillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  userActionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: Spacing.sm,
  },
  actionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },

  // JARS Config Styles
  configCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  configCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  configCardSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  jarConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: Spacing.sm,
  },
  jarConfigDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  jarConfigName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  jarConfigCode: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  jarRateBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  jarRateText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  thresholdLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  thresholdInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thresholdInput: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    width: 36,
    textAlign: 'center',
  },
  thresholdPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  switchSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  saveConfigBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.lg,
  },
  saveConfigBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Audit Log Styles
  auditHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  auditHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  auditCountText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  logCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logCategoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  logTimestamp: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  logActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  logDetailsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logActorText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
