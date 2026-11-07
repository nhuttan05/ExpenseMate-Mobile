import { apiClient, setApiAccessToken } from './client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface ApiResponse<T> {
  data: T;
}

let currentSession: AuthSession | null = null;

const setSession = (session: AuthSession) => {
  currentSession = session;
  setApiAccessToken(session.accessToken);
  return session;
};

export const AuthApi = {
  async register(name: string, email: string, password: string): Promise<AuthSession> {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/register', { name, email, password });
    return setSession(response.data.data);
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', { email, password });
    return setSession(response.data.data);
  },

  async refresh(): Promise<AuthSession | null> {
    if (!currentSession) return null;
    const response = await apiClient.post<ApiResponse<Omit<AuthSession, 'user'>>>('/auth/refresh', { refreshToken: currentSession.refreshToken });
    return setSession({ ...currentSession, ...response.data.data });
  },

  async logout(): Promise<void> {
    if (currentSession) {
      try {
        await apiClient.post('/auth/logout', { refreshToken: currentSession.refreshToken });
      } catch {
        // Clear the local session even when the device is offline.
      } finally {
        currentSession = null;
        setApiAccessToken(null);
      }
    }
  },

  async requestPasswordReset(email: string): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
    return response.data.data.message;
  },

  getAccessToken: () => currentSession?.accessToken || null,
};
