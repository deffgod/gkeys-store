# Deployment Fixes - Решения проблем деплоя

## ✅ Исправленные проблемы

### 1. Ошибка миграции Prisma (P3015)

**Проблема**: 
```
Error: P3015 - Could not find the migration file at prisma/migrations/20251223180600_add_external_order_id/migration.sql
```

**Решение**: 
- Удалена пустая директория миграции `20251223180600_add_external_order_id`
- Актуальная миграция находится в `20251223180000_add_external_order_id/migration.sql`

**Статус**: ✅ Исправлено и закоммичено

---

## 🔧 Требуют настройки Environment Variables в Vercel

### 2. Отсутствуют G2A API credentials

**Проблема**:
```
G2A credentials missing: G2A_API_KEY and G2A_API_HASH (or G2A_API_SECRET) are required
```

**Решение**:
1. Перейдите в Vercel Dashboard → Ваш проект → Settings → Environment Variables
2. Добавьте следующие переменные для **Production**:

```
G2A_API_KEY=your-g2a-api-key
G2A_API_HASH=your-g2a-api-hash
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_ENV=sandbox
```

**Для sandbox тестирования**:
```
G2A_API_URL=https://sandboxapi.g2a.com/v1
G2A_ENV=sandbox
```

**Для production**:
```
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_ENV=live
```

**Важно**: После добавления переменных выполните **Redeploy** проекта.

---

### 3. Ошибка подключения к базе данных

**Проблема**:
```
Can't reach database server at db.prisma.io:5432
PrismaClientKnownRequestError: P1001
```

**Решение**:
1. Убедитесь, что `DATABASE_URL` и `DIRECT_URL` правильно настроены в Vercel
2. Проверьте, что база данных доступна из интернета (не только localhost)
3. Для Prisma Cloud используйте правильный формат URL:
   ```
   DATABASE_URL=postgresql://user:password@db.prisma.io:5432/database?pgbouncer=true&connect_timeout=15
   DIRECT_URL=postgresql://user:password@db.prisma.io:5432/database
   ```

**Проверка**:
- Убедитесь, что база данных запущена и доступна
- Проверьте firewall правила
- Убедитесь, что credentials правильные

---

### 4. Ошибка подключения к Redis

**Проблема**:
```
Redis Client Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Решение**:

**Вариант A: Настроить Redis (рекомендуется для production)**

1. Создайте Redis instance (например, Redis Cloud, Upstash, или другой провайдер)
2. Добавьте в Vercel Environment Variables:
   ```
   REDIS_URL=redis://user:password@host:port
   ```
   или
   ```
   REDIS_GKEYS_REDIS_URL=redis://user:password@host:port
   ```

**Вариант B: Graceful degradation (временное решение)**

Приложение должно работать без Redis, но с ограниченной функциональностью (без кеширования). Проверьте, что код обрабатывает отсутствие Redis корректно.

**Для локального тестирования** можно оставить Redis опциональным, но для production рекомендуется настроить Redis.

---

### 5. Backend не компилируется

**Проблема**:
```
Compiled backend not found at ../backend/dist/index.js
Failed to import backend
```

**Решение**:
- Эта проблема была вызвана ошибкой миграции (уже исправлено)
- После исправления миграции, backend должен компилироваться корректно
- Убедитесь, что команда `npm run vercel-build` выполняется успешно

**Проверка**:
```bash
# Локально проверьте сборку
npm run vercel-build
```

---

## 📋 Чеклист для успешного деплоя

### Обязательные Environment Variables

Добавьте в Vercel Dashboard → Settings → Environment Variables для **Production**:

#### Database
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `DIRECT_URL` - PostgreSQL direct connection (для миграций)

#### Authentication
- [ ] `JWT_SECRET` - минимум 32 символа
- [ ] `JWT_REFRESH_SECRET` - минимум 32 символа, отличается от JWT_SECRET

#### G2A Integration
- [ ] `G2A_API_KEY` - G2A API ключ
- [ ] `G2A_API_HASH` - G2A API hash
- [ ] `G2A_API_URL` - URL G2A API
- [ ] `G2A_ENV` - `sandbox` или `live`

#### Frontend
- [ ] `VITE_API_BASE_URL` - URL вашего Vercel деплоя (например: `https://your-project.vercel.app/api`)

#### Optional (но рекомендуется)
- [ ] `REDIS_URL` или `REDIS_GKEYS_REDIS_URL` - Redis connection string
- [ ] `FRONTEND_URL` - URL фронтенда (для CORS)
- [ ] `NODE_ENV=production`

### После настройки

1. **Redeploy проект** в Vercel Dashboard
2. **Проверьте логи сборки** - убедитесь, что нет ошибок
3. **Проверьте health endpoint**: `https://your-project.vercel.app/api/health`
4. **Проверьте миграции** - они должны применяться автоматически во время сборки

---

## 🔍 Проверка после деплоя

### 1. Health Check

```bash
curl https://your-project.vercel.app/api/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2024-12-25T...",
  "checks": {
    "database": "ok",
    "redis": "ok" or "disconnected",
    "g2a": "ok"
  }
}
```

### 2. Проверка миграций

Миграции должны применяться автоматически во время сборки. Проверьте логи сборки в Vercel Dashboard - должны быть строки:
```
✔ Applied migration: 20251205120727_
✔ Applied migration: 20251223180000_add_external_order_id
```

### 3. Проверка API endpoints

```bash
# Регистрация
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","nickname":"TestUser"}'

# Получение игр
curl https://your-project.vercel.app/api/games
```

---

## 🆘 Если проблемы остаются

1. **Проверьте логи Vercel**:
   - Build logs - для ошибок сборки
   - Function logs - для ошибок runtime

2. **Проверьте Environment Variables**:
   - Убедитесь, что все переменные добавлены для правильного окружения (Production/Preview/Development)
   - Проверьте, что значения правильные (без лишних пробелов, кавычек)

3. **Проверьте подключение к БД**:
   ```bash
   # Локально проверьте подключение
   cd backend
   DATABASE_URL="your-production-url" npm run db:check
   ```

4. **Проверьте миграции локально**:
   ```bash
   cd backend
   DATABASE_URL="your-production-url" npm run prisma:migrate:deploy
   ```

---

## 📝 Примечания

- Все Environment Variables должны быть добавлены **до** первого деплоя
- После добавления переменных обязательно выполните **Redeploy**
- Миграции применяются автоматически во время сборки (не нужно запускать вручную)
- Redis опционален, но рекомендуется для production (улучшает производительность)

