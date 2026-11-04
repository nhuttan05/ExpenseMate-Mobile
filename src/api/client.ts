import axios from 'axios';

// Base Axios instance
// Axios exposes `create` through its default instance in the React Native bundle.
// eslint-disable-next-line import/no-named-as-default-member
export const apiClient = axios.create({
  baseURL: 'https://api.expensemate.internal/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: add auth token or custom metadata
apiClient.interceptors.request.use(
  (config) => {
    // In production: attach Bearer Token if user is authenticated
    // config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: graceful fallback handling for mobile offline / mock environment
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('[Axios API Client] API request warning:', error?.message || error);
    return Promise.reject(error);
  }
);
