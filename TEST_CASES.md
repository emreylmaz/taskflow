# TaskFlow — Test Senaryoları

Bu dokümantasyon, TaskFlow uygulamasının temel test senaryolarını içerir.
Her senaryo için adımlar, beklenen sonuçlar ve API test komutları belirtilmiştir.

> **Base URLs:**
>
> - Backend API: `https://taskflow-api.emreyilmaz.io`
> - Frontend: `https://taskflow.vercel.app` (veya custom domain)

---

## 1. 🔐 Kayıt (Register) Testleri

### 1.1 Başarılı Kayıt

**Adımlar:**

1. `/register` sayfasına git
2. Geçerli email, isim ve şifre gir
3. "Kayıt Ol" butonuna tıkla

**Beklenen Sonuç:**

- 201 Created response
- Access token ve refresh token dönmeli
- Dashboard'a yönlendirilmeli

**API Test:**

```bash
curl -X POST https://taskflow-api.emreyilmaz.io/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "SecurePass123!"
  }'
```

**Beklenen Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### 1.2 Email Validation — Geçersiz Format

**Adımlar:**

1. Geçersiz email formatı gir (örn: "invalid-email")
2. Form submit et

**Beklenen Sonuç:**

- 400 Bad Request
- "Geçersiz email formatı" hata mesajı

**API Test:**

```bash
curl -X POST https://taskflow-api.emreyilmaz.io/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "name": "Test",
    "password": "SecurePass123!"
  }'
```

### 1.3 Email Validation — Zaten Kayıtlı

**Adımlar:**

1. Daha önce kayıtlı bir email ile kayıt olmaya çalış

**Beklenen Sonuç:**

- 409 Conflict
- "Bu email zaten kullanımda" mesajı

### 1.4 Password Validation — Zayıf Şifre

**Adımlar:**

1. Minimum gereksinimleri karşılamayan şifre gir (örn: "123")

**Beklenen Sonuç:**

- 400 Bad Request
- Şifre gereksinimleri hata mesajı

**API Test:**

```bash
curl -X POST https://taskflow-api.emreyilmaz.io/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "name": "Test",
    "password": "123"
  }'
```

---

## 2. 🔑 Login Testleri

### 2.1 Başarılı Login

**Adımlar:**

1. `/login` sayfasına git
2. Kayıtlı email ve doğru şifre gir
3. "Giriş Yap" butonuna tıkla

**Beklenen Sonuç:**

- 200 OK response
- Access token ve refresh token dönmeli
- Dashboard'a yönlendirilmeli
- `failedLoginAttempts` sıfırlanmalı

**API Test:**

```bash
curl -X POST https://taskflow-api.emreyilmaz.io/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### 2.2 Yanlış Şifre

**Adımlar:**

1. Kayıtlı email ile yanlış şifre gir

**Beklenen Sonuç:**

- 401 Unauthorized
- "Email veya şifre hatalı" mesajı
- `failedLoginAttempts` artmalı

**API Test:**

```bash
curl -X POST https://taskflow-api.emreyilmaz.io/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }'
```

### 2.3 Account Lockout (5 Başarısız Deneme)

**Adımlar:**

1. Aynı hesaba 5 kez yanlış şifre ile giriş dene

**Beklenen Sonuç:**

- 5. denemeden sonra hesap kilitlenmeli
- 423 Locked veya 429 Too Many Requests
- "Hesabınız kilitlendi. 15 dakika sonra tekrar deneyin" mesajı

**API Test (5 kez çalıştır):**

```bash
for i in {1..5}; do
  echo "Attempt $i:"
  curl -X POST https://taskflow-api.emreyilmaz.io/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "locktest@example.com", "password": "wrong"}'
  echo -e "\n"
done
```

### 2.4 Lockout Sonrası Bekleme

**Adımlar:**

1. Kilitli hesap ile doğru şifre gir (lockout süresi dolmadan)

**Beklenen Sonuç:**

- Yine 423 Locked
- Kalan süre bilgisi dönmeli

---

## 3. 🔄 Token Refresh Testleri

### 3.1 Token Refresh — Başarılı

**Adımlar:**

1. Login yap, refresh token al
2. `/api/v1/auth/refresh` endpoint'ine refresh token ile istek at

**Beklenen Sonuç:**

- 200 OK
- Yeni access token dönmeli
- (Opsiyonel) Yeni refresh token dönmeli (rotation)

**API Test:**

```bash
# Önce login yap ve REFRESH_TOKEN'ı kaydet
REFRESH_TOKEN="eyJ..."

curl -X POST https://taskflow-api.emreyilmaz.io/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}"
```

### 3.2 Token Refresh — Geçersiz Token

**Adımlar:**

1. Geçersiz veya expired refresh token ile istek at

**Beklenen Sonuç:**

- 401 Unauthorized
- "Geçersiz veya süresi dolmuş token" mesajı

**API Test:**

```bash
curl -X POST https://taskflow-api.emreyilmaz.io/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "invalid-token"}'
```

### 3.3 Logout — Token Invalidation

**Adımlar:**

1. Login yap
2. Logout endpoint'ini çağır
3. Aynı refresh token ile yeni access token almaya çalış

**Beklenen Sonuç:**

- Logout: 200 OK
- Refresh sonrası: 401 Unauthorized (token artık geçersiz)

**API Test:**

```bash
ACCESS_TOKEN="eyJ..."

# Logout
curl -X POST https://taskflow-api.emreyilmaz.io/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Artık refresh çalışmamalı
curl -X POST https://taskflow-api.emreyilmaz.io/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "..."}'
```

---

## 4. 🛡️ Protected Route Testleri

### 4.1 Dashboard — Auth Olmadan Erişim

**Adımlar:**

1. Çıkış yapılmış durumda `/dashboard` URL'ine git

**Beklenen Sonuç:**

- `/login` sayfasına redirect
- (Opsiyonel) "Giriş yapmanız gerekiyor" mesajı

**API Test:**

```bash
# Token olmadan protected endpoint
curl -i https://taskflow-api.emreyilmaz.io/api/v1/users/me
```

**Beklenen Response:**

```
HTTP/2 401
{"success":false,"error":{"code":"UNAUTHORIZED","message":"..."}}
```

### 4.2 Dashboard — Auth Sonrası Erişim

**Adımlar:**

1. Login yap
2. `/dashboard` sayfasına git

**Beklenen Sonuç:**

- Dashboard sayfası görüntülenmeli
- Kullanıcı bilgileri yüklenmeli

**API Test:**

```bash
ACCESS_TOKEN="eyJ..."

curl https://taskflow-api.emreyilmaz.io/api/v1/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 4.3 Expired Access Token

**Adımlar:**

1. Access token expire olduktan sonra protected endpoint'e istek at
2. Frontend otomatik refresh yapıp retry etmeli

**Beklenen Sonuç:**

- İlk istek: 401
- Auto-refresh: Yeni token alınır
- Retry: 200 OK

---

## 5. ❤️ Health Check Testleri

### 5.1 Basic Health Check

**Adımlar:**

1. `/api/v1/health` endpoint'ini çağır

**Beklenen Sonuç:**

- 200 OK
- Server durumu "healthy"

**API Test:**

```bash
curl https://taskflow-api.emreyilmaz.io/api/v1/health
```

**Beklenen Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-02-06T...",
  "version": "0.1.0"
}
```

### 5.2 Database Bağlantı Kontrolü

**Adımlar:**

1. Health check'te DB durumunu kontrol et

**Beklenen Sonuç:**

- `database: "connected"` durumu

**API Test:**

```bash
curl https://taskflow-api.emreyilmaz.io/api/v1/health?detailed=true
```

**Beklenen Response (detailed):**

```json
{
  "status": "healthy",
  "timestamp": "2025-02-06T...",
  "version": "0.1.0",
  "checks": {
    "database": "connected",
    "memory": "ok",
    "uptime": 3600
  }
}
```

### 5.3 Database Down Senaryosu

**Beklenen Sonuç (DB kapalıyken):**

- 503 Service Unavailable
- `database: "disconnected"` durumu

---

## 📋 Test Özeti Checklist

| #   | Test                       | Durum |
| --- | -------------------------- | ----- |
| 1.1 | Başarılı Kayıt             | ⬜    |
| 1.2 | Geçersiz Email             | ⬜    |
| 1.3 | Email Zaten Kayıtlı        | ⬜    |
| 1.4 | Zayıf Şifre                | ⬜    |
| 2.1 | Başarılı Login             | ⬜    |
| 2.2 | Yanlış Şifre               | ⬜    |
| 2.3 | Account Lockout            | ⬜    |
| 2.4 | Lockout Bekleme            | ⬜    |
| 3.1 | Token Refresh              | ⬜    |
| 3.2 | Geçersiz Refresh Token     | ⬜    |
| 3.3 | Logout Invalidation        | ⬜    |
| 4.1 | Protected Route (No Auth)  | ⬜    |
| 4.2 | Protected Route (Auth)     | ⬜    |
| 4.3 | Expired Token Auto-Refresh | ⬜    |
| 5.1 | Health Check               | ⬜    |
| 5.2 | DB Connection              | ⬜    |
| 5.3 | DB Down Scenario           | ⬜    |

---

## 🛠️ Test Environment Setup

### Local Testing

```bash
# Backend
cd packages/backend
cp .env.example .env
# DATABASE_URL, JWT secrets ayarla
npm run dev

# Frontend (ayrı terminal)
cd packages/frontend
npm run dev
```

### Production Testing

```bash
# API base URL
export API_URL=https://taskflow-api.emreyilmaz.io

# Test user oluştur
curl -X POST $API_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"tester@example.com","name":"Tester","password":"Test1234!"}'
```

---

_Son Güncelleme: Şubat 2025_
