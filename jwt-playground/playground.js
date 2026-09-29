/**
 * =========================================================================
 * 🔑 JWT SIMPLE PLAYGROUND (Node.js Native Crypto)
 * =========================================================================
 * Script ini mendemonstrasikan secara transparan bagaimana JWT dibuat,
 * di-encode, ditandatangani secara kriptografi (HMAC-SHA256), dan diverifikasi
 * TANPA library eksternal (menggunakan modul bawaan 'crypto').
 *
 * Jalankan dengan: node playground.js
 * =========================================================================
 */

const crypto = require('crypto');

// 1. Helper Base64URL (Standar format URL-safe untuk JWT)
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

// 2. Kunci Rahasia Server (Hanya server yang tahu!)
const SECRET_KEY = 'gofood-rahasia-super-aman';

console.log('='.repeat(70));
console.log(' 🍕 GOFOOD JWT PLAYGROUND - CARA KERJA JSON WEB TOKEN');
console.log('='.repeat(70));

// -------------------------------------------------------------------------
// BAGIAN 1: PEMBUATAN TOKEN (SIGNING)
// -------------------------------------------------------------------------
console.log('\n--- 1. MEMBUAT 3 BAGIAN JWT ---');

// Bagian 1: Header (Metadata algoritma & tipe)
const header = {
  alg: 'HS256',
  typ: 'JWT',
};
const encodedHeader = base64UrlEncode(JSON.stringify(header));
console.log('\n[A] HEADER (Merah):');
console.log('    JSON    :', JSON.stringify(header));
console.log('    Encoded :', encodedHeader);

// Bagian 2: Payload (Data klaim user GoFood)
const payload = {
  userId: 'usr-budi-12345',
  name: 'Budi Santoso',
  email: 'budi@mail.com',
  role: 'CUSTOMER',
  iat: Math.floor(Date.now() / 1000), // Issued At (Waktu dibuat)
  exp: Math.floor(Date.now() / 1000) + 3600, // Expired 1 jam ke depan
};
const encodedPayload = base64UrlEncode(JSON.stringify(payload));
console.log('\n[B] PAYLOAD (Ungu):');
console.log('    JSON    :', JSON.stringify(payload));
console.log('    Encoded :', encodedPayload);

// Bagian 3: Signature (Tanda tangan digital HMAC-SHA256)
// Signature dihitung dari: HMAC_SHA256(encodedHeader + "." + encodedPayload, SECRET_KEY)
const signatureInput = `${encodedHeader}.${encodedPayload}`;
const signature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(signatureInput)
  .digest();
const encodedSignature = base64UrlEncode(signature);
console.log('\n[C] SIGNATURE (Biru/Cyan):');
console.log('    Rumus   : HMAC_SHA256(header.payload, SECRET_KEY)');
console.log('    Encoded :', encodedSignature);

// Gabungkan ketiga bagian dengan titik (.)
const jwtToken = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

console.log('\n🎉 HASIL LENGKAP TOKEN JWT:');
console.log('\x1b[31m' + encodedHeader + '\x1b[0m' + '.' +
            '\x1b[35m' + encodedPayload + '\x1b[0m' + '.' +
            '\x1b[36m' + encodedSignature + '\x1b[0m');
console.log('\n(Format: Header.Payload.Signature)');

// -------------------------------------------------------------------------
// BAGIAN 2: VERIFIKASI TOKEN OLEH SERVER / MIDDLEWARE
// -------------------------------------------------------------------------
console.log('\n' + '='.repeat(70));
console.log('--- 2. VERIFIKASI TOKEN SAAT REQUEST MASUK ---');

function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Format token tidak valid' };
  }

  const [h, p, s] = parts;

  // Server menghitung ulang signature dari header & payload yang diterima
  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest()
  );

  // Jika signature yang dihitung COCOK dengan signature pada token:
  if (s !== expectedSig) {
    return { valid: false, error: 'Signature tidak cocok! Token telah dimanipulasi.' };
  }

  // Cek masa kadaluarsa (Expiration)
  const decodedPayload = JSON.parse(base64UrlDecode(p));
  const now = Math.floor(Date.now() / 1000);
  if (decodedPayload.exp && decodedPayload.exp < now) {
    return { valid: false, error: 'Token sudah kadaluarsa (Expired)' };
  }

  return { valid: true, data: decodedPayload };
}

// Uji 1: Verifikasi token asli
const testAsli = verifyToken(jwtToken, SECRET_KEY);
console.log('\nUji 1 - Verifikasi Token Valid:');
console.log('Status :', testAsli.valid ? '✅ BERHASIL (Token Sah)' : '❌ GAGAL');
console.log('User ID:', testAsli.data?.userId, '| Role:', testAsli.data?.role);

// -------------------------------------------------------------------------
// BAGIAN 3: SIMULASI PERETASAN / MANIPULASI (TAMPERING ATTEMPT)
// -------------------------------------------------------------------------
console.log('\n' + '='.repeat(70));
console.log('--- 3. SIMULASI PERETASAN (TAMPERING) ---');
console.log('Contoh: Hacker mencoba mengubah "CUSTOMER" menjadi "ADMIN"');

// Hacker mengubah payload
const hackedPayload = {
  ...payload,
  role: 'ADMIN', // Hacker mengubah role
};
const hackedEncodedPayload = base64UrlEncode(JSON.stringify(hackedPayload));

// Hacker merakit token baru dengan signature lama
const hackedToken = `${encodedHeader}.${hackedEncodedPayload}.${encodedSignature}`;

console.log('\nToken Palsu Hacker:');
console.log(hackedToken);

const testPalsu = verifyToken(hackedToken, SECRET_KEY);
console.log('\nHasil Verifikasi Server Terhadap Token Palsu:');
console.log('Status :', testPalsu.valid ? '✅ BERHASIL' : '❌ DITOLAK!');
console.log('Alasan :', testPalsu.error);
console.log('👉 Kesimpulan: Hacker GAGAL karena tidak tahu SECRET_KEY server untuk membuat signature baru!');

// -------------------------------------------------------------------------
// BAGIAN 4: SIMULASI ALUR LOGIN LENGKAP & AKSES ENDPOINT (/api/orders)
// -------------------------------------------------------------------------
console.log('\n' + '='.repeat(70));
console.log('--- 4. SIMULASI LOGIN CLIENT & AKSES PROTECTED API ---');

// Mock Database User
const DB_USER = {
  email: 'budi@mail.com',
  password: 'password123',
  name: 'Budi Santoso',
  id: 'usr-budi-999',
  role: 'CUSTOMER',
};

// Simulasi Backend Endpoint: POST /api/auth/login
function apiLogin(inputEmail, inputPassword) {
  console.log(`\n[Mobile Client] 📱 Mengirim request: POST /api/auth/login { email: "${inputEmail}", password: "•••" }`);

  if (inputEmail !== DB_USER.email || inputPassword !== DB_USER.password) {
    console.log('[Express Server] ❌ Email atau password salah! Mengembalikan 401 Unauthorized');
    return null;
  }

  // Generate JWT jika valid
  const h = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = base64UrlEncode(
    JSON.stringify({
      userId: DB_USER.id,
      name: DB_USER.name,
      role: DB_USER.role,
      exp: Math.floor(Date.now() / 1000) + 86400,
    })
  );
  const s = base64UrlEncode(
    crypto.createHmac('sha256', SECRET_KEY).update(`${h}.${p}`).digest()
  );
  const token = `${h}.${p}.${s}`;

  console.log('[Express Server] ✅ Kredensial cocok! Membuat JWT Token...');
  console.log('[Express Server] 📤 Mengembalikan 200 OK: { token: "' + token.slice(0, 25) + '..." }');
  console.log('[Mobile Client] 💾 Token disimpan di AsyncStorage ("auth_token")');
  return token;
}

// Simulasi Backend Endpoint: GET /api/orders (Protected Middleware)
function apiGetOrders(authHeader) {
  console.log(`\n[Mobile Client] 📱 Mengirim request: GET /api/orders (Header: ${authHeader ? authHeader.slice(0, 28) + '...' : '(Kosong)'})`);

  // authMiddleware logic
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    console.log('[authMiddleware] ⛔ 401 Unauthorized: Header Authorization Bearer tidak disertakan!');
    return;
  }

  const verified = verifyToken(token, SECRET_KEY);
  if (!verified.valid) {
    console.log(`[authMiddleware] ⛔ 401 Unauthorized: ${verified.error}`);
    return;
  }

  console.log(`[authMiddleware] 🔓 Token Valid! User: ${verified.data.name} (Role: ${verified.data.role})`);
  console.log('[orderController] 📦 200 OK: Mengembalikan 2 data riwayat pesanan dari database:');
  console.log('   - #ORD-101: 2x Nasi Goreng Spesial (Rp 70.000) [DELIVERING]');
  console.log('   - #ORD-089: 1x Burger Bangor (Rp 40.000) [COMPLETED]');
}

// Eksekusi Skenario:
// Skenario A: Login berhasil & simpan token
const userToken = apiLogin('budi@mail.com', 'password123');

// Skenario B: Akses endpoint dengan token sah
apiGetOrders(`Bearer ${userToken}`);

// Skenario C: Akses endpoint tanpa token (User belum login)
apiGetOrders(null);

// Skenario D: Akses endpoint dengan token palsu
apiGetOrders('Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQURNSU4ifQ.palsusignature');

console.log('\n' + '='.repeat(70) + '\n');
