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
    
    // --- CCTV DEBUGGING ---
    console.log("🚨 API ERROR TERDETEKSI:", status, error.config.url);

    if (status === 401) {
      console.warn("💀 Sesi berakhir (401). Menghapus Storage...");
      
      // Coba comment dulu baris penghapusan ini untuk mengetes
      // localStorage.clear();  <-- JANGAN DIHAPUS DULU
      // sessionStorage.clear(); <-- JANGAN DIHAPUS DULU
      
      // window.location.href = '/auth/signin';
    }
    // ...
    return Promise.reject(error);
  }
);

export default apiClient;