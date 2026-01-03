# Quick Start Guide - GKEYS Store

Быстрый старт для разработчиков.

## 🚀 Быстрая установка

### 1. Клонирование и установка зависимостей

```bash
# Клонировать репозиторий
git clone <repository-url>
cd gkeys2

# Установить зависимости frontend
npm install

# Установить зависимости backend
cd backend
npm install
cd ..
```

### 2. Настройка базы данных

```bash
# Запустить PostgreSQL через Docker
docker run --name gkeys-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=gkeys_store \
  -p 5432:5432 \
  -d postgres:15

# Или использовать существующий контейнер
docker start gkeys-postgres
```

### 3. Настройка переменных окружения

#### Frontend (.env в корне проекта)

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

#### Backend (backend/.env)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gkeys_store?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/gkeys_store?schema=public

# JWT
JWT_SECRET=dev-secret-key-minimum-32-characters-long-random
JWT_REFRESH_SECRET=dev-refresh-secret-different-from-jwt-secret

# Server
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=3001

# G2A (опционально)
G2A_API_URL=https://sandboxapi.g2a.com/v1
G2A_API_KEY=your-sandbox-api-key
G2A_API_HASH=your-sandbox-api-hash
G2A_ENV=sandbox
```

### 4. Инициализация базы данных

```bash
cd backend

# Генерация Prisma Client
npm run prisma:generate

# Применение миграций
npm run db:update
```

### 5. Запуск проекта

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

Проект будет доступен:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

---

## 📦 Команды для работы

### Backend команды

```bash
cd backend

# Разработка
npm run dev                    # Запуск в dev режиме
npm run build                  # Сборка проекта

# База данных
npm run db:update              # Применить миграции (dev)
npm run db:update:deploy       # Применить миграции (production)
npm run prisma:generate        # Генерация Prisma Client
npm run prisma:studio         # Открыть Prisma Studio

# G2A синхронизация
npm run g2a:sync               # Полная синхронизация каталога
npm run g2a:sync:prices        # Синхронизация цен
npm run g2a:sync:stock         # Синхронизация наличия
npm run g2a:sync:all          # Полная синхронизация
npm run orders:sync            # Синхронизация заказов

# Тестирование
npm run test                   # Запустить все тесты
npm run test:unit              # Запустить только unit тесты
npm run test:integration       # Запустить только integration тесты
npm run test:coverage          # Запустить тесты с отчетом покрытия
npm run test:g2a               # Тест G2A интеграции
npm run test:endpoints         # Тест API endpoints
```

### Frontend команды

```bash
npm run dev                    # Запуск dev сервера
npm run build                  # Сборка для production
npm run preview                # Просмотр production сборки
```

### Общие команды

```bash
npm run vercel-build           # Сборка для Vercel
npm run build:all              # Сборка всего проекта
```

---

## 🔧 Минимальный набор переменных окружения

### Обязательные (критичные)

```env
# Frontend
VITE_API_BASE_URL=http://localhost:3001/api

# Backend
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-different
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Для G2A интеграции (если используется)

```env
G2A_API_URL=https://sandboxapi.g2a.com/v1
G2A_API_KEY=your-api-key
G2A_API_HASH=your-api-hash
G2A_ENV=sandbox
```

**Полный список**: [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)

---

## 🧪 Тестирование

### Настройка тестовой базы данных

Тесты используют отдельную тестовую базу данных. Убедитесь, что переменные окружения настроены:

```bash
cd backend
# Тесты автоматически используют DATABASE_URL из .env
npm run test
```

### Запуск тестов

```bash
cd backend

# Все тесты
npm run test

# Только unit тесты
npm run test:unit

# Только integration тесты
npm run test:integration

# С отчетом покрытия
npm run test:coverage
```

### Структура тестов

- **Unit тесты**: `backend/src/__tests__/unit/` - Тестирование отдельных сервисов
- **Integration тесты**: `backend/tests/integration/` - Тестирование API endpoints
- **E2E тесты**: `src/__tests__/e2e/` - Тестирование UI компонентов

Подробнее: [specs/001-test-ecommerce-flows/IMPLEMENTATION_SUMMARY.md](specs/001-test-ecommerce-flows/IMPLEMENTATION_SUMMARY.md)

## 📚 Документация

- **[PROJECT_READINESS_REPORT.md](PROJECT_READINESS_REPORT.md)** - Отчет о готовности проекта
- **[ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)** - Полный справочник переменных окружения
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Полная документация проекта
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Руководство по деплою
- **[specs/001-test-ecommerce-flows/IMPLEMENTATION_SUMMARY.md](specs/001-test-ecommerce-flows/IMPLEMENTATION_SUMMARY.md)** - Сводка по тестированию e-commerce flows

---

## ⚠️ Известные проблемы

- 45 ошибок TypeScript компиляции (не критичны для dev режима)
- Требуется исправление для production сборки

**Подробнее**: [PROJECT_READINESS_REPORT.md](PROJECT_READINESS_REPORT.md)

---

**Последнее обновление**: 2024-12-30
