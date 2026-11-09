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
import { registerNewUser } from '../redux/slices/authSlice';
import { switchActiveAccountDatabase } from '../services/database';
import { loadTransactions } from '../redux/slices/expenseSlice';
import { loadBudgets } from '../redux/slices/budgetSlice';
import { loadWalletsAndJars } from '../redux/slices/walletSlice';
import { loadRecurringAndDebts } from '../redux/slices/recurringSlice';
import { loadSimulationData } from '../redux/slices/simulationSlice';
import { UserProfile } from '../types';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    // 1. Kiểm tra họ và tên
    if (!cleanName) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    // 2. Kiểm tra email
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    // 3. Kiểm tra độ dài mật khẩu
    if (cleanPassword.length < 6) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    // 4. Kiểm tra xác nhận mật khẩu lần 2 (BẮT BUỘC)
    if (!cleanConfirm) {
      setErrorMsg('Vui lòng nhập lại mật khẩu lần 2 để xác nhận.');
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setErrorMsg('Mật khẩu xác nhận lần 2 không trùng khớp. Vui lòng kiểm tra lại!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // Thử gọi backend Docker API (timeout tối đa 800ms để offline-first luôn mượt mà)
    try {
      const backendPromise = AuthApi.register(cleanName, cleanEmail, cleanPassword);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 800)
      );
      await Promise.race([backendPromise, timeoutPromise]);
    } catch {
      // Offline fallback: tiếp tục tạo tài khoản cục bộ an toàn
    }

    try {
      const newUserId = `usr_${Date.now()}`;
      const newProfile: UserProfile = {
        id: newUserId,
        name: cleanName,
        email: cleanEmail,
        role: 'USER',
        tier: 'Người Dùng Mới',
        avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
        totalBalance: 0,
        monthlyIncome: 20000000,
        monthlyExpense: 10000000,
        status: 'ACTIVE',
        joinedDate: new Date().toLocaleDateString('vi-VN'),
        transactionsCount: 0,
        walletsCount: 1,
        isDarkMode: false,
      };

      // 1. Khởi tạo database và cô lập dữ liệu cho tài khoản mới
      await switchActiveAccountDatabase(newUserId);

      // 2. Lưu tài khoản mới vào Redux
      dispatch(registerNewUser(newProfile));

      // 3. Nạp lại toàn bộ slice dữ liệu
      dispatch(loadTransactions());
      dispatch(loadBudgets());
      dispatch(loadWalletsAndJars());
      dispatch(loadRecurringAndDebts());
      dispatch(loadSimulationData());

      // 4. Vào màn hình chính
      navigation.replace('Main');
    } catch (err) {
      console.error('Lỗi khởi tạo tài khoản mới:', err);
      navigation.replace('Main');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordsMatching =
    confirmPassword.length > 0 && password === confirmPassword;
  const isPasswordsMismatching =
    confirmPassword.length > 0 && password !== confirmPassword;

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
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="arrow-back-ios" size={20} color={Colors.textPrimary} />
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.headerSection}>
          <View style={styles.brandIcon}>
            <MaterialIcons name="person-add" size={30} color={Colors.textWhite} />
          </View>
          <Text style={styles.title}>Tạo tài khoản mới</Text>
          <Text style={styles.subtitle}>
            Bắt đầu quản lý tài chính cá nhân thông minh và bảo vệ dữ liệu riêng tư.
          </Text>
        </View>

        {/* Error Notice */}
        {errorMsg && (
          <View style={styles.noticeBox}>
            <MaterialIcons name="error-outline" size={20} color={Colors.error} />
            <Text style={styles.noticeText}>{errorMsg}</Text>
          </View>
        )}

        {/* Registration Card Form */}
        <View style={styles.card}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên của bạn</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="person-outline"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ví dụ: Nguyễn Văn An"
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ Email</Text>
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
                placeholder="Tối thiểu 6 ký tự"
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

          {/* Confirm Password Input (Xác nhận lại mật khẩu lần 2) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Xác nhận mật khẩu (Lần 2)</Text>
              {isPasswordsMatching && (
                <View style={styles.matchBadgeSuccess}>
                  <MaterialIcons name="check-circle" size={13} color="#166534" />
                  <Text style={styles.matchBadgeTextSuccess}>Trùng khớp</Text>
                </View>
              )}
              {isPasswordsMismatching && (
                <View style={styles.matchBadgeWarning}>
                  <MaterialIcons name="info" size={13} color="#B45309" />
                  <Text style={styles.matchBadgeTextWarning}>Chưa khớp</Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.inputContainer,
                isPasswordsMatching && { borderColor: '#10B981' },
                isPasswordsMismatching && { borderColor: '#F59E0B' },
              ]}
            >
              <MaterialIcons
                name="verified-user"
                size={20}
                color={
                  isPasswordsMatching
                    ? '#10B981'
                    : isPasswordsMismatching
                    ? '#F59E0B'
                    : Colors.textMuted
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Nhập lại mật khẩu lần 2"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!isConfirmPasswordVisible}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons
                  name={isConfirmPasswordVisible ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Register Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Đăng Ký Tài Khoản</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Đã có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}> Đăng nhập ngay</Text>
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.floating,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
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
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  matchBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  matchBadgeTextSuccess: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  matchBadgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  matchBadgeTextWarning: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
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
  primaryButton: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  primaryButtonText: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
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