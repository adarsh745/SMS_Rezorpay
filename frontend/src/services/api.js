import axios from 'axios';

// Create Axios instance pointing to the FastAPI backend URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.29.241:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Authorization header with JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global errors (e.g. 401 Unauthorized logouts)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns a 401 Unauthorized, automatically clear token and reload
    if (error.response && error.response.status === 401) {
      const isAuthRequest = error.config.url.includes('/api/auth/');
      if (!isAuthRequest) {
        localStorage.removeItem('token');
        // Optional: Redirect or reload to trigger login redirect
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
