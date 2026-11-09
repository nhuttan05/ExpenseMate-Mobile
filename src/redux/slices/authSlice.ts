import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, UserRole, UserAccountStatus, SystemAuditLog } from '../../types';
import { mockUser, initialSystemUsers, initialAuditLogs } from '../../data/mockData';

interface AuthState {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  activeViewMode: 'USER' | 'ADMIN';
  usersList: UserProfile[];
  auditLogs: SystemAuditLog[];
}

const initialState: AuthState = {
  currentUser: mockUser,
  isAuthenticated: true,
  activeViewMode: mockUser.role,
  usersList: initialSystemUsers,
  auditLogs: initialAuditLogs,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<UserProfile>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.activeViewMode = action.payload.role;
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
  switchViewMode,
  toggleUserStatus,
  updateUserRole,
  addAuditLog,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
