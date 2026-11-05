import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';
import { AuthApi } from '../api/authApi';

interface RegisterScreenProps { navigation: any; }

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || password.length < 8) {
      Alert.alert('Thông tin chưa hợp lệ', 'Hãy nhập đủ thông tin và mật khẩu tối thiểu 8 ký tự.');
      return;
    }
    setLoading(true);
    try {
      await AuthApi.register(name.trim(), email.trim(), password);
      Alert.alert('Đăng ký thành công', 'Tài khoản đã được tạo trên backend.', [{ text: 'Bắt đầu', onPress: () => navigation.replace('Main') }]);
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || 'Không thể kết nối backend. Hãy kiểm tra Docker và địa chỉ API.';
      Alert.alert('Đăng ký thất bại', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
      <Text style={styles.title}>Tạo tài khoản</Text>
      <Text style={styles.subtitle}>Bắt đầu theo dõi dòng tiền của bạn.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Họ và tên</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nguyễn Văn A" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.label}>Email</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Mật khẩu</Text><TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Tối thiểu 8 ký tự" placeholderTextColor={Colors.textMuted} secureTextEntry />
        <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}><Text style={styles.primaryButtonText}>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={styles.loginLink}>Đã có tài khoản? Đăng nhập</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: Spacing.xl },
  backButton: { position: 'absolute', top: 56, left: Spacing.xl, width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, ...Shadows.card },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  input: { height: 48, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, color: Colors.textPrimary, backgroundColor: Colors.surfaceContainerLow },
  primaryButton: { height: 50, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  primaryButtonText: { color: Colors.textWhite, fontSize: 15, fontWeight: '800' },
  loginLink: { textAlign: 'center', color: Colors.primary, fontWeight: '700', fontSize: 13, marginTop: Spacing.lg },
});
