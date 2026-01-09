# GKEYS Store - Modern Gaming Keys Platform

A modern, full-featured platform for selling game keys with an optimized interface, advanced visual effects, and high performance.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/deffgod/gkeys-store)

One-click deploy to Vercel. After deployment, configure environment variables in Vercel dashboard (see [DOCUMENTATION.md](DOCUMENTATION.md) for details).

## 📖 Documentation

**👉 [QUICK_START.md](QUICK_START.md)** - Быстрый старт для новой команды разработчиков

**👉 [Полная документация (DOCUMENTATION.md)](DOCUMENTATION.md)** - Полное руководство по установке, настройке, разработке и деплою проекта.

Документация включает:
- ✅ Быстрый старт и установка
- ✅ Настройка Environment Variables
- ✅ Руководство по разработке
- ✅ Тестирование
- ✅ Деплой на Vercel
- ✅ G2A интеграция
- ✅ Архитектура проекта
- ✅ **OpenAPI спецификация API** ([docs/api/](docs/api/))
- ✅ Troubleshooting и FAQ

### 🔧 Vercel Deployment & Environment Variables

**Для настройки Vercel:**
- 📖 **[DOCUMENTATION.md](DOCUMENTATION.md)** - Полное руководство по настройке и деплою
- 📚 **[docs/deployment/](docs/deployment/)** - Детальные гайды по деплою

### 🎮 G2A Integration (NEW!)

**Улучшенная интеграция G2A:**
- 🚀 **[backend/src/lib/g2a/README.md](backend/src/lib/g2a/README.md)** - Документация G2A клиента
- 📖 **[docs/g2a/client-usage.md](docs/g2a/client-usage.md)** - Руководство по использованию

**Ключевые улучшения:**
- ✅ Unified Client Architecture - единая точка входа
- ✅ Dual Authentication - OAuth2 + Hash-based
- ✅ Circuit Breaker & Rate Limiting - устойчивость к сбоям
- ✅ Batch Operations - эффективные массовые операции
- ✅ Advanced Filtering - гибкая система фильтрации
- ✅ Delta Sync - инкрементальная синхронизация
- ✅ 85%+ Test Coverage - comprehensive testing

### 📚 API Documentation

**👉 [OpenAPI Specification](docs/api/openapi.yaml)** - Полная спецификация REST API в формате OpenAPI 3.0.

- 📋 [API README](docs/api/README.md) - Руководство по использованию API
- ❌ [Error Codes](docs/api/errors.md) - Коды ошибок API
- 📝 [Changelog](docs/api/changelog.md) - История изменений API

Просмотр документации:
```bash
# Swagger UI
swagger-ui-serve docs/api/openapi.yaml

# Redoc
redoc-cli bundle docs/api/openapi.yaml -o docs/api/index.html
```

## 🚀 Technology Stack

### Frontend
- **React 19** - Latest React with improved performance
- **TypeScript 5.9** - Full type safety for code reliability
- **Vite 7** - Lightning-fast build and HMR
- **React Router 7** - Modern routing
- **Tailwind CSS 3** - Utility-first CSS framework
- **Framer Motion 12** - Advanced animations
- **GSAP 3** - Professional animation for complex effects
- **shadcn/ui** - 40+ ready-to-use UI components

### Backend
- **Express.js** - RESTful API server
- **Prisma** - ORM for database operations
- **PostgreSQL** - Relational database
- **TypeScript** - Typed backend

## ✨ Key Features

### 🎨 Enhanced Hero Section
- **Fullscreen cover** - Hero section takes full screen (100vh)
- **Interactive carousel** - Horizontal carousel with game thumbnails over overlay
- **Gradient overlay** - Smooth top darkening for better readability
- **Large heading** - 72px game title for maximum visual impact
- **Aurora effect** - Dynamic background glow with adjustable intensity
- **Compact buttons** - Optimized button sizes for better UX

### 🎭 Visual Effects
- **Aurora Component** - Smooth gradient glow effects
- **ClickSpark** - Spark effect on button clicks
- **Animated Sections** - Fullscreen animated sections with GSAP
- **Smooth Transitions** - Smooth state transitions

### ⚡ Performance Optimization
- **Code Splitting** - Automatic code splitting into chunks:
  - `react-vendor` - React, React DOM, React Router
  - `ui-vendor` - Framer Motion, Radix UI components
  - `animation-vendor` - GSAP and related libraries
- **Tree Shaking** - Unused code removal
- **Minification** - Terser minification with console/debugger removal
- **Image Optimization** - Image optimization
- **Lazy Loading** - Component lazy loading

### 📦 Build Sizes (Optimized)
```
dist/index.html                             0.62 kB │ gzip:   0.34 kB
dist/assets/index-D5DggC8A.css             49.75 kB │ gzip:   9.63 kB
dist/assets/animation-vendor-D9tCNwfU.js    0.04 kB │ gzip:   0.06 kB
dist/assets/react-vendor-C8WmLSiQ.js       45.14 kB │ gzip:  15.90 kB
dist/assets/ui-vendor-DPxLtVRV.js         116.10 kB │ gzip:  37.28 kB
dist/assets/index-BpxgjCIV.js             575.13 kB │ gzip: 136.39 kB
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/)) or **Docker** ([Download](https://www.docker.com/))

## 🛠️ Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd gkeys2
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

## ⚙️ Configuration

### Step 1: Set Up PostgreSQL Database

#### Option A: Using Docker (Recommended)

```bash
# Run PostgreSQL container
docker run --name gkeys-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=gkeys_store \
  -p 5432:5432 \
  -d postgres:15

# If container already exists, just start it
docker start gkeys-postgres
```

#### Option B: Local PostgreSQL Installation

1. Install PostgreSQL 15+ on your system
2. Create a database:

```bash
createdb gkeys_store
# Or via psql:
# psql -U postgres
# CREATE DATABASE gkeys_store;
```

### Step 2: Configure Environment Variables

#### Frontend Configuration

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

**Note**: The `/api` suffix is important as all backend routes are prefixed with `/api`.

#### Backend Configuration

Create a `backend/.env` file:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gkeys_store?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/gkeys_store?schema=public"

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# JWT Authentication (REQUIRED - минимум 32 символа каждый)
JWT_SECRET="your-secret-key-change-in-production-minimum-32-characters-long"
JWT_REFRESH_SECRET="your-refresh-secret-different-from-jwt-secret-minimum-32-characters"

# G2A Integration (optional, only if using G2A)
G2A_API_URL="https://sandboxapi.g2a.com/v1"
G2A_API_KEY="your-g2a-api-key"
G2A_API_HASH="your-g2a-api-hash"
G2A_ENV="sandbox"

# Optional: Redis (for caching and queues)
REDIS_URL="redis://localhost:6379"

# Optional: Email (for notifications)
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT=587
EMAIL_USER="apikey"
EMAIL_PASS="your-smtp-password-or-api-key"
EMAIL_FROM="noreply@gkeys.store"
```

**Important:** 
- Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to secure random strings (minimum 32 characters)
- Generate secrets: `openssl rand -base64 32`
- For complete environment variables documentation, see [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)

### Step 3: Set Up Database Schema

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run db:update
```

### Step 4: G2A Integration (Optional)

If you're using G2A integration, you can sync games, prices, and stock:

```bash
cd backend

# Sync all G2A games
npm run g2a:sync

# Sync only prices
npm run g2a:sync:prices

# Sync only stock
npm run g2a:sync:stock

# Full sync (games + prices + stock)
npm run g2a:sync:all

# Sync orders
npm run orders:sync
```

For more information, see [DOCUMENTATION.md](DOCUMENTATION.md).

### Step 5: Run Database Migrations

```bash
cd backend
npm run prisma:migrate

# Verify database connection
npm run db:check

# (Optional) Seed database with test data
npm run prisma:seed

# OR restore from backup (includes full test data)
npm run db:restore
```

### Step 4: Verify Setup

```bash
# Test backend endpoints
cd backend
npm run test:endpoints

# Run all tests
cd backend
npm run test                    # Run all tests
npm run test:unit               # Run unit tests only
npm run test:integration        # Run integration tests only
npm run test:coverage           # Run tests with coverage report

# Check health
curl http://localhost:3001/health
```

## 🚀 Running the Application

### Development Mode

You need to run both frontend and backend servers simultaneously.

#### Terminal 1 - Frontend

```bash
# From project root
npm run dev
```

Frontend will be available at: **http://localhost:5173**

#### Terminal 2 - Backend

```bash
# From project root
cd backend
npm run dev
```

Backend API will be available at: **http://localhost:3001**

### Production Build

#### Build Frontend

```bash
npm run build
```

The production build will be in the `dist/` directory.

#### Build Backend

```bash
cd backend
npm run build
```

The compiled backend will be in `backend/dist/`.

#### Preview Production Build

```bash
npm run preview
```

## 🧪 Testing the Installation

### Frontend

1. Open your browser and navigate to: **http://localhost:5173**
2. You should see the homepage with games

### Backend API

Test the backend health endpoint:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-12-05T..."}
```

Test games endpoint:

```bash
curl http://localhost:3001/api/games
```

### Test Accounts (After Seeding)

If you ran `npm run prisma:seed`, you can use these test accounts:

**Administrator:**
- Email: `admin@gkeys.store`
- Password: `admin123`

**Regular User:**
- Email: `test@example.com`
- Password: `password123`
- Balance: 100.00 EUR

## 📁 Project Structure

```
gkeys2/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   │   ├── ui/                  # 40+ shadcn/ui components
│   │   │   ├── aurora.tsx      # Aurora effect
│   │   │   ├── click-spark.tsx # Click spark effect
│   │   │   └── game-item-card.tsx # Game card component
│   │   └── home/               # Home page components
│   ├── pages/                   # Application pages
│   ├── services/                # API services
│   ├── hooks/                   # React hooks
│   ├── styles/                  # Styles and design tokens
│   └── types/                   # TypeScript types
├── backend/                     # Backend application
│   ├── src/
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   ├── controllers/         # Controllers
│   │   ├── middleware/          # Express middleware
│   │   └── types/               # TypeScript types
│   └── prisma/                  # Database schema and migrations
│       ├── schema.prisma        # Prisma schema
│       └── migrations/         # Database migrations
├── docs/                        # Documentation
├── public/                      # Static assets
└── package.json                 # Frontend dependencies
```

## 🎨 Design System

### Color Palette

- **Primary**: `#00FF66` - Bright green (accent color)
- **Primary Dark**: `#00CC52` - Dark green variant
- **Accent**: `#b4ff00` - Neon green (for effects)
- **Background**: `#0D0D0D` - Dark background
- **Surface**: `#1A1A1A` / `#2A2A2A` - Cards and surfaces
- **Text**: `#FFFFFF` / `#999999` / `#666666` - Text hierarchy
- **Error**: `#FF4444` - Error color
- **Warning**: `#FFAA00` - Warning color
- **Success**: `#00FF66` - Success color

### Design Tokens

All design values (colors, spacing, typography, borders, animations) are centralized in `src/styles/design-tokens.ts` for visual consistency.

## 📄 Main Pages

### 1. **Home Page** (`/`)
- Fullscreen hero section with game carousel
- Best Sellers section
- New in Catalog section
- Preorders section
- Genre sections
- Random games

### 2. **Catalog Page** (`/catalog`)
- Advanced filters (platform, genre, price)
- Sorting (Popular, Newest, Price, Discount)
- Responsive card grid
- Wishlist functionality
- Pagination

### 3. **Cart Page** (`/cart`)
- Cart management
- Promo codes
- Payment method selection
- Recommendations

### 4. **Wishlist Page** (`/wishlist`)
- Saved games
- Wishlist statistics
- List management

### 5. **Support Page** (`/support`)
- FAQ with categories
- Search functionality
- Contact information

### 6. **Profile Pages** (`/profile/*`)
- User orders
- Balance and top-up
- Profile settings

### 7. **Game Detail** (`/game/:id`)
- Detailed game information
- Similar games
- Breadcrumb navigation

## 🔧 Development

### Adding New Components

```bash
# Add shadcn/ui component
npx shadcn@latest add [component-name]
```

### Prisma Commands

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Open Prisma Studio (GUI for database)
npm run prisma:studio
```

### Code Quality

```bash
# Lint frontend
npm run lint

# Lint backend
cd backend
npm run lint

# Format backend code
cd backend
npm run format
```

## 🐛 Troubleshooting

### Database Connection Error

1. **Check PostgreSQL is running:**
   ```bash
   # Docker
   docker ps | grep postgres
   
   # Local
   pg_isready
   ```

2. **Verify DATABASE_URL in `backend/.env`**

3. **Test database connection:**
   ```bash
   psql -U postgres -d gkeys_store -c "SELECT 1;"
   ```

### Port Already in Use

Change the port in:
- **Frontend**: `vite.config.ts`
- **Backend**: `backend/.env` (PORT=3001)

### Migration Issues

If migrations fail:

```bash
cd backend

# Reset database (WARNING: deletes all data!)
npx prisma migrate reset

# Re-run migrations
npm run prisma:migrate

# Re-seed data
npm run prisma:seed
```

### Build Errors

1. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Clear Prisma cache:**
   ```bash
   cd backend
   rm -rf node_modules/.prisma
   npm run prisma:generate
   ```

## 🌐 Deployment

### Quick Start

**One-click deploy**: Use the "Deploy with Vercel" button above, or follow the steps below:

1. Click the "Deploy with Vercel" button above
2. Import the GitHub repository
3. Configure environment variables (see [DOCUMENTATION.md](DOCUMENTATION.md))
4. Deploy automatically

For detailed instructions, see [DOCUMENTATION.md](DOCUMENTATION.md) and [docs/deployment/](docs/deployment/).

### Detailed Guides

- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Полное руководство по установке, настройке и деплою
- **[docs/deployment/](docs/deployment/)** - Детальные гайды по деплою

### 🚀 Deployment Options & Verification

**New deployment tools and guides:**
- 📋 **[docs/deployment/DEPLOYMENT_OPTIONS.md](docs/deployment/DEPLOYMENT_OPTIONS.md)** - Compare monolithic vs separate deployment
- 📖 **[docs/deployment/MONOLITHIC_DEPLOYMENT.md](docs/deployment/MONOLITHIC_DEPLOYMENT.md)** - Monolithic deployment guide
- 📖 **[docs/deployment/SEPARATE_DEPLOYMENT.md](docs/deployment/SEPARATE_DEPLOYMENT.md)** - Separate frontend/backend deployment guide
- 🔧 **[docs/deployment/TROUBLESHOOTING.md](docs/deployment/TROUBLESHOOTING.md)** - Common deployment issues and solutions
- ✅ **[docs/deployment/DEPLOYMENT_CHECKLIST.md](docs/deployment/DEPLOYMENT_CHECKLIST.md)** - Complete deployment checklist

**Deployment verification tools:**
- 🔍 Pre-deployment: `npm run verify:deployment` - Verify readiness before deployment
- ✅ Post-deployment: `npm run validate:deployment -- --url=https://your-project.vercel.app` - Validate after deployment

### Vercel (Recommended - Monolith Deployment)

Проект настроен для монолитного деплоя на Vercel:
- **Frontend**: Статические файлы из `dist/`
- **Backend**: Serverless functions через `api/index.ts`

Все `/api/*` запросы автоматически маршрутизируются к serverless function.

**Основные шаги:**
1. Подключите GitHub репозиторий к Vercel
2. Настройте environment variables (см. [DOCUMENTATION.md](DOCUMENTATION.md))
3. Деплой выполняется автоматически при push в main branch

### Other Platforms

Проект готов к деплою на любых платформах с поддержкой Node.js:
- **Netlify**
- **Railway**
- **Render**
- **Heroku**

См. [DOCUMENTATION.md](DOCUMENTATION.md) и [docs/deployment/](docs/deployment/) для подробных инструкций.

## 📚 Additional Documentation

### Основная документация
- **[DOCUMENTATION.md](DOCUMENTATION.md)** ⭐ - **Полная документация проекта** (рекомендуется начать отсюда)
  - Быстрый старт
  - Настройка Environment Variables
  - Разработка
  - Тестирование
  - Деплой
  - G2A интеграция
  - Архитектура
  - Troubleshooting и FAQ

### Специализированные руководства
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Полное руководство (включает настройку переменных окружения)
- **[docs/deployment/](docs/deployment/)** - Детальные гайды по деплою
- **[docs/api/](docs/api/)** - API документация

### Дополнительные материалы
- `CONTRIBUTING.md` - Contributing guidelines
- `CHANGELOG.md` - Changelog
- `docs/` - Component documentation
- `backend/README.md` - Backend-specific documentation

## 🎯 Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: ~800KB (gzipped ~200KB)

## 🚀 Roadmap

- [ ] PWA support
- [ ] Offline mode
- [ ] Push notifications
- [ ] Extended analytics
- [ ] Multi-language support (i18n)

## 📄 License

Private project - All rights reserved

## 👥 Contributing

Мы приветствуем вклад в проект! Пожалуйста, прочитайте [CONTRIBUTING.md](CONTRIBUTING.md) для получения информации о процессе разработки и стандартах кода.

**Основные шаги:**
1. Fork репозиторий
2. Создайте ветку для вашей функции (`git checkout -b feature/amazing-feature`)
3. Закоммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

Подробности см. в [CONTRIBUTING.md](CONTRIBUTING.md).

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready ✅
