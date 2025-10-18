# Security Implementation - POS Electron

## ✅ Implemented Security Features

### 1. **JWT Authentication** ✅
- Login system dengan email/password
- Token management dengan localStorage
- Auto token injection di semua API calls
- Auto logout on 401 Unauthorized

### 2. **Secure API Calls** ✅
- Semua API requests include `Authorization: Bearer {token}`
- Automatic session expiry handling
- Error handling untuk network failures

### 3. **Auth Service** ✅
Location: `src/services/auth-service.ts`

Features:
- `login(credentials)` - Login dan simpan token
- `logout()` - Clear token dan user data
- `getToken()` - Get current token
- `isAuthenticated()` - Check login status
- `getAuthHeader()` - Get auth header untuk API calls

### 4. **Protected Routes** ✅
- Login page: `/login`
- Protected pages: Requires authentication
- Auto redirect to login if not authenticated

---

## 🔐 How It Works

### Authentication Flow

```
1. User masuk ke login page
   ↓
2. Input email & password
   ↓
3. Submit ke API: POST /auth/login
   ↓
4. API return JWT token + user data
   ↓
5. Token disimpan di localStorage
   ↓
6. Semua API calls include token di header
   ↓
7. Jika token expired (401), auto logout & redirect to login
```

### API Request Example

**Before (Insecure)**:
```typescript
fetch('http://154.19.37.167:3000/products')
```

**After (Secure)**:
```typescript
fetch('http://154.19.37.167:3000/products', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
})
```

---

## 🧪 Testing Guide

### 1. Test Login

```bash
# Start dev mode
npm run electron:dev

# Login dengan:
Email: admin@admin.com
Password: password (sesuaikan dengan user di database)
```

### 2. Test API dengan Auth

```bash
# Di browser console / DevTools
localStorage.getItem('pos_auth_token')
# Should return: "eyJhbGciOiJIUzI1..."

# Test API call
fetch('http://154.19.37.167:3000/products', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('pos_auth_token')}`
  }
}).then(r => r.json()).then(console.log)
```

### 3. Test Session Expiry

```bash
# Clear token
localStorage.removeItem('pos_auth_token')

# Refresh page - should redirect to /login
```

---

## 📝 Setup Instructions

### For Development:

1. **API sudah running di VPS**:
   ```bash
   # Check API status
   curl http://154.19.37.167:3000/products
   ```

2. **Start POS Electron**:
   ```bash
   npm run electron:dev
   ```

3. **Login**:
   - Email: `admin@admin.com` (atau user lain yang ada di database)
   - Password: sesuai dengan database

4. **Test Features**:
   - [ ] Login berhasil
   - [ ] Token tersimpan
   - [ ] Sync products (dengan auth)
   - [ ] Create transaction
   - [ ] Logout

---

## ⚠️ Remaining Security Issues

### 1. **API Backend - Auth Not Working Properly**
**Status**: API `/auth/login` returns 500 error

**Current Issue**:
```bash
curl -X POST http://154.19.37.167:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"password"}'

# Returns: {"statusCode":500,"message":"Internal server error"}
```

**TODO**:
- [ ] Fix auth controller di API backend
- [ ] Verify JWT secret configured correctly
- [ ] Check database user table structure
- [ ] Test auth endpoint manually

### 2. **No HTTPS/SSL** 
**Status**: ⚠️ Still using HTTP

**Risk**: Data transmitted in plain text

**Solution**:
```bash
# Install Let's Encrypt on VPS
ssh root@154.19.37.167
apt install certbot
certbot certonly --standalone -d yourdomain.com

# Update nginx config
# Change API URL to https://154.19.37.167:3000
```

**TODO**:
- [ ] Get domain name or use IP with self-signed cert
- [ ] Install SSL certificate
- [ ] Update `.env` to use HTTPS
- [ ] Test SSL connection

### 3. **Database Not Encrypted**
**Status**: ⚠️ SQLite file not encrypted

**Risk**: Anyone with access to PC can read database

**Solution**:
```bash
# Use SQLCipher
npm install @journeyapps/sqlcipher
```

**TODO**:
- [ ] Replace better-sqlite3 with SQLCipher
- [ ] Generate encryption key
- [ ] Encrypt existing database
- [ ] Test performance impact

---

## 🔧 Configuration Files

### `.env`
```env
VITE_API_BASE_URL=http://154.19.37.167:3000
```

### VPS API `.env`
```env
JWT_SECRET=bswlUBhNlF+8MKC1sNkmEfIsVhIF/rH+MfQ3p9vqMRg=
PORT=3000
```

---

## 📊 Security Checklist Status

- [x] **Authentication System** - Implemented
- [x] **Token Management** - Implemented
- [x] **Secure API Calls** - Implemented
- [x] **Auto Logout on 401** - Implemented
- [ ] **API Backend Auth Working** - NEEDS FIX
- [ ] **HTTPS/SSL** - Not Implemented
- [ ] **Database Encryption** - Not Implemented
- [ ] **Rate Limiting** - Not Implemented

---

## 🚀 Production Deployment

### Before deploying to store:

1. **Fix API Auth Backend**:
   ```bash
   ssh root@154.19.37.167
   cd /var/www/KasirAdmin/api
   # Debug auth controller
   # Fix 500 error
   # Test login endpoint
   ```

2. **Create User Account**:
   ```sql
   -- Di database PostgreSQL
   INSERT INTO users (email, password, name, role) 
   VALUES ('kasir@toko.com', '$hashed_password', 'Kasir Toko', 'kasir');
   ```

3. **Test Login Flow**:
   - [ ] Login successful
   - [ ] Token saved
   - [ ] API calls work with token
   - [ ] Logout works
   - [ ] Session expiry works

4. **Build Production**:
   ```bash
   npm run build
   npm run electron:build:win
   ```

5. **Deploy Installer**:
   - File: `release/POS System Setup x.x.x.exe`
   - Install di PC toko
   - Test all features

---

## 🆘 Troubleshooting

### Login Failed
1. Check API status: `curl http://154.19.37.167:3000/auth/login`
2. Check network connection
3. Check browser console for errors
4. Verify credentials exist in database

### Token Not Saved
1. Check localStorage in DevTools
2. Check authService.login() success
3. Verify API response format

### API Returns 401
1. Token expired - login again
2. Token invalid - clear localStorage and login
3. API requires different token format

### Sync Fails
1. Check if logged in
2. Check token in localStorage
3. Check network connection
4. Check API endpoint accessible

---

## 📚 References

- JWT Auth: https://jwt.io/
- localStorage Security: https://owasp.org/www-community/vulnerabilities/Web_Storage
- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security

---

**Last Updated**: 2025-10-18
**Version**: 1.1.0-secure
**Status**: Auth implemented, API backend needs fix
