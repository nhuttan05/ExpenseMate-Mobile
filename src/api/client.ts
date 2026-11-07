import axios from 'axios';
import { Platform } from 'react-native';

const rawConfiguredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const configuredApiUrl = rawConfiguredApiUrl && !rawConfiguredApiUrl.includes('YOUR_COMPUTER_LAN_IP')
  ? rawConfiguredApiUrl
  : undefined;
const browserHost = typeof window !== 'undefined' && window.location?.hostname
  ? window.location.hostname
  : 'localhost';
const defaultApiUrl = Platform.OS === 'web'
  ? `http://${browserHost}:3000/api/v1`
  : 'http://localhost:3000/api/v1';

// Base Axios instance
// Axios exposes `create` through its default instance in the React Native bundle.
// eslint-disable-next-line import/no-named-as-default-member
export const apiClient = axios.create({
  baseURL: (configuredApiUrl || defaultApiUrl).replace(/\/+$/, ''),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let accessToken: string | null = null;

export const setApiAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getApiAccessToken = () => accessToken;

// Request interceptor: add auth token or custom metadata
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: graceful fallback handling for mobile offline / mock environment
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    const isExternalRequest = /^https?:\/\//i.test(requestUrl);
    if ((!status || status >= 500) && !isExternalRequest) {
      console.warn('[Axios API Client] API request warning:', error?.message || error);
    }
    return Promise.reject(error);
  }
);
