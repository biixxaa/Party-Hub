import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('partyhub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      // Clear token if expired
      localStorage.removeItem('partyhub_token');
      localStorage.removeItem('partyhub_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
