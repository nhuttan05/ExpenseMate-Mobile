import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';
import { categories as defaultCategories } from '../data/mockData';
import { Category } from '../types';
import { ScreenContainer } from '../components/layout/ScreenContainer';

interface CategoriesScreenProps { navigation?: any; }

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const allCategories = [...defaultCategories, ...customCategories];

  const addCategory = () => {
    const newCategory: Category = { id: `cat_custom_${Date.now()}`, name: `Danh mục mới ${customCategories.length + 1}`, icon: 'label', color: Colors.primary, backgroundColor: Colors.primaryLight, type: 'EXPENSE' };
    setCustomCategories((current) => [...current, newCategory]);
    Alert.alert('Đã thêm danh mục', `${newCategory.name} đã được tạo.`);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation?.goBack()}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></TouchableOpacity><Text style={styles.headerTitle}>Quản lý danh mục</Text><TouchableOpacity onPress={addCategory}><MaterialIcons name="add" size={24} color={Colors.primary} /></TouchableOpacity></View>
      <View style={styles.content}>
        <Text style={styles.helper}>Danh mục giúp phân loại khoản thu và chi để AI có thể phân tích chính xác hơn.</Text>
        <View style={styles.card}>{allCategories.map((item, index) => <View key={item.id} style={[styles.row, index < allCategories.length - 1 && styles.rowBorder]}><View style={[styles.iconBox, { backgroundColor: item.backgroundColor }]}><MaterialIcons name={item.icon as any} size={20} color={item.color} /></View><View style={styles.rowText}><Text style={styles.name}>{item.name}</Text><Text style={styles.type}>{item.type === 'INCOME' ? 'Khoản thu' : 'Khoản chi'}</Text></View><MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} /></View>)}</View>
        <TouchableOpacity style={[styles.addButton, Shadows.subtle]} onPress={addCategory}><MaterialIcons name="add-circle-outline" size={20} color={Colors.textWhite} /><Text style={styles.addButtonText}>Thêm danh mục chi</Text></TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: { height: 56, paddingHorizontal: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F3F9' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Spacing.lg },
  helper: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.card },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F3F9' },
  iconBox: { width: 42, height: 42, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  rowText: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  type: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  addButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, height: 50, marginTop: Spacing.xl, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary },
  addButtonText: { color: Colors.textWhite, fontSize: 14, fontWeight: '800' },
});
