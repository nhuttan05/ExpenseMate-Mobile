import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';
import { AuthApi } from '../api/authApi';
import { showAppNotice } from '../utils/appNotice';
import { useAppDispatch } from '../redux/store';
import { setCurrentUser } from '../redux/slices/authSlice';
import { mockUser, mockUser2, mockAdminUser } from '../data/mockData';
import { switchActiveAccountDatabase } from '../services/database';
import { loadTransactions } from '../redux/slices/expenseSlice';
import { loadBudgets } from '../redux/slices/budgetSlice';
import { loadWalletsAndJars } from '../redux/slices/walletSlice';
import { loadRecurringAndDebts } from '../redux/slices/recurringSlice';
import { loadSimulationData } from '../redux/slices/simulationSlice';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('demo@expensemate.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);

  const performIsolatedLogin = async (userProfile: any) => {
    // 1. Cô lập dữ liệu: Nạp đúng bộ dữ liệu của Account này vào SQLite & Memory
    await switchActiveAccountDatabase(userProfile.id);

    // 2. Cập nhật Auth state trong Redux
    dispatch(setCurrentUser(userProfile));

    // 3. Nạp lại toàn bộ Redux slices
    dispatch(loadTransactions());
    dispatch(loadBudgets());
    dispatch(loadWalletsAndJars());
    dispatch(loadRecurringAndDebts());
    dispatch(loadSimulationData());

    // 4. Điều hướng
    if (userProfile.role === 'ADMIN') {
      navigation.replace('Admin');
    } else {
      navigation.replace('Main');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAppNotice('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      // Thử gọi backend API
      await AuthApi.login(email.trim(), password);
    } catch {
      // Nếu offline, tiếp tục với tài khoản cục bộ tương ứng
    }

    // Xác định đối tượng profile tương ứng với email
    let targetProfile = mockUser;
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin@expensemate.com') {
      targetProfile = mockAdminUser;
    } else if (cleanEmail === 'user@expensemate.com') {
      targetProfile = mockUser2;
    }

    await performIsolatedLogin(targetProfile);
    setLoading(false);
  };

  const handleQuickAccountSelect = (profile: any) => {
    setEmail(profile.email);
    setPassword(profile.role === 'ADMIN' ? 'Admin123!' : 'Password123!');
    performIsolatedLogin(profile);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandIcon}>
          <MaterialIcons name="account-balance-wallet" size={34} color={Colors.textWhite} />
        </View>
        <Text style={styles.title}>Chào mừng trở lại</Text>
        <Text style={styles.subtitle}>
          Hệ thống tài chính cá nhân đa tài khoản & phân quyền chuyên nghiệp.
        </Text>

        {/* 1-TAP ACCOUNT SELECTOR */}
        <Text style={styles.quickSelectLabel}>CHỌN NHANH VAI TRÒ ĐĂNG NHẬP:</Text>
        <View style={styles.quickAccountsRow}>
          {/* Account 1: Doanh Nhân Demo */}
          <TouchableOpacity
            style={[
              styles.quickCard,
              email === 'demo@expensemate.com' && styles.quickCardActive,
            ]}
            onPress={() => handleQuickAccountSelect(mockUser)}
            activeOpacity={0.8}
          >
            <View style={styles.quickRolePillUser}>
              <Text style={styles.quickRoleTextUser}>KHÁCH HÀNG 1</Text>
            </View>
            <Text style={styles.quickCardName}>Nhựt Tân</Text>
            <Text style={styles.quickCardSub}>125.8 triệu • 4 ví</Text>
          </TouchableOpacity>

          {/* Account 2: Khách Hàng Văn An */}
          <TouchableOpacity
            style={[
              styles.quickCard,
              email === 'user@expensemate.com' && styles.quickCardActive,
            ]}
            onPress={() => handleQuickAccountSelect(mockUser2)}
            activeOpacity={0.8}
          >
            <View style={styles.quickRolePillUser}>
              <Text style={styles.quickRoleTextUser}>KHÁCH HÀNG 2</Text>
            </View>
            <Text style={styles.quickCardName}>Văn An</Text>
            <Text style={styles.quickCardSub}>42.5 triệu • 2 ví</Text>
          </TouchableOpacity>

          {/* Account 3: Quản Trị Viên Admin */}
          <TouchableOpacity
            style={[
              styles.quickCard,
              email === 'admin@expensemate.com' && styles.quickCardActiveAdmin,
            ]}
            onPress={() => handleQuickAccountSelect(mockAdminUser)}
            activeOpacity={0.8}
          >
            <View style={styles.quickRolePillAdmin}>
              <Text style={styles.quickRoleTextAdmin}>ADMIN PRO</Text>
            </View>
            <Text style={styles.quickCardName}>Admin Hệ Thống</Text>
            <Text style={styles.quickCardSub}>Quản trị toàn sàn</Text>
          </TouchableOpacity>
        </View>

        {/* LOGIN FORM CARD */}
        <View style={styles.card}>
          <Text style={styles.label}>Email tài khoản</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.linkRight}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}> Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  brandIcon: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
    ...Shadows.floating,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  quickSelectLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
  quickAccountsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  quickCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  quickCardActiveAdmin: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  quickRolePillUser: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  quickRoleTextUser: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.primary,
  },
  quickRolePillAdmin: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  quickRoleTextAdmin: {
    fontSize: 8,
    fontWeight: '800',
    color: '#7C3AED',
  },
  quickCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quickCardSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceContainerLow,
    fontSize: 14,
  },
  linkRight: {
    color: Colors.primary,
    textAlign: 'right',
    fontWeight: '600',
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  primaryButton: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  primaryButtonText: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  link: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
});
