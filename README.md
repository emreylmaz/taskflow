# 📋 TaskFlow

Hızlı, minimal, güçlü görev yönetimi uygulaması. Kanban + Liste görünümü ile task'larını yönet.

## 🏗️ Tech Stack

### Frontend
- **React 19** + **TypeScript 5**
- **Vite 6** (lightning-fast dev server)
- **Tailwind CSS 4** (utility-first styling)
- **React Router 7** (client-side routing)

### Backend
- **Express 5** + **TypeScript 5**
- **Prisma 6** (type-safe ORM)
- **PostgreSQL 16**
- **JWT** authentication (access + refresh tokens)

### DevOps
- **Turborepo** (monorepo)
- **Docker Compose** (PostgreSQL)
- **GitHub Actions** (CI)

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 22+
- Docker & Docker Compose

### 1. Repo'yu klonla
```bash
git clone https://github.com/emreylmaz/taskflow.git
cd taskflow
```

### 2. Bağımlılıkları yükle
```bash
npm install
```

### 3. PostgreSQL'i başlat
```bash
docker compose up -d
```

### 4. Backend environment'ı ayarla
```bash
cp packages/backend/.env.example packages/backend/.env
```

### 5. Veritabanı migration'ını çalıştır
```bash
cd packages/backend
npx prisma migrate dev --name init
cd ../..
```

### 6. Geliştirmeye başla
```bash
npm run dev
```

Bu komut aynı anda çalıştırır:
- **Frontend** → http://localhost:3000
- **Backend** → http://localhost:4000

## 📁 Proje Yapısı

```
taskflow/
├── packages/
│   ├── frontend/          # Vite + React
│   └── backend/           # Express + Prisma
├── docker-compose.yml     # PostgreSQL
├── turbo.json             # Turborepo config
└── package.json           # Workspace root
```

## 📝 API Endpoints

### Auth
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /api/auth/register | Kayıt |
| POST | /api/auth/login | Giriş |
| POST | /api/auth/refresh | Token yenileme |

## 📄 Lisans

MIT
