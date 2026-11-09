import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, UserRole, UserAccountStatus, SystemAuditLog } from '../../types';
import { mockUser, initialSystemUsers, initialAuditLogs, accountStores } from '../../data/mockData';

const DARK_STORAGE_KEY_PREFIX = 'expensemate_darkmode_';

export const getSavedDarkModeForAccount = (userId: string, defaultVal: boolean = false): boolean => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(DARK_STORAGE_KEY_PREFIX + userId);
      if (val !== null) return val === 'true';
    }
  } catch {}
  if (accountStores[userId]?.user?.isDarkMode !== undefined) {
    return !!accountStores[userId].user.isDarkMode;
  }
  return defaultVal;
};

export const persistDarkModeForAccount = (userId: string, isDark: boolean): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DARK_STORAGE_KEY_PREFIX + userId, isDark ? 'true' : 'false');
    }
  } catch {}
  if (accountStores[userId]) {
    accountStores[userId].user.isDarkMode = isDark;
  }
};

interface AuthState {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  activeViewMode: 'USER' | 'ADMIN';
  usersList: UserProfile[];
  auditLogs: SystemAuditLog[];
  isDarkMode: boolean;
}

const initialDark = getSavedDarkModeForAccount(mockUser.id, mockUser.isDarkMode ?? false);

const initialState: AuthState = {
  currentUser: { ...mockUser, isDarkMode: initialDark },
  isAuthenticated: true,
  activeViewMode: mockUser.role,
  usersList: initialSystemUsers,
  auditLogs: initialAuditLogs,
  isDarkMode: initialDark,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<UserProfile>) => {
      // Khôi phục chính xác chế độ Sáng/Tối đã lưu của riêng account này
      const userDark = getSavedDarkModeForAccount(
        action.payload.id,
        action.payload.isDarkMode ?? false
      );
      state.currentUser = {
        ...action.payload,
        isDarkMode: userDark,
      };
      state.isAuthenticated = true;
      state.activeViewMode = action.payload.role;
      state.isDarkMode = userDark;
    },
    updateCurrentUserProfile: (
      state,
      action: PayloadAction<Partial<UserProfile>>
    ) => {
      state.currentUser = {
        ...state.currentUser,
        ...action.payload,
      };
      // Đồng bộ trong danh sách usersList
      const idx = state.usersList.findIndex((u) => u.id === state.currentUser.id);
      if (idx !== -1) {
        state.usersList[idx] = {
          ...state.usersList[idx],
          ...action.payload,
        };
      }
    },
    toggleDarkMode: (state) => {
      const nextMode = !state.isDarkMode;
      state.isDarkMode = nextMode;
      state.currentUser.isDarkMode = nextMode;
      persistDarkModeForAccount(state.currentUser.id, nextMode);

      const idx = state.usersList.findIndex((u) => u.id === state.currentUser.id);
      if (idx !== -1) {
        state.usersList[idx].isDarkMode = nextMode;
      }
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
      state.currentUser.isDarkMode = action.payload;
      persistDarkModeForAccount(state.currentUser.id, action.payload);

      const idx = state.usersList.findIndex((u) => u.id === state.currentUser.id);
      if (idx !== -1) {
        state.usersList[idx].isDarkMode = action.payload;
      }
    },
    registerNewUser: (state, action: PayloadAction<UserProfile>) => {
      const newUser = action.payload;
      state.usersList.unshift(newUser);
      state.currentUser = newUser;
      state.isAuthenticated = true;
      state.activeViewMode = newUser.role;
      state.isDarkMode = newUser.isDarkMode ?? false;
      persistDarkModeForAccount(newUser.id, state.isDarkMode);

      state.auditLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleString('vi-VN'),
        actorEmail: newUser.email,
        action: `Đăng ký tài khoản mới: ${newUser.name} (${newUser.email})`,
        category: 'AUTH',
        status: 'SUCCESS',
        details: `Tạo tài khoản và cô lập dữ liệu cá nhân thành công`,
      });
    },
    switchViewMode: (state, action: PayloadAction<'USER' | 'ADMIN'>) => {
      // Chỉ Admin mới được phép đổi view mode
      if (state.currentUser.role === 'ADMIN') {
        state.activeViewMode = action.payload;
      }
    },
    toggleUserStatus: (state, action: PayloadAction<string>) => {
      const user = state.usersList.find((u) => u.id === action.payload);
      if (user) {
        user.status = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
        state.auditLogs.unshift({
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actorEmail: state.currentUser.email,
          action: `${user.status === 'LOCKED' ? 'Khóa' : 'Kích hoạt lại'} tài khoản ${user.email}`,
          category: 'SECURITY',
          status: user.status === 'LOCKED' ? 'WARNING' : 'SUCCESS',
          details: `Thực hiện bởi Quản trị viên ${state.currentUser.name}`,
        });
      }
    },
    updateUserRole: (state, action: PayloadAction<{ userId: string; role: UserRole }>) => {
      const user = state.usersList.find((u) => u.id === action.payload.userId);
      if (user) {
        user.role = action.payload.role;
        state.auditLogs.unshift({
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actorEmail: state.currentUser.email,
          action: `Đổi vai trò người dùng ${user.email} thành ${action.payload.role}`,
          category: 'CONFIG',
          status: 'SUCCESS',
          details: `Phân quyền RBAC cập nhật thành công`,
        });
      }
    },
    addAuditLog: (
      state,
      action: PayloadAction<Omit<SystemAuditLog, 'id' | 'timestamp'>>
    ) => {
      state.auditLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleString('vi-VN'),
        ...action.payload,
      });
    },
    logout: (state) => {
      state.currentUser = mockUser;
      state.isAuthenticated = false;
      state.activeViewMode = 'USER';
    },
  },
});

export const {
  setCurrentUser,
  updateCurrentUserProfile,
  toggleDarkMode,
  setDarkMode,
  registerNewUser,
  switchViewMode,
  toggleUserStatus,
  updateUserRole,
  addAuditLog,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
