# Environment Variables Guide

Полное руководство по переменным окружения для GKEYS Store.

## 📋 Содержание

- [Frontend Variables](#frontend-variables)
- [Backend Variables](#backend-variables)
- [Быстрый старт](#быстрый-старт)
- [Примеры конфигураций](#примеры-конфигураций)
- [Безопасность](#безопасность)

---

## Frontend Variables

### `.env` (в корне проекта)

```env
# ============================================
# API Configuration
# ============================================

# Backend API base URL
# Development: http://localhost:3001/api
# Production: https://your-project.vercel.app/api
VITE_API_BASE_URL=http://localhost:3001/api
```

**Примечание**: Vite автоматически устанавливает `NODE_ENV` в зависимости от команды. Не устанавливайте `NODE_ENV` вручную в `.env` файлах.

---

## Backend Variables

### `backend/.env`

#### 🔴 Обязательные переменные

##### Database Configuration

```env
# PostgreSQL Database URL (Prisma Accelerate or direct connection)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gkeys_store?schema=public

# Direct Database URL (bypasses Prisma Accelerate, recommended for production)
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/gkeys_store?schema=public
```

**Важно**: 
- `DIRECT_URL` должен быть таким же, как `DATABASE_URL`, но без Prisma Accelerate прокси
- Для Vercel/serverless деплоя всегда используйте `DIRECT_URL`
- Формат: `postgresql://user:password@host:port/database?schema=public`

##### Server Configuration

```env
# Server port (default: 3001)
PORT=3001

# Frontend URL for CORS and redirects
FRONTEND_URL=http://localhost:5173

# Node environment
NODE_ENV=development
```

##### JWT Authentication

```env
# JWT Secret for access tokens (REQUIRED - минимум 32 символа)
JWT_SECRET=your-secret-key-change-in-production-minimum-32-characters-long

# JWT Refresh Secret (REQUIRED - минимум 32 символа, ДОЛЖЕН отличаться от JWT_SECRET)
JWT_REFRESH_SECRET=your-refresh-secret-different-from-jwt-secret-minimum-32-characters
```

**Генерация секретов**:
```bash
# Linux/Mac
openssl rand -base64 32

# Или используйте онлайн генератор
```

#### 🟡 Опциональные, но рекомендуемые

##### Redis Configuration

```env
# Redis URL for caching and session management
REDIS_URL=redis://localhost:6379

# Alternative Redis URL (takes precedence if both are set)
REDIS_GKEYS_REDIS_URL=redis://default:password@host:port
```

**Примечание**: Redis опционален, но рекомендуется для production для улучшения производительности.

##### Email Configuration (SMTP)

```env
# SMTP Host (default: smtp.sendgrid.net)
EMAIL_HOST=smtp.sendgrid.net

# SMTP Port (default: 587)
EMAIL_PORT=587

# SMTP Username
EMAIL_USER=apikey

# SMTP Password/API Key
EMAIL_PASS=your-smtp-password-or-api-key

# From Email Address
EMAIL_FROM=noreply@gkeys.store
```

**Примечание**: Email настройки можно также управлять через админ-панель (`/admin/email-settings`), что рекомендуется для production.

#### 🟢 Опциональные переменные

##### JWT Expiration

```env
# JWT Access Token expiration (default: 7d)
JWT_EXPIRES_IN=7d

# JWT Refresh Token expiration (default: 30d)
JWT_REFRESH_EXPIRES_IN=30d
```

Формат: `number + unit` (s, m, h, d)
Примеры: `1h`, `24h`, `7d`, `30d`

##### CORS Configuration

```env
# CORS allowed origins (comma-separated)
# If not set, uses FRONTEND_URL
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

##### Database Connection

```env
# Force direct database connection (bypass Accelerate)
FORCE_DIRECT_DB=false
```

##### G2A Integration (только если используется G2A)

```env
# G2A API Base URL
G2A_API_URL=https://sandboxapi.g2a.com/v1

# G2A API Key
G2A_API_KEY=your-g2a-api-key

# G2A API Hash/Secret
G2A_API_HASH=your-g2a-api-hash

# G2A Environment (sandbox or live)
G2A_ENV=sandbox

# G2A Email (for Export API)
G2A_EMAIL=Welcome@nalytoo.com

# G2A Request Timeout (milliseconds, default: 8000)
G2A_TIMEOUT_MS=8000

# G2A Max Retries (default: 2)
G2A_RETRY_MAX=2
```

##### Payment Gateways (только если используются)

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Mollie
MOLLIE_API_KEY=test_your_mollie_api_key
```

##### Security & Performance

```env
# Session Secret (for session middleware)
SESSION_SECRET=your-session-secret-minimum-32-characters

# Rate Limiting (requests per minute per IP)
RATE_LIMIT_MAX=100

# Request Timeout (milliseconds)
REQUEST_TIMEOUT=30000
```

##### Logging & Monitoring

```env
# Log Level (error, warn, info, debug)
LOG_LEVEL=info

# Enable Request Logging
ENABLE_REQUEST_LOGGING=true
```

##### Development & Testing

```env
# Enable API Documentation
ENABLE_API_DOCS=true

# Enable Test Mode (disables some validations)
TEST_MODE=false
```

---

## Быстрый старт

### 1. Frontend Setup

Создайте `.env` в корне проекта:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 2. Backend Setup

Создайте `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gkeys_store?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/gkeys_store?schema=public

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-different-from-jwt-secret

# Email (optional)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-smtp-password
EMAIL_FROM=noreply@gkeys.store

# Redis (optional but recommended)
REDIS_URL=redis://localhost:6379
```

---

## Примеры конфигураций

### Development

```env
# Frontend
VITE_API_BASE_URL=http://localhost:3001/api

# Backend
DATABASE_URL=postgresql://postgres:password@localhost:5432/gkeys_dev
DIRECT_URL=postgresql://postgres:password@localhost:5432/gkeys_dev
JWT_SECRET=dev-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=dev-refresh-secret-different-from-jwt-secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=3001
REDIS_URL=redis://localhost:6379
```

### Production (Vercel)

```env
# Frontend
VITE_API_BASE_URL=https://your-project.vercel.app/api

# Backend
DATABASE_URL=postgresql://user:pass@db.example.com:5432/gkeys_prod?sslmode=require
DIRECT_URL=postgresql://user:pass@db.example.com:5432/gkeys_prod?sslmode=require
JWT_SECRET=production-strong-secret-32-chars-minimum-random
JWT_REFRESH_SECRET=production-different-strong-secret-32-chars
FRONTEND_URL=https://your-project.vercel.app
NODE_ENV=production

# Redis (recommended)
REDIS_GKEYS_REDIS_URL=redis://default:password@redis.example.com:16640

# G2A (if using)
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_API_KEY=your-production-api-key
G2A_API_HASH=your-production-api-hash
G2A_ENV=live
```

---

## Сводная таблица переменных

| Переменная | Категория | Обязательно | По умолчанию | Приоритет |
|------------|-----------|-------------|--------------|-----------|
| `VITE_API_BASE_URL` | Frontend | ✅ Да | - | 🔴 Критично |
| `DATABASE_URL` | Backend | ✅ Да | - | 🔴 Критично |
| `DIRECT_URL` | Backend | ✅ Да | - | 🔴 Критично |
| `JWT_SECRET` | Backend | ✅ Да | - | 🔴 Критично |
| `JWT_REFRESH_SECRET` | Backend | ✅ Да | - | 🔴 Критично |
| `FRONTEND_URL` | Backend | ✅ Да | - | 🔴 Критично |
| `NODE_ENV` | Backend | ✅ Да | - | 🔴 Критично |
| `PORT` | Backend | ❌ Нет | `3001` | 🟢 Опционально |
| `REDIS_URL` / `REDIS_GKEYS_REDIS_URL` | Backend | ❌ Нет | - | 🟡 Рекомендуется |
| `JWT_EXPIRES_IN` | Backend | ❌ Нет | `7d` | 🟢 Опционально |
| `JWT_REFRESH_EXPIRES_IN` | Backend | ❌ Нет | `30d` | 🟢 Опционально |
| `EMAIL_HOST` | Email | ❌ Нет | `smtp.sendgrid.net` | 🟡 Рекомендуется |
| `EMAIL_PORT` | Email | ❌ Нет | `587` | 🟡 Рекомендуется |
| `EMAIL_USER` | Email | ❌ Нет | `apikey` | 🟡 Рекомендуется |
| `EMAIL_PASS` | Email | ❌ Нет | - | 🟡 Рекомендуется |
| `EMAIL_FROM` | Email | ❌ Нет | `noreply@gkeys.store` | 🟡 Рекомендуется |
| `G2A_API_URL` | G2A | ✅ Да* | `https://api.g2a.com/integration-api/v1` | 🟡 Если используется G2A |
| `G2A_API_KEY` | G2A | ✅ Да* | - | 🟡 Если используется G2A |
| `G2A_API_HASH` | G2A | ✅ Да* | - | 🟡 Если используется G2A |
| `G2A_ENV` | G2A | ✅ Да* | `sandbox` | 🟡 Если используется G2A |
| `G2A_TIMEOUT_MS` | G2A | ❌ Нет | `8000` | 🟢 Опционально |
| `G2A_RETRY_MAX` | G2A | ❌ Нет | `2` | 🟢 Опционально |
| `G2A_EMAIL` | G2A | ❌ Нет | `Welcome@nalytoo.com` | 🟢 Опционально |
| `STRIPE_SECRET_KEY` | Payment | ❌ Нет | - | 🟢 Опционально |
| `PAYPAL_CLIENT_ID` | Payment | ❌ Нет | - | 🟢 Опционально |
| `MOLLIE_API_KEY` | Payment | ❌ Нет | - | 🟢 Опционально |
| `ALLOWED_ORIGINS` | CORS | ❌ Нет | Uses `FRONTEND_URL` | 🟢 Опционально |
| `FORCE_DIRECT_DB` | Database | ❌ Нет | `false` | 🟢 Опционально |
| `SESSION_SECRET` | Security | ❌ Нет | - | 🟡 Рекомендуется |
| `RATE_LIMIT_MAX` | Security | ❌ Нет | `100` | 🟢 Опционально |
| `LOG_LEVEL` | Logging | ❌ Нет | `info` | 🟢 Опционально |

\* Обязательно только если используется G2A интеграция

---

## Безопасность

### ✅ Рекомендации

1. **Никогда не коммитьте** `.env` файлы в Git
2. **Используйте разные значения** для development и production
3. **Регулярно ротируйте** секретные ключи (JWT_SECRET, G2A_API_KEY)
4. **Используйте сильные пароли** для JWT секретов (минимум 32 символа, случайные)
5. **Включите SSL** для production DATABASE_URL (`?sslmode=require`)
6. **Ограничьте доступ** к Environment Variables в Vercel (только нужным членам команды)
7. **Используйте переменные окружения** вместо hardcoded значений
8. **Проверяйте логи** на наличие утечек секретов

### ❌ Что НЕ делать

1. ❌ Не храните секреты в коде
2. ❌ Не используйте одинаковые секреты для dev и production
3. ❌ Не делитесь `.env` файлами через незащищенные каналы
4. ❌ Не используйте слабые пароли для JWT секретов
5. ❌ Не коммитьте `.env` файлы даже случайно

### Генерация безопасных секретов

```bash
# JWT Secrets
openssl rand -base64 32

# Session Secret
openssl rand -base64 32

# Database Password
openssl rand -base64 24
```

---

## Troubleshooting

### Проблема: Database connection failed

**Решение**:
1. Проверьте, что `DATABASE_URL` или `DIRECT_URL` установлены
2. Убедитесь, что база данных запущена и доступна
3. Для Vercel/serverless используйте `DIRECT_URL` вместо `DATABASE_URL` с Prisma Accelerate

### Проблема: JWT_SECRET must be at least 32 characters

**Решение**:
1. Убедитесь, что `JWT_SECRET` имеет минимум 32 символа
2. Сгенерируйте новый секрет: `openssl rand -base64 32`

### Проблема: JWT_SECRET and JWT_REFRESH_SECRET must be different

**Решение**:
1. Убедитесь, что `JWT_SECRET` и `JWT_REFRESH_SECRET` имеют разные значения
2. Сгенерируйте разные секреты для каждого

### Проблема: Email sending fails

**Решение**:
1. Проверьте SMTP настройки (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`)
2. Убедитесь, что используете правильные credentials для вашего SMTP провайдера
3. Для SendGrid используйте `EMAIL_USER=apikey` и API key в `EMAIL_PASS`
4. Альтернативно, настройте email через админ-панель (`/admin/email-settings`)

---

## Дополнительные ресурсы

- [DOCUMENTATION.md](../DOCUMENTATION.md) - Полная документация проекта
- [docs/deployment/](deployment/) - Гайды по деплою
- [docs/api/](api/) - API документация
