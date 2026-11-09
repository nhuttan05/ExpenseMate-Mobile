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

const AVAILABLE_ACCOUNTS = [
  {
    profile: mockUser,
    email: 'demo@expensemate.com',
    password: 'Password123!',
    label: 'Nhựt Tân (Khách hàng 1)',
    desc: 'Doanh nhân • 4 ví • 125.8 triệu',
    role: 'USER',
  },
  {
    profile: mockUser2,
    email: 'user@expensemate.com',
    password: 'Password123!',
    label: 'Nguyễn Văn An (Khách hàng 2)',
    desc: 'Văn phòng • 2 ví • 42.5 triệu',
    role: 'USER',
  },
  {
    profile: mockAdminUser,
    email: 'admin@expensemate.com',
    password: 'Admin123!',
    label: 'Quản Trị Viên Hệ Thống',
    desc: 'Admin Console Pro • Toàn quyền',
    role: 'ADMIN',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

      // 4. Luôn vào Main
      navigation.replace('Main');
    } catch (err) {
      console.error('Login isolation error:', err);
      navigation.replace('Main');
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      setNotice('Vui lòng nhập địa chỉ email.');
      return;
    }

    setLoading(true);
    setNotice(null);

    const cleanEmail = email.trim().toLowerCase();

    // Rút ngắn timeout kiểm tra backend (tối đa 800ms) để không bị đơ giao diện
    try {
      const backendPromise = AuthApi.login(cleanEmail, password);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 800)
      );
      await Promise.race([backendPromise, timeoutPromise]);
    } catch {
      // Tiếp tục với tài khoản cục bộ tương ứng (Offline-first)
    }

    // Xác định profile tài khoản
    let targetProfile = mockUser;
    if (cleanEmail === 'admin@expensemate.com' || cleanEmail.includes('admin')) {
      targetProfile = mockAdminUser;
    } else if (cleanEmail === 'user@expensemate.com' || cleanEmail.includes('user') || cleanEmail.includes('an')) {
      targetProfile = mockUser2;
    } else {
      targetProfile = {
        ...mockUser,
        email: cleanEmail,
      };
    }

    await performIsolatedLogin(targetProfile);
    setLoading(false);
  };

  // Chọn gợi ý tài khoản
  const handleSelectAccountSuggestion = (acc: typeof AVAILABLE_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setShowSuggestions(false);
    setNotice(null);
  };

  // Lọc gợi ý tài khoản theo chuỗi người dùng đang gõ
  const filteredSuggestions = AVAILABLE_ACCOUNTS.filter(
    (acc) =>
      !email.trim() ||
      acc.email.toLowerCase().includes(email.toLowerCase()) ||
      acc.label.toLowerCase().includes(email.toLowerCase())
  );

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
        {/* Brand Logo & Title */}
        <View style={styles.headerSection}>
          <View style={styles.brandIcon}>
            <MaterialIcons name="account-balance-wallet" size={32} color={Colors.textWhite} />
          </View>
          <Text style={styles.title}>Chào mừng trở lại</Text>
          <Text style={styles.subtitle}>
            Đăng nhập để quản lý tài chính thông minh và bảo mật.
          </Text>
        </View>

        {notice && (
          <View style={styles.noticeBox}>
            <MaterialIcons name="error-outline" size={16} color={Colors.error} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        )}

        {/* Form Card */}
        <View style={styles.card}>
          {/* Email Input Field */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Email tài khoản</Text>
              <TouchableOpacity
                onPress={() => setShowSuggestions(!showSuggestions)}
                style={styles.suggestionToggleBtn}
              >
                <MaterialIcons name="person-search" size={14} color={Colors.primary} />
                <Text style={styles.suggestionToggleText}>
                  {showSuggestions ? 'Ẩn gợi ý' : 'Gợi ý tài khoản'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (!showSuggestions && val.length > 0) setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Nhập email (ví dụ: demo@expensemate.com)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {email ? (
                <TouchableOpacity onPress={() => setEmail('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="cancel" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Smart Account Suggestions Dropdown (Chỉ hiện khi focus hoặc người dùng yêu cầu) */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <View style={[styles.suggestionsDropdown, Shadows.cardHover]}>
                <View style={styles.suggestionsHeader}>
                  <Text style={styles.suggestionsHeaderTitle}>TÀI KHOẢN GỢI Ý ĐĂNG NHẬP NHANH</Text>
                  <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                    <MaterialIcons name="close" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {filteredSuggestions.map((acc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectAccountSuggestion(acc)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.suggestionIconBox,
                        acc.role === 'ADMIN' ? { backgroundColor: '#F3E8FF' } : { backgroundColor: Colors.primaryLight },
                      ]}
                    >
                      <MaterialIcons
                        name={acc.role === 'ADMIN' ? 'admin-panel-settings' : 'person'}
                        size={18}
                        color={acc.role === 'ADMIN' ? '#7C3AED' : Colors.primary}
                      />
                    </View>

                    <View style={styles.suggestionContent}>
                      <View style={styles.suggestionTitleRow}>
                        <Text style={styles.suggestionLabel}>{acc.label}</Text>
                        <View
                          style={[
                            styles.suggestionRoleBadge,
                            acc.role === 'ADMIN' ? { backgroundColor: '#F3E8FF' } : { backgroundColor: '#ECFDF5' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.suggestionRoleBadgeText,
                              acc.role === 'ADMIN' ? { color: '#7C3AED' } : { color: Colors.primary },
                            ]}
                          >
                            {acc.role}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.suggestionEmail}>{acc.email}</Text>
                      <Text style={styles.suggestionDesc}>{acc.desc}</Text>
                    </View>

                    <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Password Input Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons
                  name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPassBtn}
          >
            <Text style={styles.forgotPassText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

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

          {/* Guest / Offline Mode Button */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => {
              setEmail('demo@expensemate.com');
              setPassword('Password123!');
              performIsolatedLogin(mockUser);
            }}
            disabled={loading}
            activeOpacity={0.8}
          >
            <MaterialIcons name="flash-on" size={18} color={Colors.primary} />
            <Text style={styles.guestButtonText}>Trải nghiệm nhanh (Khách / Offline)</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}> Đăng ký mới</Text>
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
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 6,
    marginBottom: Spacing.md,
  },
  noticeText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
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
    position: 'relative',
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
  },
  suggestionToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestionToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
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
  suggestionsDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.xl,
    marginTop: 6,
    overflow: 'hidden',
    zIndex: 999,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionsHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  suggestionIconBox: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  suggestionRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  suggestionRoleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  suggestionEmail: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  suggestionDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
    marginTop: 2,
  },
  forgotPassText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  primaryButton: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  primaryButtonText: {
    color: Colors.textWhite,
    fontSize: 14,
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
