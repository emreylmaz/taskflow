# 📋 TaskFlow

> **Modüler, AI-Native, Role-Aware Task Manager**

Hızlı, minimal, güçlü görev yönetimi uygulaması. Kanban board ile task'larını sürükle-bırak yönet.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://taskflow-five-mu.vercel.app)
[![API Status](https://img.shields.io/badge/api-online-brightgreen)](https://api.taskflow.emreyilmaz.io/api/v1/health)

## 🌐 Live Demo

- **Frontend:** https://taskflow-five-mu.vercel.app
- **API:** https://api.taskflow.emreyilmaz.io/api/v1

### Demo Hesabı

```
Email: demo@taskflow.app
Password: Demo1234!
```

## ✨ Özellikler

- 🎯 **Kanban Board** — Sürükle-bırak ile task yönetimi
- 📊 **Çoklu Projeler** — Her proje için ayrı board
- 🔐 **JWT Auth** — Access + Refresh token ile güvenli kimlik doğrulama
- 👥 **Org/Team** — Organizasyon ve takım yönetimi (Phase 5)
- 🎨 **Modern UI** — Tailwind CSS ile responsive tasarım
- ⚡ **Hızlı** — Vite + React 19 ile optimize edilmiş

## 🏗️ Tech Stack

### Frontend

- **React 19** + **TypeScript 5**
- **Vite 6** — Lightning-fast dev server
- **Tailwind CSS 4** — Utility-first styling
- **@dnd-kit** — Drag & drop
- **React Router 7** — Client-side routing

### Backend

- **Express 5** + **TypeScript 5**
- **Prisma 6** — Type-safe ORM
- **PostgreSQL 16** — Database
- **JWT** — Authentication

### DevOps

- **Turborepo** — Monorepo management
- **Docker Compose** — Containerization
- **GitHub Actions** — CI/CD pipeline
- **Vercel** — Frontend hosting
- **Traefik** — Reverse proxy + SSL

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 22+
- Docker & Docker Compose

### Kurulum

```bash
# 1. Repo'yu klonla
git clone https://github.com/emreylmaz/taskflow.git
cd taskflow

# 2. Bağımlılıkları yükle
npm install

# 3. PostgreSQL'i başlat
docker compose up -d

# 4. Environment'ı ayarla
cp packages/backend/.env.example packages/backend/.env

# 5. Migration'ları çalıştır
npm run db:migrate -w @taskflow/backend

# 6. Development server'ları başlat
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3000

## 📁 Proje Yapısı

```
taskflow/
├── packages/
│   ├── frontend/          # React + Vite
│   ├── backend/           # Express + Prisma
│   └── shared/            # Shared types & utils
├── docker-compose.yml     # Local PostgreSQL
├── docker-compose.prod.yml # Production config
└── turbo.json             # Turborepo config
```

## 🔌 API Endpoints

| Method | Endpoint                   | Description       |
| ------ | -------------------------- | ----------------- |
| POST   | `/api/v1/auth/register`    | Kayıt ol          |
| POST   | `/api/v1/auth/login`       | Giriş yap         |
| GET    | `/api/v1/projects`         | Projeleri listele |
| POST   | `/api/v1/projects`         | Proje oluştur     |
| GET    | `/api/v1/lists/:projectId` | Listeleri getir   |
| POST   | `/api/v1/tasks`            | Task oluştur      |
| PATCH  | `/api/v1/tasks/:id/move`   | Task taşı         |

## 📝 Roadmap

- [x] Phase 1-3: Auth, Security, Shared Pkg, CI/CD
- [x] Phase 4A: Core CRUD + DnD + Drawer
- [x] Phase 4B: Flow Control (role-based status transitions)
- [x] Phase 5A: Org/Teams Backend
- [x] Phase 5D: UI Modernization
- [ ] Phase 5B: Permissions (role-based access)
- [ ] Phase 5C: SMTP (email notifications)
- [ ] Phase 4C: AI Features

## 👤 Author

**Emre Yılmaz**

- GitHub: [@emreylmaz](https://github.com/emreylmaz)
- Website: [emreyilmaz.io](https://emreyilmaz.io)

## 📄 License

MIT License — feel free to use this project for learning or as a starting point for your own task manager.
