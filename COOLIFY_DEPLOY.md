# Coolify Deployment Guide — TaskFlow Backend

Bu döküman, TaskFlow backend'ini Coolify'a deploy etmek için adım adım talimatları içerir.

## 🚀 Ön Gereksinimler

- Coolify instance erişimi (https://coolify.emreyilmaz.io veya self-hosted)
- Domain DNS ayarı: `taskflow-api.emreyilmaz.io` → Coolify server IP
- Git repo erişimi

---

## 📋 Deployment Seçenekleri

### Seçenek A: Docker Compose ile Deploy (Önerilen)

1. **Coolify Dashboard'a git**
2. **New Project** → "TaskFlow" adıyla oluştur
3. **Add Resource** → "Docker Compose" seç
4. **Repository ayarları:**
   - Repository: `https://github.com/YOUR_USERNAME/taskflow` (veya private repo)
   - Branch: `main`
   - Docker Compose Location: `docker-compose.prod.yml`

5. **Environment Variables ekle:**

   ```
   POSTGRES_USER=taskflow
   POSTGRES_PASSWORD=<güçlü şifre oluştur>
   POSTGRES_DB=taskflow
   JWT_SECRET=<openssl rand -base64 32>
   JWT_REFRESH_SECRET=<openssl rand -base64 32>
   CORS_ORIGIN=https://taskflow.vercel.app
   BACKEND_PORT=3000
   ```

6. **Domain ayarla:**
   - Domain: `taskflow-api.emreyilmaz.io`
   - SSL: Auto (Let's Encrypt)
   - Port: 3000

7. **Deploy** butonuna tıkla

---

### Seçenek B: Sadece Backend (DB harici)

Eğer PostgreSQL ayrı yönetiliyorsa (örn: Supabase, Neon):

1. **Add Resource** → "Dockerfile" seç
2. **Repository ayarları:**
   - Dockerfile Location: `packages/backend/Dockerfile`
   - Build Context: `.` (root)

3. **Environment Variables:**

   ```
   DATABASE_URL=postgresql://user:pass@host:5432/taskflow
   JWT_SECRET=<secret>
   JWT_REFRESH_SECRET=<secret>
   CORS_ORIGIN=https://taskflow.vercel.app
   NODE_ENV=production
   PORT=3000
   ```

4. **Deploy**

---

## 🔐 Secret Generation

```bash
# JWT Secret
openssl rand -base64 32
# Örnek: K8xN3mP2qR5tU8vW1yZ4bD7fH0jL3nQ6sV9xC2aE5gI=

# JWT Refresh Secret
openssl rand -base64 32
# Örnek: M9yP4rS7vX0aD3gJ6lO9qT2uW5xZ8bE1hK4nQ7sV0cF=

# Database Password
openssl rand -base64 24
# Örnek: A3bC5dE7fG9hI1jK3lM5nO7pQ=
```

---

## 🌐 DNS Ayarları

Cloudflare veya DNS provider'ınızda:

| Type | Name         | Content           | Proxy                   |
| ---- | ------------ | ----------------- | ----------------------- |
| A    | taskflow-api | Coolify Server IP | DNS Only (veya Proxied) |

**Not:** Coolify SSL sertifikası alacaksa, başlangıçta "DNS Only" yapın. Sonra Proxied'e çevirebilirsiniz.

---

## ✅ Deployment Sonrası Kontroller

### 1. Health Check

```bash
curl https://taskflow-api.emreyilmaz.io/api/v1/health
```

Beklenen:

```json
{ "status": "healthy", "timestamp": "...", "version": "0.1.0" }
```

### 2. Database Migration Kontrolü

Coolify logs'tan migration'ın çalıştığını doğrulayın:

```
prisma:migrate Applying migration `20250205_init`
prisma:migrate Migration applied successfully
```

### 3. CORS Testi

```bash
curl -I -X OPTIONS https://taskflow-api.emreyilmaz.io/api/v1/auth/login \
  -H "Origin: https://taskflow.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

---

## 🔧 Troubleshooting

### Container başlamıyor

```bash
# Coolify'da container logs'a bak
# Sık sorunlar:
# - DATABASE_URL yanlış format
# - PostgreSQL henüz hazır değil (depends_on kontrol)
# - Prisma migration hatası
```

### Database bağlantı hatası

- `DATABASE_URL` formatını kontrol et: `postgresql://user:pass@host:5432/db`
- PostgreSQL container'ın healthy olduğunu doğrula
- Network ayarlarını kontrol et (aynı network'te olmalılar)

### SSL Hatası

- DNS propagation bekle (5-30 dakika)
- Coolify'da SSL sertifikasını yenile
- Cloudflare kullanıyorsan, "Full (strict)" SSL mode

---

## 📊 Monitoring

Coolify otomatik olarak şunları sağlar:

- Container metrics (CPU, Memory)
- Health check status
- Auto-restart on failure

Ek monitoring için:

- Sentry entegrasyonu (error tracking)
- Better Stack / Grafana (metrics)

---

## 🔄 CI/CD (Opsiyonel)

Coolify webhook ile otomatik deploy:

1. Coolify'da "Webhooks" sekmesine git
2. Webhook URL'i kopyala
3. GitHub repo → Settings → Webhooks → Add
4. URL: Coolify webhook URL
5. Events: `push` (main branch)

Artık `main`'e push yapınca otomatik deploy olur!

---

_Son Güncelleme: Şubat 2025_
