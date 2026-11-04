import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';
import { AuthApi } from '../api/authApi';

interface ForgotPasswordScreenProps { navigation: any; }

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const handleReset = async () => {
    if (!email.trim()) { Alert.alert('Thiếu email', 'Vui lòng nhập email đã đăng ký.'); return; }
    try {
      const message = await AuthApi.requestPasswordReset(email.trim());
      Alert.alert('Đã gửi hướng dẫn', message, [{ text: 'Quay lại đăng nhập', onPress: () => navigation.navigate('Login') }]);
    } catch (error: any) {
      Alert.alert('Không thể gửi yêu cầu', error?.response?.data?.error?.message || 'Không thể kết nối backend.');
    }
  };
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
      <MaterialIcons name="lock-reset" size={58} color={Colors.primary} style={styles.icon} />
      <Text style={styles.title}>Quên mật khẩu?</Text>
      <Text style={styles.subtitle}>Nhập email để nhận hướng dẫn khôi phục tài khoản.</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
      <TouchableOpacity style={styles.primaryButton} onPress={handleReset}><Text style={styles.primaryButtonText}>Gửi hướng dẫn</Text></TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: Spacing.xl },
  backButton: { position: 'absolute', top: 56, left: Spacing.xl, width: 40, height: 40, justifyContent: 'center' },
  icon: { alignSelf: 'center', marginBottom: Spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  input: { height: 50, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, color: Colors.textPrimary, backgroundColor: Colors.surface, ...Shadows.subtle },
  primaryButton: { height: 50, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg },
  primaryButtonText: { color: Colors.textWhite, fontSize: 15, fontWeight: '800' },
});
