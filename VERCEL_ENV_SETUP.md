# 🚀 Vercel Environment Variables Setup

Полная инструкция по настройке переменных окружения для деплоя на Vercel.

---

## 📋 Обязательные переменные

### 1. Frontend Variables (Build Environment)

```bash
VITE_API_BASE_URL=https://your-project.vercel.app/api
```

**Важно:**
- ⚠️ Замените `your-project.vercel.app` на реальный URL вашего проекта после первого деплоя
- Должен начинаться с `https://`
- Должен заканчиваться на `/api`
- Target: **Production, Preview, Development**

---

### 2. Database (PostgreSQL)

```bash
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/database?sslmode=require
```

**Как получить:**
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) - нативная интеграция
- [Neon](https://neon.tech/) - бесплатный serverless PostgreSQL
- [Supabase](https://supabase.com/) - бесплатный PostgreSQL + дополнительные сервисы
- [Railway](https://railway.app/) - простой деплой PostgreSQL

**Важно:**
- Используйте `?sslmode=require` для production
- `DIRECT_URL` обычно совпадает с `DATABASE_URL`
- Target: **Production, Preview, Development**

---

### 3. JWT Authentication

```bash
JWT_SECRET=your-very-strong-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=different-strong-secret-key-for-refresh-tokens-min-32-chars
```

**Как сгенерировать:**
```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Важно:**
- Минимум 32 символа
- Используйте РАЗНЫЕ ключи для `JWT_SECRET` и `JWT_REFRESH_SECRET`
- Никогда не используйте один и тот же ключ для development и production
- Target: **Production, Preview, Development**

---

### 4. Application Configuration

```bash
NODE_ENV=production
FRONTEND_URL=https://your-project.vercel.app
```

**Важно:**
- `NODE_ENV` должен быть `production` для production окружения
- `FRONTEND_URL` не должен заканчиваться на `/`
- ⚠️ Замените `your-project.vercel.app` на реальный URL
- Target: **Production, Preview, Development**

---

### 5. G2A Integration (Обязательно для работы с G2A)

```bash
G2A_API_KEY=74026b3dc2c6db6a30a73e71cdb138b1e1b5eb7a97ced46689e2d28db1050875
G2A_API_HASH=qdaiciDiyMaTjxMt
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_ENV=sandbox
```

**Как получить:**
1. Зарегистрируйтесь на [G2A Seller Panel](https://www.g2a.com/cooperation/api-integration/)
2. Перейдите в раздел **API Integration**
3. Создайте API Key и API Hash
4. Скопируйте оба значения

**Важно для новой G2A интеграции:**
- `G2A_API_KEY` и `G2A_API_HASH` используются для OAuth2 и Hash аутентификации
- `G2A_ENV` должен быть `sandbox` для тестирования, `live` для production
- `G2A_API_URL` - можно указать как `https://api.g2a.com` (автоматически нормализуется)
- Для тестирования используйте sandbox: `G2A_API_URL=https://sandboxapi.g2a.com/v1`
- Target: **Production, Preview, Development**

**⚠️ Обратная совместимость со старыми именами:**
- Новый клиент поддерживает старые имена переменных:
  - `G2A_CLIENT_ID` → используйте `G2A_API_KEY` (новое имя)
  - `G2A_CLIENT_SECRET` → используйте `G2A_API_HASH` (новое имя)
  - `G2A_API_BASE` → используйте `G2A_API_URL` (новое имя)
- Если используете старые имена, клиент выведет предупреждение
- Рекомендуется мигрировать на новые имена для соответствия документации

---

## 🔧 Опциональные переменные

### 6. Redis (Рекомендуется для production)

```bash
REDIS_URL=redis://default:password@redis.example.com:6379
# или
REDIS_GKEYS_REDIS_URL=redis://default:password@redis.example.com:16640
```

**Зачем нужен Redis:**
- ✅ Кеширование OAuth2 токенов G2A
- ✅ Idempotency для webhooks (предотвращение дублирования)
- ✅ Метрики и мониторинг G2A API
- ✅ Прогресс синхронизации данных
- ✅ Кеширование часто запрашиваемых данных

**Как получить:**
- [Upstash](https://upstash.com/) - бесплатный serverless Redis (рекомендуется для Vercel)
- [Redis Cloud](https://redis.com/try-free/) - официальный Redis сервис
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv) - нативная интеграция Vercel

**Важно:**
- Если установлены обе переменные, `REDIS_GKEYS_REDIS_URL` имеет приоритет
- Не обязательно для работы, но **настоятельно рекомендуется** для production
- Target: **Production, Preview** (опционально для Development)

---

### 7. JWT Token Expiration (Опционально)

```bash
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**По умолчанию:**
- `JWT_EXPIRES_IN=7d` (7 дней)
- `JWT_REFRESH_EXPIRES_IN=30d` (30 дней)

**Рекомендации:**
- Production: `JWT_EXPIRES_IN=24h`, `JWT_REFRESH_EXPIRES_IN=30d`
- Development: `JWT_EXPIRES_IN=7d`, `JWT_REFRESH_EXPIRES_IN=90d`
- Target: **Production, Preview, Development**

---

### 8. G2A Advanced Configuration (Опционально)

```bash
G2A_TIMEOUT_MS=8000
G2A_RETRY_MAX=2
G2A_EMAIL=your-email@example.com
```

**По умолчанию:**
- `G2A_TIMEOUT_MS=8000` (8 секунд)
- `G2A_RETRY_MAX=2` (2 повторных попытки)
- `G2A_EMAIL` - требуется только для Export API в production

**Важно:**
- `G2A_EMAIL` используется для генерации API ключа Export API
- Не обязательно для базовой работы с Import API
- Target: **Production** (опционально)

---

## 📝 Полный список для копирования в Vercel

### Минимальный набор (без G2A)

```bash
# Frontend
VITE_API_BASE_URL=https://your-project.vercel.app/api

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/database?sslmode=require

# JWT
JWT_SECRET=your-very-strong-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=different-strong-secret-key-for-refresh-tokens-min-32-chars

# Application
NODE_ENV=production
FRONTEND_URL=https://your-project.vercel.app
```

---

### Полный набор (с G2A Integration)

```bash
# Frontend
VITE_API_BASE_URL=https://your-project.vercel.app/api

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/database?sslmode=require

# JWT
JWT_SECRET=your-very-strong-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=different-strong-secret-key-for-refresh-tokens-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Application
NODE_ENV=production
FRONTEND_URL=https://your-project.vercel.app

# Redis (рекомендуется)
REDIS_URL=redis://default:password@redis.example.com:6379

# G2A Integration (NEW!)
G2A_API_KEY=your-g2a-api-key
G2A_API_HASH=your-g2a-api-hash
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_ENV=sandbox
G2A_TIMEOUT_MS=8000
G2A_RETRY_MAX=2
G2A_EMAIL=your-email@example.com
```

---

## 🔐 Важные замечания по безопасности

### ✅ Что делать:
1. **Используйте сильные случайные секреты** для JWT (минимум 32 символа)
2. **Разные ключи для разных окружений** (development/preview/production)
3. **SSL для базы данных** в production (`?sslmode=require`)
4. **Redis с паролем** для production
5. **Sandbox G2A** для тестирования, `live` только после полной проверки

### ❌ Что НЕ делать:
1. ❌ Не используйте простые слова как секреты (`password123`, `secret`)
2. ❌ Не используйте одинаковые JWT секреты для development и production
3. ❌ Не коммитьте `.env` файлы в Git
4. ❌ Не делитесь секретами в чатах или email
5. ❌ Не используйте production G2A API Key в development

---

## 📖 Пошаговая инструкция настройки в Vercel

### Шаг 1: Откройте проект в Vercel Dashboard
1. Перейдите на [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **Settings** → **Environment Variables**

### Шаг 2: Добавьте переменные по одной
Для каждой переменной:
1. Нажмите **Add New**
2. В поле **Name** введите имя переменной (например, `DATABASE_URL`)
3. В поле **Value** введите значение
4. Выберите окружения:
   - ✅ **Production** - для production деплоя
   - ✅ **Preview** - для preview деплоя (ветки)
   - ✅ **Development** - для локальной разработки (опционально)
5. Нажмите **Save**

### Шаг 3: Проверьте все обязательные переменные
Убедитесь, что добавлены все переменные из раздела "Обязательные переменные":
- ✅ `VITE_API_BASE_URL`
- ✅ `DATABASE_URL`
- ✅ `DIRECT_URL`
- ✅ `JWT_SECRET`
- ✅ `JWT_REFRESH_SECRET`
- ✅ `NODE_ENV`
- ✅ `FRONTEND_URL`
- ✅ `G2A_API_KEY` (если используется G2A)
- ✅ `G2A_API_HASH` (если используется G2A)
- ✅ `G2A_API_URL` (если используется G2A)
- ✅ `G2A_ENV` (если используется G2A)

### Шаг 4: Обновите временные URL
После первого успешного деплоя:
1. Скопируйте реальный URL проекта (например, `https://gkeys2.vercel.app`)
2. Обновите переменные:
   - `VITE_API_BASE_URL` → `https://gkeys2.vercel.app/api`
   - `FRONTEND_URL` → `https://gkeys2.vercel.app`
3. Сохраните изменения

### Шаг 5: Выполните миграции базы данных
После первого деплоя выполните миграции:

**Вариант 1: Через Vercel CLI**
```bash
vercel env pull .env.production.local
cd backend
npx prisma migrate deploy
```

**Вариант 2: Через Build Command**
- Vercel автоматически выполнит миграции при билде (настроено в `package.json`)

### Шаг 6: Redeploy
После добавления всех переменных:
1. Перейдите в **Deployments**
2. Нажмите на последний деплой
3. Нажмите **⋯** (три точки) → **Redeploy**
4. Выберите **Use existing Build Cache** (или без кеша если были изменения)
5. Нажмите **Redeploy**

---

## ✅ Проверка правильности настройки

### 1. Health Check
После деплоя проверьте health endpoint:
```bash
curl https://your-project.vercel.app/api/health
```

**Ожидаемый ответ:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-30T...",
  "environment": "production",
  "database": "connected"
}
```

### 2. G2A Integration Check (если используется)
Проверьте G2A интеграцию:
```bash
curl https://your-project.vercel.app/api/g2a/health
```

**Ожидаемый ответ:**
```json
{
  "status": "ok",
  "g2aEnv": "sandbox",
  "configured": true
}
```

### 3. Database Check
Проверьте подключение к базе данных:
```bash
curl https://your-project.vercel.app/api/games?limit=1
```

**Если база данных пустая:**
```json
{
  "games": [],
  "totalCount": 0
}
```

**Если база данных заполнена:**
```json
{
  "games": [{ "id": "...", "title": "...", ... }],
  "totalCount": N
}
```

---

## 🐛 Troubleshooting

### Проблема: Build fails with "Missing environment variable"
**Решение:**
1. Убедитесь, что все обязательные переменные добавлены в Vercel
2. Проверьте, что выбрано правильное окружение (Production/Preview/Development)
3. Redeploy после добавления переменных

### Проблема: Database connection error
**Решение:**
1. Проверьте формат `DATABASE_URL` (должен начинаться с `postgresql://`)
2. Убедитесь, что добавлен `?sslmode=require` для production
3. Проверьте, что `DIRECT_URL` совпадает с `DATABASE_URL`
4. Убедитесь, что IP адрес Vercel разрешен в вашей базе данных

### Проблема: JWT authentication fails
**Решение:**
1. Проверьте, что `JWT_SECRET` и `JWT_REFRESH_SECRET` установлены
2. Убедитесь, что ключи минимум 32 символа
3. Убедитесь, что `JWT_SECRET` ≠ `JWT_REFRESH_SECRET`

### Проблема: G2A API calls fail
**Решение:**
1. Проверьте, что `G2A_API_KEY` и `G2A_API_HASH` правильные
2. Убедитесь, что `G2A_ENV` соответствует вашим ключам (sandbox/live)
3. Проверьте `G2A_API_URL` (должен быть правильный URL для выбранного окружения)
4. Если используете sandbox, убедитесь: `G2A_API_URL=https://sandboxapi.g2a.com/v1`
5. Если используете production, убедитесь: `G2A_API_URL=https://api.g2a.com/integration-api/v1`

### Проблема: Redis connection fails (если используется)
**Решение:**
1. Проверьте формат `REDIS_URL` (должен начинаться с `redis://`)
2. Убедитесь, что Redis сервер доступен из Vercel
3. Проверьте пароль и порт
4. Redis не обязателен - приложение будет работать без него (но без кеширования)

### Проблема: CORS errors
**Решение:**
1. Убедитесь, что `FRONTEND_URL` установлен правильно
2. `FRONTEND_URL` не должен заканчиваться на `/`
3. `FRONTEND_URL` должен совпадать с реальным URL проекта в Vercel

---

## 📚 Дополнительные ресурсы

- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Полный справочник всех переменных
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Руководство по деплою
- [backend/src/lib/g2a/README.md](backend/src/lib/g2a/README.md) - Документация новой G2A интеграции
- [docs/g2a/client-usage.md](docs/g2a/client-usage.md) - Руководство по использованию G2A клиента
- [G2A API Documentation](https://www.g2a.com/integration-api/documentation/) - Официальная документация G2A
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables) - Документация Vercel

---

## 🎯 Quick Checklist

Перед деплоем убедитесь:

- [ ] ✅ Все обязательные переменные добавлены в Vercel
- [ ] ✅ `VITE_API_BASE_URL` заканчивается на `/api`
- [ ] ✅ `DATABASE_URL` содержит `?sslmode=require` для production
- [ ] ✅ JWT секреты минимум 32 символа и разные
- [ ] ✅ `NODE_ENV=production` для production окружения
- [ ] ✅ `G2A_ENV=sandbox` для тестирования (или `live` для production)
- [ ] ✅ Redis настроен (рекомендуется)
- [ ] ✅ Все URL не содержат trailing slash `/`
- [ ] ✅ После деплоя обновлены временные URL на реальные
- [ ] ✅ Выполнены миграции базы данных
- [ ] ✅ Health check endpoint возвращает `200 OK`

---

**Последнее обновление:** 30 декабря 2024  
**Версия:** 2.0 (с новой G2A Integration)
