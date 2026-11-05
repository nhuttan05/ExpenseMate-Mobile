import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';
import { AuthApi } from '../api/authApi';

interface LoginScreenProps { navigation: any; }

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('demo@expensemate.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await AuthApi.login(email.trim(), password);
      navigation.replace('Main');
    } catch (error: any) {
      // Cho phép đăng nhập demo offline nếu backend chưa mở hoặc lỗi mạng
      if (email.trim().toLowerCase() === 'demo@expensemate.com' && (password === 'Password123!' || password === '123456')) {
        navigation.replace('Main');
        return;
      }
      const message = error?.response?.data?.error?.message || 'Không thể kết nối backend. Bạn có thể dùng tài khoản demo hoặc chế độ Khách bên dưới.';
      Alert.alert('Đăng nhập thất bại', message, [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Vào chế độ Khách', onPress: () => navigation.replace('Main') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    navigation.replace('Main');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.brandIcon}><MaterialIcons name="account-balance-wallet" size={34} color={Colors.textWhite} /></View>
      <Text style={styles.title}>Chào mừng trở lại</Text>
      <Text style={styles.subtitle}>Quản lý tài chính cá nhân đơn giản và thông minh.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={Colors.textMuted} secureTextEntry />
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}><Text style={styles.linkRight}>Quên mật khẩu?</Text></TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.guestButton} onPress={handleGuestMode}>
          <MaterialIcons name="flash-on" size={18} color={Colors.primary} />
          <Text style={styles.guestButtonText}>Trải nghiệm nhanh (Khách / Offline)</Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}><Text style={styles.link}> Đăng ký</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.demoBadge}>
        <Text style={styles.demoText}>Tài khoản Demo: <Text style={styles.demoBold}>demo@expensemate.com</Text> / <Text style={styles.demoBold}>Password123!</Text></Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: Spacing.xl },
  brandIcon: { width: 68, height: 68, borderRadius: BorderRadius.xl, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: Spacing.lg, ...Shadows.floating },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, ...Shadows.card },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  input: { height: 48, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, color: Colors.textPrimary, backgroundColor: Colors.surfaceContainerLow },
  linkRight: { color: Colors.primary, textAlign: 'right', fontWeight: '600', fontSize: 13, marginTop: Spacing.sm },
  primaryButton: { height: 50, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg },
  primaryButtonText: { color: Colors.textWhite, fontSize: 15, fontWeight: '800' },
  guestButton: { height: 46, backgroundColor: Colors.surfaceContainerLow, borderRadius: BorderRadius.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  guestButtonText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { color: Colors.textMuted, fontSize: 13 },
  link: { color: Colors.primary, fontWeight: '800', fontSize: 13 },
  demoBadge: { marginTop: Spacing.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surfaceContainerLow, borderRadius: BorderRadius.md, alignSelf: 'center' },
  demoText: { textAlign: 'center', color: Colors.textSecondary, fontSize: 12 },
  demoBold: { fontWeight: '700', color: Colors.primary },
});
