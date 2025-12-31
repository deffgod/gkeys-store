# ⚡ Vercel Environment Variables - Quick Setup

Быстрая шпаргалка для копирования в Vercel. Замените значения на свои.

---

## 📋 Шаблон для копирования (все переменные)

```bash
# === Frontend ===
VITE_API_BASE_URL=https://your-project.vercel.app/api

# === Database ===
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/database?sslmode=require

# === JWT Authentication ===
JWT_SECRET=GENERATE_32_CHARS_RANDOM_STRING_HERE
JWT_REFRESH_SECRET=GENERATE_DIFFERENT_32_CHARS_RANDOM_STRING_HERE
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# === Application ===
NODE_ENV=production
FRONTEND_URL=https://your-project.vercel.app

# === Redis (Optional but Recommended) ===
REDIS_URL=redis://default:password@host:6379

# === G2A Integration ===
# NEW names (recommended):
G2A_API_KEY=your-g2a-api-key-from-seller-panel
G2A_API_HASH=your-g2a-api-hash-from-seller-panel
G2A_API_URL=https://api.g2a.com/integration-api/v1

# OR use OLD names (backward compatibility):
# G2A_CLIENT_ID=your-g2a-api-key-from-seller-panel
# G2A_CLIENT_SECRET=your-g2a-api-hash-from-seller-panel
# G2A_API_BASE=https://sandboxapi.g2a.com/v1

# Common for both:
G2A_ENV=sandbox
G2A_TIMEOUT_MS=8000
G2A_RETRY_MAX=2
G2A_EMAIL=your-email@example.com
```

---

## 🎯 Минимальный набор (базовая функциональность без G2A)

```bash
VITE_API_BASE_URL=https://your-project.vercel.app/api
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/database?sslmode=require
JWT_SECRET=GENERATE_32_CHARS_RANDOM_STRING_HERE
JWT_REFRESH_SECRET=GENERATE_DIFFERENT_32_CHARS_RANDOM_STRING_HERE
NODE_ENV=production
FRONTEND_URL=https://your-project.vercel.app
```

---

## 🔑 Генерация JWT секретов

### Linux/Mac:
```bash
openssl rand -base64 32
```

### Node.js (любая ОС):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Сгенерируйте **ДВА РАЗНЫХ** ключа для `JWT_SECRET` и `JWT_REFRESH_SECRET`!

---

## 🗄️ Где получить Database URL

### Рекомендуемые сервисы:

1. **Vercel Postgres** (интеграция в один клик)
   ```
   https://vercel.com/docs/storage/vercel-postgres
   ```

2. **Neon** (бесплатный serverless PostgreSQL)
   ```
   https://neon.tech/
   ```

3. **Supabase** (PostgreSQL + дополнительные сервисы)
   ```
   https://supabase.com/
   ```

После создания БД скопируйте connection string и добавьте `?sslmode=require`:
```
postgresql://user:password@host:5432/database?sslmode=require
```

---

## 🔴 Redis (Опционально, но рекомендуется)

### Рекомендуемые сервисы:

1. **Upstash** (serverless Redis, бесплатно)
   ```
   https://upstash.com/
   ```

2. **Vercel KV** (нативная интеграция)
   ```
   https://vercel.com/docs/storage/vercel-kv
   ```

3. **Redis Cloud** (официальный Redis)
   ```
   https://redis.com/try-free/
   ```

---

## 🎮 G2A Integration

### Получение ключей:

1. Зарегистрируйтесь: https://www.g2a.com/cooperation/api-integration/
2. Перейдите в **API Integration**
3. Создайте **API Key** и **API Hash**
4. Скопируйте оба значения

### Для тестирования (Sandbox):
```bash
G2A_API_KEY=your-sandbox-api-key
G2A_API_HASH=your-sandbox-api-hash
G2A_API_URL=https://sandboxapi.g2a.com/v1
G2A_ENV=sandbox
```

### Для production:
```bash
G2A_API_KEY=your-production-api-key
G2A_API_HASH=your-production-api-hash
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_ENV=live
```

⚠️ **Важно:** Используйте `sandbox` для тестирования, `live` только после проверки!

---

## ✅ Checklist перед деплоем

- [ ] Сгенерированы **два разных** JWT секрета (минимум 32 символа)
- [ ] `DATABASE_URL` и `DIRECT_URL` содержат `?sslmode=require`
- [ ] `VITE_API_BASE_URL` заканчивается на `/api`
- [ ] `FRONTEND_URL` **НЕ** заканчивается на `/`
- [ ] `NODE_ENV=production` для production окружения
- [ ] G2A ключи соответствуют выбранному окружению (sandbox/live)
- [ ] Все URL начинаются с `https://` (или `http://` для localhost)
- [ ] После первого деплоя обновлены временные URL на реальные

---

## 🚀 После добавления переменных

1. **Redeploy** проект в Vercel:
   - Deployments → последний деплой → ⋯ → Redeploy

2. **Проверьте Health Check:**
   ```bash
   curl https://your-project.vercel.app/api/health
   ```

3. **Выполните миграции БД** (если нужно):
   ```bash
   vercel env pull .env.production.local
   cd backend
   npx prisma migrate deploy
   ```

---

## 📚 Полная документация

Для детальной информации см.:
- [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md) - Полная инструкция
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Справочник всех переменных
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Руководство по деплою

---

**Совет:** Сохраните сгенерированные секреты в надежном месте (password manager)!
