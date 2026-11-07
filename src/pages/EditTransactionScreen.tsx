import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { useAppDispatch } from '../redux/store';
import { updateTransactionAsync } from '../redux/slices/expenseSlice';
import { categories } from '../data/mockData';
import { Transaction } from '../types';
import { showAppNotice } from '../utils/appNotice';

interface EditTransactionScreenProps { route?: any; navigation?: any; }

export const EditTransactionScreen: React.FC<EditTransactionScreenProps> = ({ route, navigation }) => {
  const transaction: Transaction | undefined = route?.params?.transaction;
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState(transaction?.title || '');
  const [amount, setAmount] = useState(transaction?.amount ? String(transaction.amount) : '');
  const [note, setNote] = useState(transaction?.note || '');
  const [categoryId, setCategoryId] = useState(transaction?.category.id || categories[0].id);
  const [saving, setSaving] = useState(false);

  if (!transaction) {
    return <ScreenContainer><Text style={styles.missing}>Không tìm thấy giao dịch.</Text></ScreenContainer>;
  }

  const availableCategories = categories.filter((item) => item.type === transaction.type);
  const selectedCategory = availableCategories.find((item) => item.id === categoryId) || availableCategories[0];

  const handleSave = async () => {
    const numericAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!title.trim() || !numericAmount || numericAmount <= 0) {
      showAppNotice('Thông tin chưa hợp lệ', 'Vui lòng nhập tên và số tiền lớn hơn 0.');
      return;
    }
    setSaving(true);
    try {
      await dispatch(updateTransactionAsync({ ...transaction, title: title.trim(), amount: numericAmount, note: note.trim() || undefined, category: selectedCategory })).unwrap();
      showAppNotice('Cập nhật thành công', 'Giao dịch đã được cập nhật dữ liệu.', () => navigation?.goBack());
    } catch (error: any) {
      showAppNotice('Cập nhật thất bại', error?.message || 'Không thể cập nhật giao dịch. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation?.goBack()}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></TouchableOpacity><Text style={styles.headerTitle}>Chỉnh sửa giao dịch</Text><View style={{ width: 24 }} /></View>
      <View style={styles.content}>
        <Text style={styles.typeBadge}>{transaction.type === 'INCOME' ? 'KHOẢN THU' : 'KHOẢN CHI'}</Text>
        <Text style={styles.label}>Tên giao dịch</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} />
        <Text style={styles.label}>Số tiền (VND)</Text><TextInput style={styles.input} value={amount} onChangeText={(value) => setAmount(value.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
        <Text style={styles.label}>Danh mục</Text>
        <View style={styles.categoryGrid}>{availableCategories.map((item) => <TouchableOpacity key={item.id} onPress={() => setCategoryId(item.id)} style={[styles.categoryChip, categoryId === item.id && styles.categoryChipActive]}><MaterialIcons name={item.icon as any} size={18} color={categoryId === item.id ? Colors.textWhite : item.color} /><Text style={[styles.categoryText, categoryId === item.id && styles.categoryTextActive]}>{item.name}</Text></TouchableOpacity>)}</View>
        <Text style={styles.label}>Ghi chú</Text><TextInput style={[styles.input, styles.noteInput]} value={note} onChangeText={setNote} multiline placeholder="Thêm ghi chú..." placeholderTextColor={Colors.textMuted} />
        <TouchableOpacity style={[styles.saveButton, Shadows.subtle]} onPress={handleSave} disabled={saving}><Text style={styles.saveButtonText}>{saving ? 'Đang cập nhật...' : 'Lưu thay đổi'}</Text></TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: { height: 56, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F3F9' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Spacing.lg },
  typeBadge: { color: Colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: Spacing.lg },
  label: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700', marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { minHeight: 48, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, color: Colors.textPrimary, backgroundColor: Colors.surface },
  noteInput: { minHeight: 88, paddingTop: Spacing.md, textAlignVertical: 'top' },
  categoryGrid: { gap: Spacing.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { color: Colors.textPrimary, fontSize: 13, flex: 1 },
  categoryTextActive: { color: Colors.textWhite, fontWeight: '700' },
  saveButton: { height: 52, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  saveButtonText: { color: Colors.textWhite, fontSize: 15, fontWeight: '800' },
  missing: { padding: Spacing.xl, color: Colors.textPrimary },
});
