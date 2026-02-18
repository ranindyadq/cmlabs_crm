import axios from 'axios';

// Gunakan URL API yang sudah Anda definisikan di .env
const API_BASE_URL = "/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ====================================================================
// 1. REQUEST INTERCEPTOR: MELAMPIRKAN TOKEN
// ====================================================================

// Interceptor untuk menyisipkan token otomatis
apiClient.interceptors.request.use((config) => {
  // ✅ UPDATE: Cek di localStorage dulu, kalau tidak ada cek sessionStorage
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
  },
  (error) => Promise.reject(error)
);

// ====================================================================
// 2. RESPONSE INTERCEPTOR: ERROR GLOBAL (401/403)
// ====================================================================

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response ? error.response.status : null;
    const url = error.config?.url || '';

    const isAuthEndpoint = url.includes('/auth/');

    if (status === 401 && !isAuthEndpoint) {
      console.warn("💀 Sesi berakhir (401). Redirect ke login...");
      
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        console.error("Failed to call logout API", e);
      }
      
      window.location.href = '/auth/signin';
    }

    return Promise.reject(error);
  }
);

export default apiClient;