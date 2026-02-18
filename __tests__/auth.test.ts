import { POST as signupPOST } from '@/app/api/auth/signup/route';
import { POST as signinPOST } from '@/app/api/auth/login/route';
import { PATCH as profilePATCH } from '@/app/api/profile/route'; 
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

const mockCookieStore = { token: "" };

jest.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => {
      if (name === 'token' && mockCookieStore.token) {
        return { name: 'token', value: mockCookieStore.token };
      }
      return undefined; 
    }
  })
}));

// --- HELPER: Buat Mock Request ---
function createMockRequest(url: string, method: string, body?: any, token?: string, ip?: string) {
  const headers = new Headers();
  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    headers.set('content-type', 'application/json');
  }
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
    headers.set('cookie', `token=${token};`);
  }
  
  // Palsukan IP Address jika diberikan
  if (ip) {
    headers.set('x-forwarded-for', ip);
  }

  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    headers,
    body: (body && method !== 'GET') ? JSON.stringify(body) : undefined,
  });
}

describe('Authentication & Profile Flow', () => {
  const testUser = {
    fullName: "Budi Automation",
    email: "budi.test@cmlabs.co",
    password: "PasswordKuat123!"
  };

  let validAuthToken = "";

  // Persiapan: Buat role VIEWER di DB Test karena endpoint Signup membutuhkannya
  beforeAll(async () => {
    await prisma.role.create({
      data: { name: 'VIEWER' }
    });
  });

  // ==========================================
  // SCENARIO 1: REGISTRASI (SIGNUP) & BCRYPT
  // ==========================================
  describe('1. Pendaftaran Pengguna (Sign Up)', () => {
    
    it('Gagal mendaftar jika data tidak lengkap (400)', async () => {
      const req = createMockRequest('/api/auth/signup', 'POST', { email: "test@mail.com" }); // fullName & password hilang
      const res = await signupPOST(req);
      if (!res) throw new Error("Response is undefined");
      
      expect(res.status).toBe(400);
    });

    it('Gagal mendaftar jika password terlalu pendek (400)', async () => {
      const req = createMockRequest('/api/auth/signup', 'POST', { 
        fullName: "User Pendek", email: "pendek@mail.com", password: "123" 
      });
      const res = await signupPOST(req);
      if (!res) throw new Error("Response is undefined");
      
      expect(res.status).toBe(400);
    });

    it('Berhasil mendaftar dan Password dienkripsi dengan Bcrypt (201)', async () => {
      const req = createMockRequest('/api/auth/signup', 'POST', testUser);
      const res = await signupPOST(req);
      if (!res) throw new Error("Response is undefined");
      
      expect(res.status).toBe(201);

      // CEK KE DATABASE: Pastikan password tidak disimpan dalam bentuk teks biasa (plaintext)
      const dbUser = await prisma.user.findUnique({ where: { email: testUser.email } });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.passwordHash).not.toBe(testUser.password); // Teks asli tidak boleh ada di DB
      
      // Buktikan bahwa hash tersebut benar-benar berasal dari password asli menggunakan Bcrypt
      const isMatch = await bcrypt.compare(testUser.password, dbUser!.passwordHash!);
      expect(isMatch).toBe(true);
    });

    it('Gagal mendaftar dengan email yang sama / Duplikat (409)', async () => {
      const req = createMockRequest('/api/auth/signup', 'POST', testUser); // Kirim data yang sama lagi
      const res = await signupPOST(req);
      if (!res) throw new Error("Response is undefined");
      
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.message).toBe('Email already registered.');
    });
  });

  // ==========================================
  // SCENARIO 2: LOGIN (SIGNIN) & JWT
  // ==========================================
  describe('2. Proses Masuk (Sign In)', () => {
    
    it('Gagal login jika password salah (401)', async () => {
      const req = createMockRequest('/api/auth/signin', 'POST', {
        email: testUser.email,
        password: "PasswordYangSalah99"
      });
      const res = await signinPOST(req);
      if (!res) throw new Error("Response is undefined");
      
      expect(res.status).toBe(401);
    });

    it('Gagal login jika email tidak terdaftar (401)', async () => {
      const req = createMockRequest('/api/auth/signin', 'POST', {
        email: "hantu@mail.com",
        password: "PasswordKuat123!"
      });
      const res = await signinPOST(req);
      if (!res) throw new Error("Response is undefined");
      
      expect(res.status).toBe(401);
    });

    it('Berhasil login dengan kredensial yang benar dan mendapatkan Token JWT (200)', async () => {
      const req = createMockRequest('/api/auth/signin', 'POST', {
        email: testUser.email,
        password: testUser.password
      });
      const res = await signinPOST(req);
      if (!res) throw new Error("Response is undefined");
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      expect(data.message).toBe('Login successful.');
      expect(data.token).toBeDefined(); // Token harus ada
      expect(data.user.email).toBe(testUser.email);
      
      // Simpan token asli ini untuk digunakan mengetes profil di bawah
      validAuthToken = data.token; 
      mockCookieStore.token = data.token;
    });
    it('Sistem Keamanan: Memblokir IP (429) setelah 5 kali gagal login berturut-turut (Brute Force)', async () => {
      const hackerIP = "192.168.66.66"; 
      
      for (let i = 0; i < 5; i++) {
        const req = createMockRequest('/api/auth/login', 'POST', {
          email: testUser.email,
          password: `TebakPasswordKe${i}` 
        }, undefined, hackerIP); 
        
        const res = await signinPOST(req);
        if (!res) throw new Error("Response is undefined");
        
        expect(res.status).toBe(401); 
      }

      
      const reqBlocked = createMockRequest('/api/auth/login', 'POST', {
        email: testUser.email,
        password: testUser.password // Walaupun di percobaan ke-6 dia berhasil menebak password yang BENAR...
      }, undefined, hackerIP);
      
      const resBlocked = await signinPOST(reqBlocked);
      if (!resBlocked) throw new Error("Response is undefined");
      
      // ...Dia tetap ditolak masuk karena kena limit!
      expect(resBlocked.status).toBe(429);
      
      const data = await resBlocked.json();
      expect(data.message).toContain('Terlalu banyak percobaan');
    });
  });

  // ==========================================
  // SCENARIO 3: UPDATE PROFILE MENGGUNAKAN JWT
  // ==========================================
  describe('3. Pembaruan Profil (Profile Update)', () => {
    
    it('Menolak pembaruan profil jika token tidak disertakan (401)', async () => {
      // 1. KOSONGKAN TOKEN SEMENTARA AGAR DIANGGAP BELUM LOGIN
      mockCookieStore.token = ""; 
      
      const req = createMockRequest('/api/profile', 'PATCH', { fullName: "Budi Diubah" }); // Tanpa Token
      const res = await profilePATCH(req);
      if (!res) throw new Error("Response is undefined");
      
      expect(res.status).toBe(401);
    });

    it('Berhasil memperbarui nama menggunakan Token JWT yang sah (200)', async () => {
      // 2. ISI KEMBALI TOKEN YANG SAH UNTUK TES INI
      mockCookieStore.token = validAuthToken;
      
      const req = createMockRequest('/api/profile', 'PATCH', { 
        fullName: "Budi Santoso Updated" 
      }, validAuthToken); 

      const res = await profilePATCH(req);
      if (!res) throw new Error("Response is undefined");
      
      expect(res.status).toBe(200);

      // Cek apakah database benar-benar terupdate
      const dbUser = await prisma.user.findUnique({ where: { email: testUser.email } });
      expect(dbUser?.fullName).toBe("Budi Santoso Updated");
    });
  });

});