import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useAppSelector } from '../redux/store';
import { ApiService } from '../services/apiService';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { mockUser } from '../data/mockData';
import { AuthApi } from '../api/authApi';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { transactions } = useAppSelector((state) => state.expense);

  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    try {
      const res = await ApiService.syncLocalToCloud(transactions);
      Alert.alert(
        'Đồng bộ Axios thành công',
        `Đã đồng bộ ${res.count} giao dịch từ SQLite lên hệ thống lưu trữ qua Axios.`
      );
    } catch {
      Alert.alert('Thông báo', 'Đã lưu trữ dữ liệu an toàn trên thiết bị.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: async () => { await AuthApi.logout(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } },
    ]);
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ & Cài đặt</Text>
        <TouchableOpacity style={styles.headerIconBtn} onPress={handleSyncCloud} disabled={isSyncing}>
          <MaterialIcons
            name={isSyncing ? 'sync' : 'cloud-upload'}
            size={22}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.contentPadding}>
        {/* User Profile Card */}
        <View style={[styles.profileCard, Shadows.card]}>
          <Image source={{ uri: mockUser.avatarUrl }} style={styles.avatarLarge} />
          <View style={styles.profileDetails}>
            <View style={styles.badgeRow}>
              <Text style={styles.userName}>{mockUser.name}</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{mockUser.tier}</Text>
              </View>
            </View>
            <Text style={styles.userEmail}>{mockUser.email}</Text>
            <Text style={styles.phoneText}>+84 987 654 321</Text>
          </View>
          <TouchableOpacity style={styles.editProfileBtn}>
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Setting Group 1: Cloud & API */}
        <View style={styles.groupWrapper}>
          <Text style={styles.groupTitle}>KẾT NỐI API & DATABASE</Text>
          <View style={[styles.menuCard, Shadows.card]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleSyncCloud}>
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <MaterialIcons name="cloud-sync" size={20} color={Colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Đồng bộ API với Axios</Text>
                <Text style={styles.menuSubText}>{transactions.length} giao dịch trong SQLite</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                const rates = await ApiService.fetchExchangeRates();
                Alert.alert(
                  'Tỷ giá ngoại tệ (Axios API)',
                  `1 USD = ${rates.USD ? rates.USD.toLocaleString('vi-VN') : '25.450'} VND\n1 EUR = ${rates.EUR ? rates.EUR.toLocaleString('vi-VN') : '27.100'} VND`
                );
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                <MaterialIcons name="currency-exchange" size={20} color={Colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Tra cứu tỷ giá ngoại tệ</Text>
                <Text style={styles.menuSubText}>Cập nhật qua Axios Network</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Setting Group 2: Bảo mật */}
        <View style={styles.groupWrapper}>
          <Text style={styles.groupTitle}>BẢO MẬT & TIỆN ÍCH</Text>
          <View style={[styles.menuCard, Shadows.card]}>
            <View style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                <MaterialIcons name="fingerprint" size={20} color={Colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Xác thực FaceID / Vân tay</Text>
                <Text style={styles.menuSubText}>Bảo mật khi mở ứng dụng</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            <View style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: '#FFE4E6' }]}>
                <MaterialIcons name="notifications-active" size={20} color="#BE123C" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Thông báo cảnh báo ngân sách</Text>
                <Text style={styles.menuSubText}>Khi vượt 80% hạn mức</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            <View style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                <MaterialIcons name="dark-mode" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Giao diện tối (Dark Mode)</Text>
                <Text style={styles.menuSubText}>Tùy chỉnh theo hệ điều hành</Text>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>
          </View>
        </View>

        <View style={styles.groupWrapper}>
          <Text style={styles.groupTitle}>QUẢN LÝ TÀI CHÍNH</Text>
          <View style={[styles.menuCard, Shadows.card]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Statistics')}>
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}><MaterialIcons name="bar-chart" size={20} color={Colors.primary} /></View>
              <View style={styles.menuContent}><Text style={styles.menuText}>Thống kê chi tiêu</Text><Text style={styles.menuSubText}>Biểu đồ và phân tích theo danh mục</Text></View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Categories')}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}><MaterialIcons name="category" size={20} color="#D97706" /></View>
              <View style={styles.menuContent}><Text style={styles.menuText}>Quản lý danh mục</Text><Text style={styles.menuSubText}>Phân loại khoản thu và chi</Text></View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>
          ExpenseMate v1.0.0 • SQLite • Redux Toolkit • Axios • Tamagui
        </Text>
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
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  profileDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tierBadge: {
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onPrimaryFixed,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupWrapper: {
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F7FB',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  menuSubText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
  },
});
