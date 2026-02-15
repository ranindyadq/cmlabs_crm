// JWT Secret - WAJIB diset di production
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  
  // Di production, JWT_SECRET WAJIB ada
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('❌ FATAL: JWT_SECRET environment variable is required in production!');
  }
  
  // Di development, boleh pakai fallback (untuk kemudahan testing)
  if (!secret) {
    console.warn('⚠️ WARNING: JWT_SECRET not set. Using default secret (ONLY for development!)');
    return 'dev_secret_cmlabs_crm_2026';
  }
  
  return secret;
};

export const JWT_SECRET = getJwtSecret();