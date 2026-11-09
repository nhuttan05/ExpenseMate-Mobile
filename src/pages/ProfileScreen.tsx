import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
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

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { transactions } = useAppSelector((state) => state.expense);
  const { wallets } = useAppSelector((state) => state.wallet);
  const { currentUser } = useAppSelector((state) => state.auth);

  // User State synced with active account
  const [user, setUser] = useState({
    name: currentUser?.name || initialUser.name,
    email: currentUser?.email || initialUser.email,
    phone: '+84 987 654 321',
    avatarUrl: currentUser?.avatarUrl || initialUser.avatarUrl,
    tier: currentUser?.tier || initialUser.tier,
    role: currentUser?.role || 'USER',
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
      });
    }
  }, [currentUser]);

  // Security & App Settings
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [userPin, setUserPin] = useState('1234');
  const [selectedCurrency, setSelectedCurrency] = useState<'VND' | 'USD' | 'EUR' | 'JPY'>('VND');

  // Async States
  const [isSyncing, setIsSyncing] = useState(false);
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

  // Edit Profile Form State
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editAvatar, setEditAvatar] = useState(user.avatarUrl);

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

  // 1. Chỉnh sửa hồ sơ
  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Lỗi nhập liệu', 'Họ tên và email không được để trống.');
      return;
    }
    setUser({
      ...user,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      avatarUrl: editAvatar,
    });
    setEditProfileVisible(false);
    Alert.alert('Thành công', 'Thông tin cá nhân đã được lưu cập nhật.');
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
            Alert.alert('Đổi mã PIN thành công', 'Mã PIN bảo mật mới đã được áp dụng.');
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
      Alert.alert('Đã sao chép CSV', `Đã sao chép ${transactions.length} dòng dữ liệu vào bộ nhớ tạm.`);
    } else {
      Alert.alert(
        'Đã tạo bảng CSV',
        `Đã tạo cấu trúc CSV gồm ${transactions.length} giao dịch thành công. Bạn có thể xem trước bên dưới.`
      );
    }
  };

  // 5. Sao lưu & Phục hồi JSON
  const handleCreateBackup = async () => {
    const snapshot = await exportAllDataSnapshot();
    setSavedSnapshot(snapshot);
    Alert.alert(
      'Sao lưu thành công',
      `Bản snapshot gồm ${snapshot.transactions.length} giao dịch, ${snapshot.wallets.length} ví, ${snapshot.jars.length} hũ đã được lưu trữ an toàn.`
    );
  };

  const handleRestoreBackup = async () => {
    if (!savedSnapshot) {
      Alert.alert('Chưa có bản sao lưu', 'Vui lòng tạo bản sao lưu trước khi khôi phục.');
      return;
    }
    const success = await restoreDataSnapshot(savedSnapshot);
    if (success) {
      dispatch(loadTransactions());
      dispatch(loadWalletsAndJars());
      dispatch(loadBudgets());
      setBackupModalVisible(false);
      Alert.alert('Khôi phục hoàn tất', 'Dữ liệu đã được phục hồi chính xác từ bản sao lưu gần nhất.');
    } else {
      Alert.alert('Khôi phục thất bại', 'Không thể khôi phục dữ liệu lúc này.');
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
      Alert.alert('Chế độ Offline / Thiết bị', 'Dữ liệu đang được lưu hoàn toàn trên SQLite cục bộ. Đăng nhập để kích hoạt đồng bộ đám mây.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await ApiService.syncLocalToCloud(transactions);
      Alert.alert('Đồng bộ thành công', `Đã đồng bộ ${res.count} giao dịch lên máy chủ an toàn.`);
    } catch (error: any) {
      Alert.alert('Thông báo đồng bộ', error?.response?.data?.error?.message || 'Đồng bộ tạm thời gián đoạn. Dữ liệu trên SQLite vẫn nguyên vẹn.');
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
      Alert.alert('Khôi phục thành công', 'Toàn bộ dữ liệu cơ sở dữ liệu đã được đặt lại về trạng thái mẫu ban đầu.');
    } else {
      Alert.alert('Lỗi', 'Không thể đặt lại cơ sở dữ liệu.');
    }
  };

  // 9. Đăng xuất
  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản ExpenseMate? Dữ liệu cục bộ trên máy vẫn được bảo toàn an toàn.',
      [
        { text: 'Hủy bỏ', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await AuthApi.logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  };

  const numAmount = parseFloat(converterAmount) || 0;

  return (
    <ScreenContainer>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ & Cài đặt</Text>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={handleSyncCloud}
          disabled={isSyncing}
          activeOpacity={0.7}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialIcons name="cloud-done" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.contentPadding}>
        {/* PROFILE CARD */}
        <TouchableOpacity
          style={[styles.profileCard, Shadows.card]}
          onPress={() => {
            setEditName(user.name);
            setEditEmail(user.email);
            setEditPhone(user.phone);
            setEditAvatar(user.avatarUrl);
            setEditProfileVisible(true);
          }}
          activeOpacity={0.88}
        >
          <Image source={{ uri: user.avatarUrl }} style={styles.avatarLarge} />
          <View style={styles.profileDetails}>
            <View style={styles.badgeRow}>
              <Text style={styles.userName}>{user.name}</Text>
              <View style={styles.tierBadge}>
                <MaterialIcons name="verified" size={12} color={Colors.primary} />
                <Text style={styles.tierText}>{user.tier}</Text>
              </View>
            </View>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.phoneText}>{user.phone}</Text>
          </View>
          <View style={styles.editProfileBtn}>
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        {/* BENTO STATS QUICK STRIP */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>GIAO DỊCH</Text>
            <Text style={styles.statNumber}>{transactions.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>VÍ HOẠT ĐỘNG</Text>
            <Text style={styles.statNumber}>{wallets.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TIỀN TỆ</Text>
            <Text style={styles.statNumber}>{selectedCurrency}</Text>
          </View>
        </View>

        {/* ======================================================== */}
        {/* ĐẶC QUYỀN QUẢN TRỊ VIÊN (CHỈ HIỂN THỊ KHI ROLE LÀ ADMIN) */}
        {/* ======================================================== */}
        {currentUser?.role === 'ADMIN' && (
          <View style={styles.groupWrapper}>
            <Text style={[styles.groupTitle, { color: '#7C3AED' }]}>ĐẶC QUYỀN QUẢN TRỊ VIÊN</Text>
            <View style={[styles.menuCard, Shadows.card, { borderColor: '#DDD6FE', borderWidth: 1.5 }]}>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: '#FAF5FF' }]}
                onPress={() => navigation.navigate('Admin')}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: '#7C3AED' }]}>
                  <MaterialIcons name="admin-panel-settings" size={20} color="#FFF" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuText, { color: '#6D28D9' }]}>Bảng Điều Khiển Quản Trị Hệ Thống</Text>
                  <Text style={styles.menuSubText}>Quản lý tài khoản, cấu hình 6 Hũ toàn sàn & Audit Logs</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SETTINGS GROUP 1: HỆ THỐNG & KẾT NỐI */}
        <View style={styles.groupWrapper}>
          <Text style={styles.groupTitle}>HỆ THỐNG & ĐỒNG BỘ DỮ LIỆU</Text>
          <View style={[styles.menuCard, Shadows.card]}>
            {/* Server Health Status */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setServerModalVisible(true);
                handleTestServerHealth();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <MaterialIcons name="dns" size={20} color={Colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Trạng thái Máy chủ & Database</Text>
                <Text style={styles.menuSubText}>Kiểm tra Docker Container & Postgres 5433</Text>
              </View>
              <View style={styles.statusDotRow}>
                <View style={[styles.liveDot, { backgroundColor: Colors.income }]} />
                <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Cloud Sync */}
            <TouchableOpacity style={styles.menuItem} onPress={handleSyncCloud} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                <MaterialIcons name="cloud-sync" size={20} color={Colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Đồng bộ tức thì lên Cloud</Text>
                <Text style={styles.menuSubText}>{transactions.length} giao dịch trong SQLite nội bộ</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Exchange Rates */}
            <TouchableOpacity style={styles.menuItem} onPress={handleOpenCurrencyModal} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="currency-exchange" size={20} color="#D97706" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Tiền tệ & Tỷ giá hối đoái</Text>
                <Text style={styles.menuSubText}>Đang dùng {selectedCurrency} • Quy đổi ngoại tệ thông minh</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SETTINGS GROUP 2: BẢO MẬT & MÃ PIN */}
        <View style={styles.groupWrapper}>
          <Text style={styles.groupTitle}>BẢO MẬT & QUYỀN RIÊNG TƯ</Text>
          <View style={[styles.menuCard, Shadows.card]}>
            {/* Biometrics */}
            <View style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <MaterialIcons name="fingerprint" size={20} color={Colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Xác thực FaceID / Vân tay</Text>
                <Text style={styles.menuSubText}>Bảo mật mở khoá tức thì khi vào app</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={(val) => {
                  setBiometricsEnabled(val);
                  Alert.alert('Cập nhật bảo mật', val ? 'Đã kích hoạt FaceID/Vân tay.' : 'Đã tắt xác thực sinh trắc học.');
                }}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            {/* Change PIN */}
            <TouchableOpacity
              style={styles.menuItem}
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
                <Text style={styles.menuText}>Mã PIN bảo mật (4 chữ số)</Text>
                <Text style={styles.menuSubText}>Đang thiết lập: •••• (Chạm để đổi mã)</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Notifications */}
            <View style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: '#FFE4E6' }]}>
                <MaterialIcons name="notifications-active" size={20} color="#BE123C" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Cảnh báo chi tiêu thông minh</Text>
                <Text style={styles.menuSubText}>Thông báo khi hũ chi tiêu vượt 80%</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            {/* Dark Mode */}
            <View style={styles.menuItem}>
              <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
                <MaterialIcons name="dark-mode" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Giao diện ban đêm (Dark Mode)</Text>
                <Text style={styles.menuSubText}>Tự động đồng bộ theo hệ thống thiết bị</Text>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* SETTINGS GROUP 3: SAO LƯU & TRÍCH XUẤT */}
        <View style={styles.groupWrapper}>
          <Text style={styles.groupTitle}>SAO LƯU & XUẤT DỮ LIỆU</Text>
          <View style={[styles.menuCard, Shadows.card]}>
            {/* Export CSV */}
            <TouchableOpacity style={styles.menuItem} onPress={() => setExportModalVisible(true)} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                <MaterialIcons name="file-download" size={20} color="#0284C7" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Xuất báo cáo giao dịch (CSV / Excel)</Text>
                <Text style={styles.menuSubText}>Bảng tính hoàn chỉnh gồm ngày, loại, hũ chi tiêu</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Backup & Restore JSON */}
            <TouchableOpacity style={styles.menuItem} onPress={() => setBackupModalVisible(true)} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF9C3' }]}>
                <MaterialIcons name="settings-backup-restore" size={20} color="#CA8A04" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Sao lưu & Khôi phục (JSON Snapshot)</Text>
                <Text style={styles.menuSubText}>Lưu bản sao an toàn & khôi phục toàn bộ bảng</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* FAQ & Guide */}
            <TouchableOpacity style={styles.menuItem} onPress={() => setFaqModalVisible(true)} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                <MaterialIcons name="help-outline" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Trung tâm trợ giúp & Hướng dẫn 6 Hũ</Text>
                <Text style={styles.menuSubText}>Chi tiết quy tắc T. Harv Eker, What-If Simulator</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SETTINGS GROUP 4: NGUY HIỂM & ĐẶT LẠI */}
        <View style={styles.groupWrapper}>
          <Text style={styles.groupTitle}>NÂNG CAO & HỆ THỐNG</Text>
          <View style={[styles.menuCard, Shadows.card]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setResetModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <MaterialIcons name="restart-alt" size={20} color={Colors.error} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuText, { color: Colors.error }]}>Khôi phục dữ liệu ban đầu (Factory Reset)</Text>
                <Text style={styles.menuSubText}>Làm mới toàn bộ SQLite về bộ dữ liệu chuẩn mẫu</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Đăng xuất khỏi tài khoản</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>
          ExpenseMate Pro v2.5.0 • SQLite Reactive • Docker Postgres 5433 • Clean Minimalist Bento
        </Text>
        <View style={{ height: 110 }} />
      </View>

      {/* ============================================================ */}
      {/* 1. MODAL CHỈNH SỬA HỒ SƠ */}
      {/* ============================================================ */}
      <Modal visible={editProfileVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ cá nhân</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputSectionLabel}>CHỌN ẢNH ĐẠI DIỆN</Text>
              <View style={styles.avatarPickerRow}>
                {AVATAR_OPTIONS.map((uri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.avatarPickItem,
                      editAvatar === uri && styles.avatarPickItemActive,
                    ]}
                    onPress={() => setEditAvatar(uri)}
                  >
                    <Image source={{ uri }} style={styles.avatarThumbnail} />
                    {editAvatar === uri && (
                      <View style={styles.avatarCheckBadge}>
                        <MaterialIcons name="check" size={12} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputSectionLabel}>HỌ VÀ TÊN</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nhập họ và tên"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputSectionLabel}>EMAIL</Text>
              <TextInput
                style={styles.textInput}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Nhập địa chỉ email"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputSectionLabel}>SỐ ĐIỆN THOẠI</Text>
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="Nhập số điện thoại"
                placeholderTextColor={Colors.textMuted}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.85}>
                <MaterialIcons name="check-circle" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Lưu Thay Đổi</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 2. MODAL BẢO MẬT MÃ PIN */}
      {/* ============================================================ */}
      <Modal visible={securityModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pinSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bảo Mật Mã PIN</Text>
              <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pinIconCircle}>
              <MaterialIcons name="lock" size={32} color={Colors.primary} />
            </View>

            <Text style={styles.pinStatusPrompt}>{pinStatusMessage}</Text>

            {/* 4 PIN Dots */}
            <View style={styles.pinDotsRow}>
              {[0, 1, 2, 3].map((index) => {
                const filled = pinInput.length > index;
                return (
                  <View
                    key={index}
                    style={[styles.pinDot, filled && styles.pinDotFilled]}
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
                      style={styles.keypadKey}
                      onPress={handlePinBackspace}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="backspace" size={22} color={Colors.textPrimary} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.keypadKey}
                    onPress={() => handlePinKeyPress(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.keypadKeyText}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 3. MODAL TIỀN TỆ & TỶ GIÁ NGOẠI TỆ */}
      {/* ============================================================ */}
      <Modal visible={currencyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tiền tệ & Tỷ giá hối đoái</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputSectionLabel}>CHỌN ĐƠN VỊ TIỀN TỆ HIỂN THỊ</Text>
              <View style={styles.currencySelectRow}>
                {(['VND', 'USD', 'EUR', 'JPY'] as const).map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={[
                      styles.currencyChoiceBtn,
                      selectedCurrency === curr && styles.currencyChoiceBtnActive,
                    ]}
                    onPress={() => setSelectedCurrency(curr)}
                  >
                    <Text
                      style={[
                        styles.currencyChoiceText,
                        selectedCurrency === curr && styles.currencyChoiceTextActive,
                      ]}
                    >
                      {curr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputSectionLabel}>CÔNG CỤ QUY ĐỔI NHANH (LIVE RATES)</Text>
              <View style={styles.converterInputContainer}>
                <TextInput
                  style={styles.converterInput}
                  value={converterAmount}
                  onChangeText={setConverterAmount}
                  keyboardType="numeric"
                  placeholder="Nhập số tiền VND..."
                />
                <Text style={styles.converterUnit}>₫ VND</Text>
              </View>

              {ratesLoading ? (
                <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.primary} />
              ) : (
                <View style={styles.ratesTable}>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateCurrencyLabel}>🇺🇸 USD (Đô la Mỹ)</Text>
                    <Text style={styles.rateValueText}>
                      ≈ {(numAmount / (rates.USD || 25450)).toFixed(2)} $
                    </Text>
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateCurrencyLabel}>🇪🇺 EUR (Euro)</Text>
                    <Text style={styles.rateValueText}>
                      ≈ {(numAmount / (rates.EUR || 27100)).toFixed(2)} €
                    </Text>
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateCurrencyLabel}>🇯🇵 JPY (Yên Nhật)</Text>
                    <Text style={styles.rateValueText}>
                      ≈ {Math.round(numAmount / (rates.JPY || 168)).toLocaleString('vi-VN')} ¥
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.infoAlertBox}>
                <MaterialIcons name="info" size={18} color={Colors.info} />
                <Text style={styles.infoAlertText}>
                  Tỷ giá tham chiếu liên ngân hàng thời gian thực qua Axios Network API.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
                  setCurrencyModalVisible(false);
                  Alert.alert('Thành công', `Đã lưu thiết lập tiền tệ: ${selectedCurrency}`);
                }}
              >
                <Text style={styles.saveBtnText}>Áp Dụng Thiết Lập</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 4. MODAL XUẤT CSV BÁO CÁO */}
      {/* ============================================================ */}
      <Modal visible={exportModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xuất Dữ Liệu Báo Cáo</Text>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.exportSummaryCard}>
                <MaterialIcons name="table-view" size={32} color={Colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.exportSummaryTitle}>Sẵn sàng xuất file CSV</Text>
                  <Text style={styles.exportSummarySub}>
                    Tổng cộng: {transactions.length} giao dịch • Định dạng chuẩn UTF-8
                  </Text>
                </View>
              </View>

              <Text style={styles.inputSectionLabel}>XEM TRƯỚC DỮ LIỆU (5 DÒNG ĐẦU TIÊN)</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewText} numberOfLines={8}>
                  {generateCSVContent().split('\n').slice(0, 6).join('\n')}
                </Text>
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.actionHalfBtn} onPress={handleCopyCSV} activeOpacity={0.85}>
                  <MaterialIcons name="content-copy" size={18} color="#FFF" />
                  <Text style={styles.actionHalfBtnText}>Sao Chép CSV</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionHalfBtn, { backgroundColor: Colors.secondary }]}
                  onPress={() => {
                    Alert.alert(
                      'Tải file báo cáo',
                      `Đã khởi tạo gói xuất file ExpenseMate_Report_${new Date().toISOString().slice(0, 10)}.csv thành công.`
                    );
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
      {/* 5. MODAL SAO LƯU & KHÔI PHỤC JSON */}
      {/* ============================================================ */}
      <Modal visible={backupModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sao Lưu & Khôi Phục JSON</Text>
              <TouchableOpacity onPress={() => setBackupModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.backupCard}>
                <MaterialIcons name="cloud-upload" size={28} color={Colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.backupCardTitle}>Tạo bản sao lưu toàn diện</Text>
                  <Text style={styles.backupCardSub}>
                    Ghi lại giao dịch, ví, hũ chi tiêu và ngân sách vào một snapshot.
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.createBackupBtn} onPress={handleCreateBackup} activeOpacity={0.85}>
                <MaterialIcons name="add-to-photos" size={18} color="#FFF" />
                <Text style={styles.createBackupBtnText}>Tạo Bản Sao Lưu Mới</Text>
              </TouchableOpacity>

              {savedSnapshot && (
                <View style={styles.snapshotInfoBox}>
                  <Text style={styles.snapshotTitle}>Bản sao lưu hiện hữu:</Text>
                  <Text style={styles.snapshotDetail}>• Thời gian tạo: {new Date(savedSnapshot.exportedAt).toLocaleString('vi-VN')}</Text>
                  <Text style={styles.snapshotDetail}>• Giao dịch: {savedSnapshot.transactions.length}</Text>
                  <Text style={styles.snapshotDetail}>• Số lượng ví: {savedSnapshot.wallets.length}</Text>
                  <Text style={styles.snapshotDetail}>• Số hũ phân bổ: {savedSnapshot.jars.length}</Text>

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
      {/* 6. MODAL KIỂM TRA MÁY CHỦ & BACKEND */}
      {/* ============================================================ */}
      <Modal visible={serverModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kết Nối Máy Chủ & Database</Text>
              <TouchableOpacity onPress={() => setServerModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.serverStatusCard}>
                <View style={styles.serverStatusRow}>
                  <Text style={styles.serverLabel}>Backend Container:</Text>
                  <View style={styles.serverPill}>
                    <View style={[styles.liveDot, { backgroundColor: serverStatus.online ? Colors.income : Colors.expense }]} />
                    <Text style={styles.serverPillText}>{serverStatus.online ? 'ONLINE' : 'OFFLINE'}</Text>
                  </View>
                </View>

                <View style={styles.serverStatusRow}>
                  <Text style={styles.serverLabel}>Postgres Host Port:</Text>
                  <Text style={styles.serverValue}>5433:5432</Text>
                </View>

                <View style={styles.serverStatusRow}>
                  <Text style={styles.serverLabel}>Độ trễ phản hồi (Latency):</Text>
                  <Text style={styles.serverValue}>{serverStatus.latency} ms</Text>
                </View>

                <View style={styles.serverStatusRow}>
                  <Text style={styles.serverLabel}>Trạng thái cơ sở dữ liệu:</Text>
                  <Text style={styles.serverValue}>{serverStatus.dbStatus}</Text>
                </View>
              </View>

              <Text style={styles.serverMessageText}>{serverStatus.message}</Text>

              <TouchableOpacity style={styles.saveBtn} onPress={handleTestServerHealth} activeOpacity={0.85}>
                <MaterialIcons name="refresh" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Kiểm Tra Lại Kết Nối</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 7. MODAL TRUNG TÂM TRỢ GIÚP & FAQ */}
      {/* ============================================================ */}
      <Modal visible={faqModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hướng Dẫn & Trợ Giúp</Text>
              <TouchableOpacity onPress={() => setFaqModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
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
                  q: '3. Làm thế nào để quản lý nhiều ví cùng lúc?',
                  a: 'Hệ thống hỗ trợ Tiền mặt, Tài khoản ngân hàng, Ví điện tử MoMo, Thẻ tín dụng. Bạn có thể thực hiện chuyển tiền giữa các ví một cách dễ dàng và minh bạch.',
                },
                {
                  q: '4. Dữ liệu của tôi được lưu trữ ở đâu?',
                  a: 'Dữ liệu được lưu trữ an toàn trong SQLite ngay trên thiết bị của bạn. Khi có kết nối mạng và tài khoản, dữ liệu sẽ được đồng bộ hóa lên máy chủ đám mây được mã hóa.',
                },
              ].map((faq, index) => {
                const isExpanded = expandedFaqIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.faqCard}
                    onPress={() => setExpandedFaqIndex(isExpanded ? null : index)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.faqHeader}>
                      <Text style={styles.faqQuestion}>{faq.q}</Text>
                      <MaterialIcons
                        name={isExpanded ? 'expand-less' : 'expand-more'}
                        size={22}
                        color={Colors.primary}
                      />
                    </View>
                    {isExpanded && <Text style={styles.faqAnswer}>{faq.a}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 8. MODAL CẢNH BÁO RESET DỮ LIỆU */}
      {/* ============================================================ */}
      <Modal visible={resetModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.dangerSheet}>
            <View style={styles.dangerIconCircle}>
              <MaterialIcons name="warning" size={32} color={Colors.error} />
            </View>

            <Text style={styles.dangerTitle}>Khôi phục dữ liệu gốc?</Text>
            <Text style={styles.dangerMessage}>
              Thao tác này sẽ xóa sạch các giao dịch hiện tại và nạp lại toàn bộ dữ liệu mẫu ban đầu (6 hũ tài chính, các ví ảo, ngân sách chuẩn).
            </Text>

            <View style={styles.dangerActionsRow}>
              <TouchableOpacity
                style={styles.dangerCancelBtn}
                onPress={() => setResetModalVisible(false)}
              >
                <Text style={styles.dangerCancelBtnText}>Hủy Bỏ</Text>
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
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  profileDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  groupWrapper: {
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
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
    color: Colors.textPrimary,
  },
  menuSubText: {
    fontSize: 12,
    color: Colors.textMuted,
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
    color: Colors.textMuted,
    marginTop: Spacing.lg,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '85%',
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
    color: Colors.textPrimary,
  },
  inputSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
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
  avatarPickItemActive: {
    borderColor: Colors.primary,
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
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pinStatusPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
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
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.surfaceContainerLow,
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
    color: Colors.textPrimary,
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
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyChoiceBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  currencyChoiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  currencyChoiceTextActive: {
    color: '#FFF',
  },
  converterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  converterInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  converterUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  ratesTable: {
    backgroundColor: '#F8FAFC',
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
    color: Colors.textPrimary,
  },
  rateValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 6,
    marginTop: Spacing.md,
  },
  infoAlertText: {
    fontSize: 11,
    color: Colors.info,
    flex: 1,
  },

  // Export Styles
  exportSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  exportSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  exportSummarySub: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  backupCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  backupCardSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  createBackupBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
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
    backgroundColor: '#F8FAFC',
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
    color: Colors.textSecondary,
  },
  serverValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
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
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },

  // FAQ Styles
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  faqAnswer: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: Spacing.sm,
  },

  // Danger / Reset Styles
  dangerSheet: {
    backgroundColor: Colors.surface,
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
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  dangerMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
  },
  dangerCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
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
