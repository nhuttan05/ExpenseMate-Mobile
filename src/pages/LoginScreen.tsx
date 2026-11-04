import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';

interface LoginScreenProps { navigation: any; }

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
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
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}><Text style={styles.primaryButtonText}>Đăng nhập</Text></TouchableOpacity>
        <View style={styles.footerRow}><Text style={styles.footerText}>Chưa có tài khoản?</Text><TouchableOpacity onPress={() => navigation.navigate('Register')}><Text style={styles.link}> Đăng ký</Text></TouchableOpacity></View>
      </View>
      <Text style={styles.demoText}>Demo local • Dữ liệu được lưu trên thiết bị</Text>
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
  primaryButton: { height: 50, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  primaryButtonText: { color: Colors.textWhite, fontSize: 15, fontWeight: '800' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { color: Colors.textMuted, fontSize: 13 },
  link: { color: Colors.primary, fontWeight: '800', fontSize: 13 },
  demoText: { textAlign: 'center', color: Colors.textMuted, fontSize: 11, marginTop: Spacing.lg },
});
