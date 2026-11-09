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
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';
import { AuthApi } from '../api/authApi';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const performIsolatedLogin = async (userProfile: any) => {
    try {
      // 1. Cô lập dữ liệu: Nạp đúng dữ liệu của Account vào SQLite & Memory
      await switchActiveAccountDatabase(userProfile.id);

      // 2. Cập nhật Auth state trong Redux
      dispatch(setCurrentUser(userProfile));

      // 3. Nạp lại toàn bộ Redux slices theo tài khoản đó
      dispatch(loadTransactions());
      dispatch(loadBudgets());
      dispatch(loadWalletsAndJars());
      dispatch(loadRecurringAndDebts());
      dispatch(loadSimulationData());

      // 4. Vào màn hình chính (Main)
      navigation.replace('Main');
    } catch (err) {
      console.error('Login isolation error:', err);
      navigation.replace('Main');
    }
  };

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ email tài khoản.');
      return;
    }

    if (!cleanPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu đăng nhập.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // Xác thực kiểm tra bảo mật mật khẩu
    let targetProfile = mockUser;

    if (cleanEmail === 'admin@expensemate.com') {
      // Mật khẩu quản trị viên
      if (cleanPassword !== 'Admin123!' && cleanPassword !== 'admin' && cleanPassword !== 'Password123!') {
        setErrorMsg('Mật khẩu quản trị viên không chính xác. Vui lòng kiểm tra lại!');
        setLoading(false);
        return;
      }
      targetProfile = mockAdminUser;
    } else if (cleanEmail === 'user@expensemate.com') {
      // Mật khẩu khách hàng Nguyễn Văn An
      if (cleanPassword !== 'Password123!' && cleanPassword !== '123456') {
        setErrorMsg('Mật khẩu tài khoản không chính xác. Vui lòng kiểm tra lại!');
        setLoading(false);
        return;
      }
      targetProfile = mockUser2;
    } else if (cleanEmail === 'demo@expensemate.com') {
      // Mật khẩu khách hàng Nhựt Tân
      if (cleanPassword !== 'Password123!' && cleanPassword !== '123456') {
        setErrorMsg('Mật khẩu tài khoản không chính xác. Vui lòng kiểm tra lại!');
        setLoading(false);
        return;
      }
      targetProfile = mockUser;
    } else {
      // Tài khoản người dùng cá nhân khác
      if (cleanPassword.length < 6) {
        setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
        setLoading(false);
        return;
      }
      targetProfile = {
        ...mockUser,
        id: `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'USER',
      };
    }

    // Thử gọi backend API nếu có (timeout tối đa 800ms để offline vẫn mượt mà)
    try {
      const backendPromise = AuthApi.login(cleanEmail, cleanPassword);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 800)
      );
      await Promise.race([backendPromise, timeoutPromise]);
    } catch {
      // Chế độ ngoại tuyến hoặc backend offline: tiếp tục xác thực tài khoản cục bộ
    }

    await performIsolatedLogin(targetProfile);
    setLoading(false);
  };

  const handleGuestQuickMode = async () => {
    setLoading(true);
    await performIsolatedLogin(mockUser);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Logo & Header */}
        <View style={styles.headerSection}>
          <View style={styles.brandIcon}>
            <MaterialIcons name="account-balance-wallet" size={32} color={Colors.textWhite} />
          </View>
          <Text style={styles.title}>Chào mừng trở lại</Text>
          <Text style={styles.subtitle}>
            Đăng nhập để quản lý tài chính cá nhân thông minh và bảo mật.
          </Text>
        </View>

        {/* Error Notice */}
        {errorMsg && (
          <View style={styles.noticeBox}>
            <MaterialIcons name="error-outline" size={18} color={Colors.error} />
            <Text style={styles.noticeText}>{errorMsg}</Text>
          </View>
        )}

        {/* Clean Standard Login Form Card (Không lộ tài khoản người khác) */}
        <View style={styles.card}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email tài khoản</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="mail-outline"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {email ? (
                <TouchableOpacity onPress={() => setEmail('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="cancel" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Nhập mật khẩu của bạn"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons
                  name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Options Row: Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color={rememberMe ? Colors.primary : Colors.textMuted}
              />
              <Text style={styles.rememberMeText}>Ghi nhớ đăng nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPassText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Submit Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Đăng Nhập Vào Hệ Thống</Text>
            )}
          </TouchableOpacity>

          {/* Guest / Offline Mode */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestQuickMode}
            disabled={loading}
            activeOpacity={0.8}
          >
            <MaterialIcons name="flash-on" size={18} color={Colors.primary} />
            <Text style={styles.guestButtonText}>Trải nghiệm nhanh (Chế độ Khách)</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}> Đăng ký tài khoản mới</Text>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandIcon: {
    width: 62,
    height: 62,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 6,
    lineHeight: 18,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 8,
    marginBottom: Spacing.lg,
  },
  noticeText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
    flex: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: 2,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberMeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  forgotPassText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  primaryButton: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  primaryButtonText: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  guestButton: {
    height: 46,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  guestButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
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
