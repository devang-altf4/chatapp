import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add token to requests
api.interceptors.request.use((config) => {
  // If sending FormData, do NOT force a JSON content-type.
  // Let axios/browser set `multipart/form-data` with the correct boundary.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers?.delete) {
      config.headers.delete('Content-Type');
      config.headers.delete('content-type');
    } else {
      config.headers = config.headers || {};
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

  const token = localStorage.getItem('token');
  if (token) {
    if (config.headers?.set) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
