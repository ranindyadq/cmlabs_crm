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
  (error) => {
    const status = error.response ? error.response.status : null;
    
    // Logika Kritis: Jika status 401 atau 403 (Akses Ditolak/Token Expired)
    if (status === 401 || status === 403) {
      console.warn("Sesi berakhir atau akses ditolak. Mengarahkan ke login...");
      
      // Hapus token yang busuk dari penyimpanan
      localStorage.clear();
      sessionStorage.clear();
      
      // Arahkan ke halaman login
      // Karena ini bukan komponen React, kita gunakan window.location
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth/signin') {
        window.location.href = '/auth/signin';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;