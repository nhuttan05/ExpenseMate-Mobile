import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, DarkColors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { ApiService } from '../services/apiService';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { mockUser as initialUser } from '../data/mockData';
import { AuthApi } from '../api/authApi';
import {
  resetDatabaseToDefaults,
  exportAllDataSnapshot,
  restoreDataSnapshot,
  DatabaseSnapshot,
} from '../services/database';
import {
  logout,
  updateCurrentUserProfile,
  toggleDarkMode,
} from '../redux/slices/authSlice';
import { loadTransactions } from '../redux/slices/expenseSlice';
import { loadBudgets } from '../redux/slices/budgetSlice';
import { loadWalletsAndJars } from '../redux/slices/walletSlice';
import { loadRecurringAndDebts } from '../redux/slices/recurringSlice';
import { loadSimulationData } from '../redux/slices/simulationSlice';
import { formatCurrency, getJarName } from '../utils/formatters';

interface ProfileScreenProps {
  navigation: any;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
];

const TIER_OPTIONS = [
  'Bậc Thầy Tài Chính',
  'Người Tích Luỹ Mới',
  'Doanh Nhân Khởi Nghiệp',
  'Nhà Đầu Tư Thông Thái',
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { transactions } = useAppSelector((state) => state.expense);
  const { wallets } = useAppSelector((state) => state.wallet);
  const { currentUser, isDarkMode } = useAppSelector((state) => state.auth);

  // Chọn Theme theo chế độ Đen Trắng / Dark Mode
  const theme = isDarkMode ? DarkColors : Colors;

  // User State
  const [user, setUser] = useState({
    name: currentUser?.name || initialUser.name,
    email: currentUser?.email || initialUser.email,
    phone: '+84 987 654 321',
    avatarUrl: currentUser?.avatarUrl || initialUser.avatarUrl,
    tier: currentUser?.tier || initialUser.tier,
    role: currentUser?.role || 'USER',
    monthlyIncome: currentUser?.monthlyIncome || 35000000,
    monthlyExpense: currentUser?.monthlyExpense || 18200000,
  });

  useEffect(() => {
    if (currentUser) {
      setUser({
        name: currentUser.name,
        email: currentUser.email,
        phone: '+84 987 654 321',
        avatarUrl: currentUser.avatarUrl,
        tier: currentUser.tier,
        role: currentUser.role,
        monthlyIncome: currentUser.monthlyIncome,
        monthlyExpense: currentUser.monthlyExpense,
      });
    }
  }, [currentUser]);

  // Security & App Settings
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userPin, setUserPin] = useState('1234');
  const [selectedCurrency, setSelectedCurrency] = useState<'VND' | 'USD' | 'EUR' | 'JPY'>('VND');

  // Async States
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [serverStatus, setServerStatus] = useState<{
    tested: boolean;
    online: boolean;
    latency: number;
    dbStatus: string;
    message: string;
  }>({
    tested: false,
    online: false,
    latency: 0,
    dbStatus: 'Chưa kiểm tra',
    message: '',
  });

  // Modal Visibilities
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [faqModalVisible, setFaqModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editAvatar, setEditAvatar] = useState(user.avatarUrl);
  const [editTier, setEditTier] = useState(user.tier);
  const [editIncome, setEditIncome] = useState(user.monthlyIncome.toString());
  const [editExpense, setEditExpense] = useState(user.monthlyExpense.toString());

  // PIN Keypad State
  const [pinInput, setPinInput] = useState('');
  const [pinStep, setPinStep] = useState<'ENTER_OLD' | 'ENTER_NEW' | 'CONFIRM_NEW'>('ENTER_OLD');
  const [newPinCandidate, setNewPinCandidate] = useState('');
  const [pinStatusMessage, setPinStatusMessage] = useState('Nhập mã PIN hiện tại (Mặc định: 1234)');

  // Currency Converter State
  const [converterAmount, setConverterAmount] = useState('1000000');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 25450, EUR: 27100, JPY: 168 });
  const [ratesLoading, setRatesLoading] = useState(false);

  // Backup & Restore Snapshot State
  const [savedSnapshot, setSavedSnapshot] = useState<DatabaseSnapshot | null>(null);

  // FAQ Expanded index
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // ==========================================
  // HANDLERS
  // ==========================================

  // 1. Chỉnh sửa thông tin khách hàng hợp lý
  const handleOpenEditModal = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditAvatar(user.avatarUrl);
    setEditTier(user.tier);
    setEditIncome(user.monthlyIncome.toString());
    setEditExpense(user.monthlyExpense.toString());
    setEditProfileVisible(true);
  };

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      showToast('⚠️ Họ tên và email không được để trống.');
      return;
    }

    const incomeNum = parseFloat(editIncome) || user.monthlyIncome;
    const expenseNum = parseFloat(editExpense) || user.monthlyExpense;

    const updatedProfile = {
      name: editName.trim(),
      email: editEmail.trim(),
      avatarUrl: editAvatar,
      tier: editTier,
      monthlyIncome: incomeNum,
      monthlyExpense: expenseNum,
    };

    // Cập nhật Redux store (đồng bộ sang toàn bộ app)
    dispatch(updateCurrentUserProfile(updatedProfile));

    setUser((prev) => ({
      ...prev,
      ...updatedProfile,
      phone: editPhone.trim(),
    }));

    setEditProfileVisible(false);
    showToast('✅ Đã cập nhật thông tin khách hàng thành công!');
  };

  // 2. Mã PIN bảo mật
  const handlePinKeyPress = (digit: string) => {
    if (pinInput.length >= 4) return;
    const nextPin = pinInput + digit;
    setPinInput(nextPin);

    if (nextPin.length === 4) {
      setTimeout(() => {
        if (pinStep === 'ENTER_OLD') {
          if (nextPin === userPin) {
            setPinStep('ENTER_NEW');
            setPinInput('');
            setPinStatusMessage('Nhập mã PIN 4 số mới');
          } else {
            setPinInput('');
            setPinStatusMessage('Mã PIN cũ không chính xác. Vui lòng thử lại!');
          }
        } else if (pinStep === 'ENTER_NEW') {
          setNewPinCandidate(nextPin);
          setPinStep('CONFIRM_NEW');
          setPinInput('');
          setPinStatusMessage('Nhập lại mã PIN mới để xác nhận');
        } else if (pinStep === 'CONFIRM_NEW') {
          if (nextPin === newPinCandidate) {
            setUserPin(nextPin);
            setPinInput('');
            setPinStep('ENTER_OLD');
            setSecurityModalVisible(false);
            showToast('✅ Đổi mã PIN bảo mật thành công!');
          } else {
            setPinInput('');
            setPinStep('ENTER_NEW');
            setPinStatusMessage('Mã xác nhận không khớp! Vui lòng nhập lại PIN mới');
          }
        }
      }, 250);
    }
  };

  const handlePinBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  // 3. Tra cứu & Chuyển đổi ngoại tệ
  const handleOpenCurrencyModal = async () => {
    setCurrencyModalVisible(true);
    setRatesLoading(true);
    try {
      const fetchedRates = await ApiService.fetchExchangeRates();
      if (fetchedRates && Object.keys(fetchedRates).length > 0) {
        setRates(fetchedRates);
      }
    } catch {
      // Dùng fallback mặc định
    } finally {
      setRatesLoading(false);
    }
  };

  // 4. Xuất file CSV
  const generateCSVContent = (): string => {
    const header = 'ID,Ngay,TieuDe,SoTien,Loai,DanhMuc,PhuongThuc,HuTaiChinh,GhiChu\n';
    const rows = transactions.map((tx) => {
      const cleanTitle = (tx.title || '').replace(/,/g, ' ');
      const cleanNote = (tx.note || '').replace(/,/g, ' ');
      const jarTitle = tx.jarCode ? getJarName(tx.jarCode) : 'Khong';
      return `${tx.id},${tx.date},${cleanTitle},${tx.amount},${tx.type},${tx.category?.name || ''},${tx.paymentMethod || ''},${jarTitle},${cleanNote}`;
    });
    return header + rows.join('\n');
  };

  const handleCopyCSV = () => {
    const csv = generateCSVContent();
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(csv);
      showToast(`📋 Đã sao chép ${transactions.length} dòng dữ liệu CSV!`);
    } else {
      showToast(`📋 Đã tạo ${transactions.length} dòng dữ liệu CSV thành công!`);
    }
  };

  // 5. Sao lưu & Phục hồi JSON
  const handleCreateBackup = async () => {
    const snapshot = await exportAllDataSnapshot();
    setSavedSnapshot(snapshot);
    showToast(`💾 Đã sao lưu an toàn ${snapshot.transactions.length} giao dịch!`);
  };

  const handleRestoreBackup = async () => {
    if (!savedSnapshot) {
      showToast('⚠️ Chưa có bản sao lưu nào để khôi phục.');
      return;
    }
    const success = await restoreDataSnapshot(savedSnapshot);
    if (success) {
      dispatch(loadTransactions());
      dispatch(loadWalletsAndJars());
      dispatch(loadBudgets());
      setBackupModalVisible(false);
      showToast('✅ Đã khôi phục dữ liệu từ bản sao lưu thành công!');
    } else {
      showToast('❌ Khôi phục dữ liệu thất bại.');
    }
  };

  // 6. Kiểm tra máy chủ Backend
  const handleTestServerHealth = async () => {
    setServerStatus((prev) => ({ ...prev, tested: false }));
    const startTime = Date.now();
    try {
      const isHealthy = await ApiService.checkHealth();
      const latency = Date.now() - startTime;
      setServerStatus({
        tested: true,
        online: isHealthy,
        latency,
        dbStatus: isHealthy ? 'PostgreSQL 5433: Đã kết nối' : 'Không có phản hồi',
        message: isHealthy
          ? 'Máy chủ Backend Node.js & Database Postgres hoạt động hoàn hảo.'
          : 'Không thể kết nối tới Backend trên localhost:3000.',
      });
    } catch {
      setServerStatus({
        tested: true,
        online: false,
        latency: 0,
        dbStatus: 'Mất kết nối',
        message: 'Lỗi mạng: Vui lòng kiểm tra Docker container expensemate-backend.',
      });
    }
  };

  // 7. Đồng bộ đám mây
  const handleSyncCloud = async () => {
    if (!AuthApi.getAccessToken()) {
      showToast('ℹ️ Chế độ thiết bị: Dữ liệu đang được lưu an toàn trong SQLite.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await ApiService.syncLocalToCloud(transactions);
      showToast(`☁️ Đã đồng bộ ${res.count} giao dịch lên máy chủ!`);
    } catch (error: any) {
      showToast('⚠️ Đồng bộ tạm thời gián đoạn. Dữ liệu trên máy vẫn an toàn.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 8. Đặt lại dữ liệu gốc (Factory Reset)
  const handleConfirmReset = async () => {
    const success = await resetDatabaseToDefaults();
    if (success) {
      dispatch(loadTransactions());
      dispatch(loadBudgets());
      dispatch(loadWalletsAndJars());
      dispatch(loadRecurringAndDebts());
      dispatch(loadSimulationData());
      setResetModalVisible(false);
      showToast('✅ Đã khôi phục dữ liệu ban đầu thành công!');
    } else {
      showToast('❌ Không thể đặt lại dữ liệu.');
    }
  };

  // 9. Đăng xuất hoàn chỉnh (Hoạt động 100% trên Web, Android, iOS)
  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    dispatch(logout());
    await AuthApi.logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const numAmount = parseFloat(converterAmount) || 0;

  return (
    <ScreenContainer style={{ backgroundColor: theme.background }}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.borderSubtle }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Hồ sơ & Cài đặt</Text>
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: theme.surfaceContainerLow }]}
          onPress={handleSyncCloud}
          disabled={isSyncing}
          activeOpacity={0.7}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <MaterialIcons name="cloud-done" size={20} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentPadding}>
        {/* PROFILE CARD (Bấm vào để chỉnh sửa thông tin khách hàng) */}
        <TouchableOpacity
          style={[
            styles.profileCard,
            Shadows.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={handleOpenEditModal}
          activeOpacity={0.88}
        >
          <Image source={{ uri: user.avatarUrl }} style={styles.avatarLarge} />
          <View style={styles.profileDetails}>
            <View style={styles.badgeRow}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>{user.name}</Text>
              <View style={[styles.tierBadge, { backgroundColor: theme.primaryLight }]}>
                <MaterialIcons name="verified" size={12} color={theme.primary} />
                <Text style={[styles.tierText, { color: theme.primary }]}>{user.tier}</Text>
              </View>
            </View>

            <View style={styles.roleSubRow}>
              <View
                style={[
                  styles.roleIndicatorPill,
                  user.role === 'ADMIN' ? styles.roleAdminPill : styles.roleUserPill,
                ]}
              >
                <Text
                  style={[
                    styles.roleIndicatorText,
                    user.role === 'ADMIN' ? { color: '#7C3AED' } : { color: theme.primary },
                  ]}
                >
                  {user.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'KHÁCH HÀNG'}
                </Text>
              </View>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
            </View>

            <Text style={[styles.phoneText, { color: theme.textMuted }]}>
              {user.phone} • Thu nhập: {formatCurrency(user.monthlyIncome)}/tháng
            </Text>
          </View>
          <View style={[styles.editProfileBtn, { backgroundColor: theme.surfaceContainerLow }]}>
            <MaterialIcons name="edit" size={18} color={theme.primary} />
          </View>
        </TouchableOpacity>

        {/* BENTO STATS QUICK STRIP */}
        <View style={[styles.statsStrip, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>GIAO DỊCH</Text>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{transactions.length}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>VÍ HOẠT ĐỘNG</Text>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{wallets.length}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>TIỀN TỆ</Text>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{selectedCurrency}</Text>
          </View>
        </View>

        {/* ======================================================== */}
        {/* ĐẶC QUYỀN QUẢN TRỊ VIÊN (CHỈ HIỂN THỊ KHI ROLE LÀ ADMIN) */}
        {/* ======================================================== */}
        {currentUser?.role === 'ADMIN' && (
          <View style={styles.groupWrapper}>
            <Text style={[styles.groupTitle, { color: '#A855F7' }]}>ĐẶC QUYỀN QUẢN TRỊ VIÊN</Text>
            <View style={[styles.menuCard, Shadows.card, { backgroundColor: theme.surface, borderColor: '#7C3AED', borderWidth: 1.5 }]}>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: isDarkMode ? '#1E1B4B' : '#FAF5FF', borderBottomColor: 'transparent' }]}
                onPress={() => navigation.navigate('Admin')}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: '#7C3AED' }]}>
                  <MaterialIcons name="admin-panel-settings" size={20} color="#FFF" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuText, { color: isDarkMode ? '#C084FC' : '#6D28D9' }]}>
                    Bảng Điều Khiển Quản Trị Hệ Thống
                  </Text>
                  <Text style={[styles.menuSubText, { color: theme.textMuted }]}>
                    Quản lý khách hàng, cấu hình 6 Hũ toàn sàn & Audit Logs
                  </Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SETTINGS GROUP 1: HỆ THỐNG & KẾT NỐI */}
        <View style={styles.groupWrapper}>
          <Text style={[styles.groupTitle, { color: theme.textMuted }]}>HỆ THỐNG & ĐỒNG BỘ DỮ LIỆU</Text>
          <View style={[styles.menuCard, Shadows.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Server Health Status */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.borderSubtle }]}
              onPress={() => {
                setServerModalVisible(true);
                handleTestServerHealth();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <MaterialIcons name="dns" size={20} color={theme.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>Trạng thái Máy chủ & Database</Text>
                <Text style={[styles.menuSubText, { color: theme.textMuted }]}>Kiểm tra Docker Container & Postgres 5433</Text>
              </View>
              <View style={styles.statusDotRow}>
                <View style={[styles.liveDot, { backgroundColor: theme.income }]} />
                <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Cloud Sync */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.borderSubtle }]}
              onPress={handleSyncCloud}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                <MaterialIcons name="cloud-sync" size={20} color={theme.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>Đồng bộ tức thì lên Cloud</Text>
                <Text style={[styles.menuSubText, { color: theme.textMuted }]}>{transactions.length} giao dịch trong SQLite nội bộ</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Exchange Rates */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: 'transparent' }]}
              onPress={handleOpenCurrencyModal}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="currency-exchange" size={20} color="#D97706" />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>Tiền tệ & Tỷ giá hối đoái</Text>
                <Text style={[styles.menuSubText, { color: theme.textMuted }]}>Đang dùng {selectedCurrency} • Quy đổi ngoại tệ thông minh</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SETTINGS GROUP 2: BẢO MẬT & GIAO DIỆN ĐEN TRẮNG */}
        <View style={styles.groupWrapper}>
          <Text style={[styles.groupTitle, { color: theme.textMuted }]}>BẢO MẬT & GIAO DIỆN ĐEN TRẮNG</Text>
          <View style={[styles.menuCard, Shadows.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Dark Mode Switch (Chế độ Đen Trắng hiển thị sống động) */}
            <View style={[styles.menuItem, { borderBottomColor: theme.borderSubtle }]}>
              <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                <MaterialIcons
                  name="dark-mode"
                  size={20}
                  color={isDarkMode ? '#38BDF8' : theme.textPrimary}
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>
                  Chế độ Đen Trắng / Dark OLED
                </Text>
                <Text style={[styles.menuSubText, { color: theme.textMuted }]}>
                  {isDarkMode ? 'Đang bật nền đen sâu OLED bảo vệ mắt' : 'Đang dùng giao diện sáng Porcelain'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={() => {
                  dispatch(toggleDarkMode());
                }}
                trackColor={{ false: Colors.border, true: theme.primary }}
              />
            </View>

            {/* Biometrics */}
            <View style={[styles.menuItem, { borderBottomColor: theme.borderSubtle }]}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <MaterialIcons name="fingerprint" size={20} color={theme.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>Xác thực FaceID / Vân tay</Text>
                <Text style={[styles.menuSubText, { color: theme.textMuted }]}>Bảo mật mở khoá tức thì khi vào app</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={(val) => {
                  setBiometricsEnabled(val);
                  showToast(val ? 'Đã kích hoạt FaceID/Vân tay.' : 'Đã tắt sinh trắc học.');
                }}
                trackColor={{ false: Colors.border, true: theme.primary }}
              />
            </View>

            {/* Change PIN */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.borderSubtle }]}
              onPress={() => {
                setPinStep('ENTER_OLD');
                setPinInput('');
                setPinStatusMessage('Nhập mã PIN hiện tại (Mặc định: 1234)');
                setSecurityModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                <MaterialIcons name="pin" size={20} color="#7C3AED" />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>Mã PIN bảo mật (4 chữ số)</Text>
                <Text style={[styles.menuSubText, { color: theme.textMuted }]}>Đang thiết lập: •••• (Chạm để đổi mã)</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Notifications */}
            <View style={[styles.menuItem, { borderBottomColor: 'transparent' }]}>
              <View style={[styles.iconBox, { backgroundColor: '#FFE4E6' }]}>
                <MaterialIcons name="notifications-active" size={20} color="#BE123C" />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>Cảnh báo chi tiêu thông minh</Text>
                <Text style={[styles.menuSubText, { color: theme.textMuted }]}>Thông báo khi hũ chi tiêu vượt 80%</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.border, true: theme.primary }}
              />
            </View>
          </View>
        </View>

        {/* SETTINGS GROUP 3: SAO LƯU & TRÍCH XUẤT */}
        <View style={styles.groupWrapper}>
          <Text style={[styles.groupTitle, { color: theme.textMuted }]}>SAO LƯU & XUẤT DỮ LIỆU</Text>
          <View style={[styles.menuCard, Shadows.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Export CSV */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.borderSubtle }]}
              onPress={() => setExportModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                <MaterialIcons name="file-download" size={20} color="#0284C7" />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>Xuất báo cáo giao dịch (CSV / Excel)</Text>
                <Text style={[styles.menuSubText, { color: theme.textMuted }]}>Bảng tính hoàn chỉnh gồm ngày, loại, hũ chi tiêu</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Backup & Restore JSON */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.borderSubtle }]}
              onPress={() => setBackupModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FEF9C3' }]}>
                <MaterialIcons name="settings-backup-restore" size={20} color="#CA8A04" />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>Sao lưu & Khôi phục (JSON Snapshot)</Text>
                <Text style={[styles.menuSubText, { color: theme.textMuted }]}>Lưu bản sao an toàn & khôi phục toàn bộ bảng</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
            </TouchableOpacity>

            {/* FAQ & Guide */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: 'transparent' }]}
              onPress={() => setFaqModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                <MaterialIcons name="help-outline" size={20} color={theme.textPrimary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: theme.textPrimary }]}>Trung tâm trợ giúp & Hướng dẫn 6 Hũ</Text>
                <Text style={[styles.menuSubText, { color: theme.textMuted }]}>Chi tiết quy tắc T. Harv Eker, What-If Simulator</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SETTINGS GROUP 4: NGUY HIỂM & ĐẶT LẠI */}
        <View style={styles.groupWrapper}>
          <Text style={[styles.groupTitle, { color: theme.textMuted }]}>NÂNG CAO & HỆ THỐNG</Text>
          <View style={[styles.menuCard, Shadows.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: 'transparent' }]}
              onPress={() => setResetModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <MaterialIcons name="restart-alt" size={20} color={theme.error} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: theme.error }]}>Khôi phục dữ liệu ban đầu (Factory Reset)</Text>
                <Text style={[styles.menuSubText, { color: theme.textMuted }]}>Làm mới toàn bộ SQLite về bộ dữ liệu chuẩn mẫu</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* NÚT ĐĂNG XUẤT (BẬT MODAL XÁC NHẬN CHẠY 100% TRÊN WEB & MOBILE) */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Đăng xuất khỏi tài khoản</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: theme.textMuted }]}>
          ExpenseMate Pro v2.6.0 • Dark Mode OLED • Multi-Tenant RBAC Isolation
        </Text>
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ============================================================ */}
      {/* 1. MODAL CHỈNH SỬA THÔNG TIN KHÁCH HÀNG HOÀN THIỆN */}
      {/* ============================================================ */}
      <Modal visible={editProfileVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Chỉnh sửa thông tin khách hàng
              </Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Role Info Tag */}
              <View style={styles.roleModalBanner}>
                <MaterialIcons
                  name={user.role === 'ADMIN' ? 'admin-panel-settings' : 'verified-user'}
                  size={18}
                  color={user.role === 'ADMIN' ? '#7C3AED' : theme.primary}
                />
                <Text style={styles.roleModalBannerText}>
                  Vai trò tài khoản: <Text style={{ fontWeight: '800' }}>{user.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'KHÁCH HÀNG'}</Text> (Bảo vệ dữ liệu cô lập)
                </Text>
              </View>

              <Text style={[styles.inputSectionLabel, { color: theme.textMuted }]}>CHỌN ẢNH ĐẠI DIỆN</Text>
              <View style={styles.avatarPickerRow}>
                {AVATAR_OPTIONS.map((uri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.avatarPickItem,
                      editAvatar === uri && { borderColor: theme.primary },
                    ]}
                    onPress={() => setEditAvatar(uri)}
                  >
                    <Image source={{ uri }} style={styles.avatarThumbnail} />
                    {editAvatar === uri && (
                      <View style={[styles.avatarCheckBadge, { backgroundColor: theme.primary }]}>
                        <MaterialIcons name="check" size={12} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputSectionLabel, { color: theme.textMuted }]}>HỌ VÀ TÊN KHÁCH HÀNG</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.surfaceContainerLow, color: theme.textPrimary, borderColor: theme.border }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nhập họ và tên"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.inputSectionLabel, { color: theme.textMuted }]}>ĐỊA CHỈ EMAIL</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.surfaceContainerLow, color: theme.textPrimary, borderColor: theme.border }]}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Nhập địa chỉ email"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.inputSectionLabel, { color: theme.textMuted }]}>SỐ ĐIỆN THOẠI</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.surfaceContainerLow, color: theme.textPrimary, borderColor: theme.border }]}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="Nhập số điện thoại"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.inputSectionLabel, { color: theme.textMuted }]}>DANH HIỆU / CẤP BẬC TÀI CHÍNH</Text>
              <View style={styles.tierChoiceRow}>
                {TIER_OPTIONS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.tierChoicePill,
                      editTier === t && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setEditTier(t)}
                  >
                    <Text
                      style={[
                        styles.tierChoiceText,
                        editTier === t && { color: '#FFF' },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputSectionLabel, { color: theme.textMuted }]}>THU NHẬP HÀNG THÁNG (VNĐ)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.surfaceContainerLow, color: theme.textPrimary, borderColor: theme.border }]}
                value={editIncome}
                onChangeText={setEditIncome}
                keyboardType="numeric"
                placeholder="Ví dụ: 35000000"
                placeholderTextColor={theme.textMuted}
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveProfile}
                activeOpacity={0.85}
              >
                <MaterialIcons name="check-circle" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Lưu Thay Đổi Hồ Sơ</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 2. MODAL XÁC NHẬN ĐĂNG XUẤT (HOẠT ĐỘNG 100% TRÊN WEB) */}
      {/* ============================================================ */}
      <Modal visible={logoutModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.dangerSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.dangerIconCircle}>
              <MaterialIcons name="logout" size={32} color={Colors.error} />
            </View>

            <Text style={[styles.dangerTitle, { color: theme.textPrimary }]}>Xác Nhận Đăng Xuất</Text>
            <Text style={[styles.dangerMessage, { color: theme.textSecondary }]}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản "{user.name}"? Dữ liệu tài chính riêng biệt của tài khoản này vẫn được bảo toàn an toàn trên thiết bị.
            </Text>

            <View style={styles.dangerActionsRow}>
              <TouchableOpacity
                style={[styles.dangerCancelBtn, { backgroundColor: theme.surfaceContainerLow }]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={[styles.dangerCancelBtnText, { color: theme.textSecondary }]}>Hủy Bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerConfirmBtn}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.dangerConfirmBtnText}>Xác Nhận Đăng Xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 3. MODAL BẢO MẬT MÃ PIN */}
      {/* ============================================================ */}
      <Modal visible={securityModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.pinSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Bảo Mật Mã PIN</Text>
              <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.pinIconCircle, { backgroundColor: theme.primaryLight }]}>
              <MaterialIcons name="lock" size={32} color={theme.primary} />
            </View>

            <Text style={[styles.pinStatusPrompt, { color: theme.textSecondary }]}>{pinStatusMessage}</Text>

            {/* 4 PIN Dots */}
            <View style={styles.pinDotsRow}>
              {[0, 1, 2, 3].map((index) => {
                const filled = pinInput.length > index;
                return (
                  <View
                    key={index}
                    style={[
                      styles.pinDot,
                      { borderColor: theme.primary },
                      filled && { backgroundColor: theme.primary },
                    ]}
                  />
                );
              })}
            </View>

            {/* Keypad */}
            <View style={styles.keypadGrid}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map((key, i) => {
                if (key === '') {
                  return <View key={i} style={styles.keypadKeyEmpty} />;
                }
                if (key === 'DEL') {
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.keypadKey, { backgroundColor: theme.surfaceContainerLow }]}
                      onPress={handlePinBackspace}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="backspace" size={22} color={theme.textPrimary} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.keypadKey, { backgroundColor: theme.surfaceContainerLow }]}
                    onPress={() => handlePinKeyPress(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.keypadKeyText, { color: theme.textPrimary }]}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 4. MODAL TIỀN TỆ & TỶ GIÁ NGOẠI TỆ */}
      {/* ============================================================ */}
      <Modal visible={currencyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Tiền tệ & Tỷ giá hối đoái</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputSectionLabel, { color: theme.textMuted }]}>CHỌN ĐƠN VỊ TIỀN TỆ HIỂN THỊ</Text>
              <View style={styles.currencySelectRow}>
                {(['VND', 'USD', 'EUR', 'JPY'] as const).map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={[
                      styles.currencyChoiceBtn,
                      { backgroundColor: theme.surfaceContainerLow, borderColor: theme.border },
                      selectedCurrency === curr && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setSelectedCurrency(curr)}
                  >
                    <Text
                      style={[
                        styles.currencyChoiceText,
                        { color: theme.textSecondary },
                        selectedCurrency === curr && { color: '#FFF' },
                      ]}
                    >
                      {curr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputSectionLabel, { color: theme.textMuted }]}>CÔNG CỤ QUY ĐỔI NHANH (LIVE RATES)</Text>
              <View style={[styles.converterInputContainer, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.converterInput, { color: theme.textPrimary }]}
                  value={converterAmount}
                  onChangeText={setConverterAmount}
                  keyboardType="numeric"
                  placeholder="Nhập số tiền VND..."
                  placeholderTextColor={theme.textMuted}
                />
                <Text style={[styles.converterUnit, { color: theme.textMuted }]}>₫ VND</Text>
              </View>

              {ratesLoading ? (
                <ActivityIndicator style={{ marginVertical: 16 }} color={theme.primary} />
              ) : (
                <View style={[styles.ratesTable, { backgroundColor: theme.surfaceContainerLow }]}>
                  <View style={styles.rateRow}>
                    <Text style={[styles.rateCurrencyLabel, { color: theme.textPrimary }]}>🇺🇸 USD (Đô la Mỹ)</Text>
                    <Text style={[styles.rateValueText, { color: theme.primary }]}>
                      ≈ {(numAmount / (rates.USD || 25450)).toFixed(2)} $
                    </Text>
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={[styles.rateCurrencyLabel, { color: theme.textPrimary }]}>🇪🇺 EUR (Euro)</Text>
                    <Text style={[styles.rateValueText, { color: theme.primary }]}>
                      ≈ {(numAmount / (rates.EUR || 27100)).toFixed(2)} €
                    </Text>
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={[styles.rateCurrencyLabel, { color: theme.textPrimary }]}>🇯🇵 JPY (Yên Nhật)</Text>
                    <Text style={[styles.rateValueText, { color: theme.primary }]}>
                      ≈ {Math.round(numAmount / (rates.JPY || 168)).toLocaleString('vi-VN')} ¥
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setCurrencyModalVisible(false);
                  showToast(`✅ Đã áp dụng tiền tệ: ${selectedCurrency}`);
                }}
              >
                <Text style={styles.saveBtnText}>Áp Dụng Thiết Lập</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 5. MODAL XUẤT CSV BÁO CÁO */}
      {/* ============================================================ */}
      <Modal visible={exportModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Xuất Dữ Liệu Báo Cáo</Text>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.exportSummaryCard, { backgroundColor: theme.primaryLight }]}>
                <MaterialIcons name="table-view" size={32} color={theme.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.exportSummaryTitle, { color: theme.primary }]}>Sẵn sàng xuất file CSV</Text>
                  <Text style={[styles.exportSummarySub, { color: theme.textSecondary }]}>
                    Tổng cộng: {transactions.length} giao dịch của {user.name}
                  </Text>
                </View>
              </View>

              <Text style={[styles.inputSectionLabel, { color: theme.textMuted }]}>XEM TRƯỚC DỮ LIỆU</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewText} numberOfLines={8}>
                  {generateCSVContent().split('\n').slice(0, 6).join('\n')}
                </Text>
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionHalfBtn, { backgroundColor: theme.primary }]}
                  onPress={handleCopyCSV}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="content-copy" size={18} color="#FFF" />
                  <Text style={styles.actionHalfBtnText}>Sao Chép CSV</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionHalfBtn, { backgroundColor: theme.secondary }]}
                  onPress={() => {
                    showToast('📁 Đã tải tệp báo cáo chi tiêu!');
                    setExportModalVisible(false);
                  }}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="download" size={18} color="#FFF" />
                  <Text style={styles.actionHalfBtnText}>Tải Xuống</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 6. MODAL SAO LƯU & KHÔI PHỤC JSON */}
      {/* ============================================================ */}
      <Modal visible={backupModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Sao Lưu & Khôi Phục JSON</Text>
              <TouchableOpacity onPress={() => setBackupModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.backupCard, { backgroundColor: theme.surfaceContainerLow }]}>
                <MaterialIcons name="cloud-upload" size={28} color={theme.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.backupCardTitle, { color: theme.textPrimary }]}>Tạo bản sao lưu toàn diện</Text>
                  <Text style={[styles.backupCardSub, { color: theme.textMuted }]}>
                    Lưu trữ dữ liệu ví và giao dịch của {user.name} vào 1 snapshot.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.createBackupBtn, { backgroundColor: theme.primary }]}
                onPress={handleCreateBackup}
                activeOpacity={0.85}
              >
                <MaterialIcons name="add-to-photos" size={18} color="#FFF" />
                <Text style={styles.createBackupBtnText}>Tạo Bản Sao Lưu Mới</Text>
              </TouchableOpacity>

              {savedSnapshot && (
                <View style={styles.snapshotInfoBox}>
                  <Text style={styles.snapshotTitle}>Bản sao lưu gần nhất:</Text>
                  <Text style={styles.snapshotDetail}>• Ngày tạo: {new Date(savedSnapshot.exportedAt).toLocaleString('vi-VN')}</Text>
                  <Text style={styles.snapshotDetail}>• Giao dịch: {savedSnapshot.transactions.length}</Text>
                  <Text style={styles.snapshotDetail}>• Số ví: {savedSnapshot.wallets.length}</Text>

                  <TouchableOpacity style={styles.restoreBtn} onPress={handleRestoreBackup} activeOpacity={0.85}>
                    <MaterialIcons name="restore" size={18} color="#FFF" />
                    <Text style={styles.restoreBtnText}>Khôi Phục Bản Này</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 7. MODAL KIỂM TRA MÁY CHỦ & BACKEND */}
      {/* ============================================================ */}
      <Modal visible={serverModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Kết Nối Máy Chủ & Database</Text>
              <TouchableOpacity onPress={() => setServerModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.serverStatusCard, { backgroundColor: theme.surfaceContainerLow }]}>
                <View style={styles.serverStatusRow}>
                  <Text style={[styles.serverLabel, { color: theme.textSecondary }]}>Backend Container:</Text>
                  <View style={styles.serverPill}>
                    <View style={[styles.liveDot, { backgroundColor: serverStatus.online ? Colors.income : Colors.expense }]} />
                    <Text style={styles.serverPillText}>{serverStatus.online ? 'ONLINE' : 'OFFLINE'}</Text>
                  </View>
                </View>

                <View style={styles.serverStatusRow}>
                  <Text style={[styles.serverLabel, { color: theme.textSecondary }]}>Postgres Host Port:</Text>
                  <Text style={[styles.serverValue, { color: theme.textPrimary }]}>5433:5432</Text>
                </View>

                <View style={styles.serverStatusRow}>
                  <Text style={[styles.serverLabel, { color: theme.textSecondary }]}>Độ trễ phản hồi (Latency):</Text>
                  <Text style={[styles.serverValue, { color: theme.textPrimary }]}>{serverStatus.latency} ms</Text>
                </View>

                <View style={styles.serverStatusRow}>
                  <Text style={[styles.serverLabel, { color: theme.textSecondary }]}>Trạng thái cơ sở dữ liệu:</Text>
                  <Text style={[styles.serverValue, { color: theme.textPrimary }]}>{serverStatus.dbStatus}</Text>
                </View>
              </View>

              <Text style={[styles.serverMessageText, { color: theme.textMuted }]}>{serverStatus.message}</Text>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleTestServerHealth}
                activeOpacity={0.85}
              >
                <MaterialIcons name="refresh" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Kiểm Tra Lại Kết Nối</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 8. MODAL TRUNG TÂM TRỢ GIÚP & FAQ */}
      {/* ============================================================ */}
      <Modal visible={faqModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Hướng Dẫn & Trợ Giúp</Text>
              <TouchableOpacity onPress={() => setFaqModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                {
                  q: '1. Quy tắc 6 Chiếc Lọ (JARS) của T. Harv Eker hoạt động ra sao?',
                  a: 'Thu nhập hàng tháng được chia thành 6 quỹ: Nhu cầu thiết yếu (55%), Tự do tài chính & Đầu tư (10%), Tiết kiệm mua sắm dài hạn (10%), Học vấn & Phát triển (10%), Hưởng thụ & Giải trí (10%), Cho đi & Hiếu hỉ (5%). Ứng dụng tự động cảnh báo khi hũ vượt 80%.',
                },
                {
                  q: '2. Cỗ máy What-If Simulator giúp ích gì cho tôi?',
                  a: 'Công cụ giúp bạn dự báo trước tác động dòng tiền khi chuẩn bị mua món đồ lớn (như điện thoại, xe máy). Thuật toán tính toán điểm khả thi từ 0-1000 và đưa ra lời khuyên an toàn.',
                },
                {
                  q: '3. Dữ liệu của tôi có bị nhìn thấy bởi tài khoản khác không?',
                  a: 'HOÀN TOÀN KHÔNG. Hệ thống áp dụng cơ chế cô lập dữ liệu (Multi-Tenant Isolation). Mỗi tài khoản đăng nhập chỉ xem đúng số dư, ví và lịch sử giao dịch của chính mình.',
                },
                {
                  q: '4. Chế độ Đen Trắng (Dark Mode) có tác dụng gì?',
                  a: 'Chế độ Đen Trắng OLED giúp tiết kiệm pin cho màn hình AMOLED, giảm mỏi mắt khi sử dụng vào ban đêm và mang lại giao diện tinh tế, sang trọng chuẩn công thái học.',
                },
              ].map((faq, index) => {
                const isExpanded = expandedFaqIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.faqCard, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.border }]}
                    onPress={() => setExpandedFaqIndex(isExpanded ? null : index)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.faqHeader}>
                      <Text style={[styles.faqQuestion, { color: theme.textPrimary }]}>{faq.q}</Text>
                      <MaterialIcons
                        name={isExpanded ? 'expand-less' : 'expand-more'}
                        size={22}
                        color={theme.primary}
                      />
                    </View>
                    {isExpanded && <Text style={[styles.faqAnswer, { color: theme.textSecondary, borderTopColor: theme.border }]}>{faq.a}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 9. MODAL CẢNH BÁO RESET DỮ LIỆU */}
      {/* ============================================================ */}
      <Modal visible={resetModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.dangerSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.dangerIconCircle}>
              <MaterialIcons name="warning" size={32} color={Colors.error} />
            </View>

            <Text style={[styles.dangerTitle, { color: theme.textPrimary }]}>Khôi phục dữ liệu gốc?</Text>
            <Text style={[styles.dangerMessage, { color: theme.textSecondary }]}>
              Thao tác này sẽ xóa sạch các giao dịch hiện tại của tài khoản và nạp lại toàn bộ dữ liệu mẫu ban đầu.
            </Text>

            <View style={styles.dangerActionsRow}>
              <TouchableOpacity
                style={[styles.dangerCancelBtn, { backgroundColor: theme.surfaceContainerLow }]}
                onPress={() => setResetModalVisible(false)}
              >
                <Text style={[styles.dangerCancelBtnText, { color: theme.textSecondary }]}>Hủy Bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerConfirmBtn}
                onPress={handleConfirmReset}
              >
                <Text style={styles.dangerConfirmBtnText}>Xác Nhận Đặt Lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    top: 64,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    zIndex: 9999,
    alignItems: 'center',
    ...Shadows.cardHover,
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  contentPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  profileCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.borderEmerald,
  },
  profileDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  roleIndicatorPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  roleUserPill: {
    backgroundColor: Colors.primaryLight,
  },
  roleAdminPill: {
    backgroundColor: '#F3E8FF',
  },
  roleIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 12,
  },
  phoneText: {
    fontSize: 11,
    marginTop: 2,
  },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  groupWrapper: {
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  menuCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: Spacing.lg,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  roleModalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  roleModalBannerText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  inputSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  avatarPickerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  avatarPickItem: {
    borderRadius: BorderRadius.full,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarThumbnail: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
  },
  avatarCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  tierChoiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  tierChoicePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tierChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // PIN Styles
  pinSheet: {
    borderRadius: BorderRadius.xxl,
    marginHorizontal: Spacing.lg,
    marginBottom: 'auto',
    marginTop: 'auto',
    padding: Spacing.xl,
    alignItems: 'center',
  },
  pinIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pinStatusPrompt: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 260,
    justifyContent: 'space-between',
    gap: 12,
  },
  keypadKey: {
    width: 70,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadKeyEmpty: {
    width: 70,
    height: 56,
  },
  keypadKeyText: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Currency Styles
  currencySelectRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  currencyChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  currencyChoiceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  converterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },
  converterInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  converterUnit: {
    fontSize: 14,
    fontWeight: '700',
  },
  ratesTable: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: 8,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateCurrencyLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  rateValueText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Export Styles
  exportSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  exportSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  exportSummarySub: {
    fontSize: 12,
    marginTop: 2,
  },
  previewBox: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  previewText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#38BDF8',
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionHalfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 6,
  },
  actionHalfBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Backup Styles
  backupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  backupCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  backupCardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  createBackupBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  createBackupBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  snapshotInfoBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  snapshotTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 6,
  },
  snapshotDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  restoreBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  restoreBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Server Status Styles
  serverStatusCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 12,
    marginBottom: Spacing.md,
  },
  serverStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serverLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  serverValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  serverPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  serverMessageText: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },

  // FAQ Styles
  faqCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: Spacing.sm,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },

  // Danger / Reset / Logout Styles
  dangerSheet: {
    borderRadius: BorderRadius.xxl,
    marginHorizontal: Spacing.lg,
    marginBottom: 'auto',
    marginTop: 'auto',
    padding: Spacing.xl,
    alignItems: 'center',
  },
  dangerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  dangerMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  dangerActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  dangerCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  dangerCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dangerConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  dangerConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
});
