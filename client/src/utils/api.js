import axios from 'axios';
import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach JWT to every request if present
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear stale auth and redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth Endpoints ────────────────────────────────────────

export const registerUser = (email, password) =>
  api.post('/api/auth/register', { email, password });

export const loginUser = (email, password) =>
  api.post('/api/auth/login', { email, password });

// ── Market Endpoints ──────────────────────────────────

export const getMarketData = () => api.get('/api/market');
export const getHistoryData = () => api.get('/api/history');

// ── Trading Endpoints ────────────────────────────────────

export const executeTrade = (type, quantity) =>
  api.post('/api/trade', { type, quantity });

// ── Admin Endpoints ──────────────────────────────────────

export const adminControl = (action) =>
  api.post('/api/admin/control', { action });

export default api;
