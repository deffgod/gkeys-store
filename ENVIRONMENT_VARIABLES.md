# Справочник Environment Variables

Полный список всех переменных окружения, используемых в проекте.

---

## Frontend Variables

### VITE_API_BASE_URL

**Описание**: Базовый URL API для frontend. Используется для всех API запросов из React приложения.

**Тип**: `string`

**Обязательно**: ✅ Да

**Пример**:
```
VITE_API_BASE_URL=https://your-project.vercel.app/api
```

**Важно**: 
- URL должен заканчиваться на `/api`
- Для монолитного деплоя используйте тот же Vercel URL, что и для frontend
- После первого деплоя обновите на реальный URL проекта

**Где используется**:
- `src/services/api.js` - базовый URL для всех API запросов
- Все компоненты, делающие API вызовы

---

## Backend Variables

### DATABASE_URL

**Описание**: Connection string для подключения к PostgreSQL базе данных. Используется Prisma для подключения к БД.

**Тип**: `string` (PostgreSQL connection string)

**Обязательно**: ✅ Да

**Формат**:
```
postgresql://[user]:[password]@[host]:[port]/[database]?[parameters]
```

**Пример**:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/gkeys_store?schema=public
```

**Production пример**:
```
DATABASE_URL=postgresql://user:pass@db.example.com:5432/gkeys_prod?sslmode=require
```

**Где используется**:
- `backend/src/config/database.ts` - инициализация Prisma Client
- Prisma migrations
- Все сервисы, работающие с БД

**Безопасность**: 
- Никогда не коммитьте в Git
- Используйте разные значения для development/production
- Включите SSL для production (`?sslmode=require`)

---

### DIRECT_URL

**Описание**: Прямое подключение к базе данных (без connection pooling). Обычно совпадает с `DATABASE_URL`. Используется Prisma для миграций.

**Тип**: `string` (PostgreSQL connection string)

**Обязательно**: ✅ Да

**Пример**:
```
DIRECT_URL=postgresql://user:password@host:5432/database
```

**Примечание**: В большинстве случаев `DIRECT_URL` = `DATABASE_URL`. Отличается только при использовании connection poolers (например, PgBouncer).

**Где используется**:
- Prisma migrations (`prisma migrate deploy`)
- Прямые подключения к БД без pooling

---

### JWT_SECRET

**Описание**: Секретный ключ для подписи JWT access токенов. Должен быть длинным и случайным.

**Тип**: `string`

**Обязательно**: ✅ Да

**Требования**:
- Минимум 32 символа
- Случайная строка (не используйте простые слова)
- Разный для каждого окружения (development/production)

**Пример генерации**:
```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Пример**:
```
JWT_SECRET=your-very-strong-secret-key-minimum-32-characters-long-random-string
```

**Где используется**:
- `backend/src/utils/jwt.ts` - подпись access токенов
- `backend/src/services/auth.service.ts` - создание JWT при логине

**Безопасность**: 
- Никогда не коммитьте в Git
- Используйте разные значения для каждого окружения
- Регулярно ротируйте в production

---

### JWT_REFRESH_SECRET

**Описание**: Секретный ключ для подписи JWT refresh токенов. Должен отличаться от `JWT_SECRET`.

**Тип**: `string`

**Обязательно**: ✅ Да

**Требования**:
- Минимум 32 символа
- Должен отличаться от `JWT_SECRET`
- Случайная строка

**Пример генерации**: Аналогично `JWT_SECRET`

**Пример**:
```
JWT_REFRESH_SECRET=different-strong-secret-key-for-refresh-tokens-minimum-32-chars
```

**Где используется**:
- `backend/src/utils/jwt.ts` - подпись refresh токенов
- `backend/src/services/auth.service.ts` - создание refresh токенов

**Безопасность**: Аналогично `JWT_SECRET`

---

### FRONTEND_URL

**Описание**: URL фронтенд приложения. Используется для настройки CORS и генерации ссылок.

**Тип**: `string` (URL)

**Обязательно**: ✅ Да

**Пример**:
```
FRONTEND_URL=https://your-project.vercel.app
```

**Development пример**:
```
FRONTEND_URL=http://localhost:5173
```

**Где используется**:
- `backend/src/index.ts` - настройка CORS middleware
- Email сервисы (если используются) - для генерации ссылок

**Важно**: 
- Не должен заканчиваться на `/`
- Должен включать протокол (`http://` или `https://`)

---

### NODE_ENV

**Описание**: Окружение выполнения приложения. Влияет на логирование, обработку ошибок и поведение приложения.

**Тип**: `string`

**Обязательно**: ✅ Да

**Возможные значения**:
- `development` - локальная разработка
- `production` - production окружение
- `test` - тестовое окружение

**Пример**:
```
NODE_ENV=production
```

**Где используется**:
- `backend/src/index.ts` - условная логика для разных окружений
- Логирование (более детальное в development)
- Обработка ошибок (скрытие деталей в production)

---

### PORT

**Описание**: Порт, на котором запускается сервер. **Не используется в serverless окружении (Vercel)**.

**Тип**: `number`

**Обязательно**: ❌ Нет

**По умолчанию**: `3001`

**Пример**:
```
PORT=3001
```

**Где используется**:
- `backend/src/index.ts` - только при запуске как standalone server
- Игнорируется в Vercel serverless functions

**Примечание**: В Vercel serverless functions порт не используется, так как Vercel сам управляет маршрутизацией.

---

### REDIS_URL

**Описание**: Connection string для подключения к Redis. Используется для idempotency store (предотвращение дублирования webhook запросов).

**Тип**: `string` (Redis connection string)

**Обязательно**: ❌ Нет (опционально)

**Формат**:
```
redis://[password@]host:port[/database]
```

**Пример**:
```
REDIS_URL=redis://localhost:6379
REDIS_URL=redis://password@redis.example.com:6379/0
```

**Где используется**:
- `backend/src/config/redis.ts` - инициализация Redis клиента
- `backend/src/services/g2a-webhook.service.ts` - idempotency для webhooks
- `backend/src/services/g2a-metrics.service.ts` - хранение метрик

**Примечание**: 
- Если не установлен, idempotency и метрики могут работать некорректно
- Для production рекомендуется использовать Redis для надежности

---

## G2A Integration Variables

### G2A_API_URL

**Описание**: Базовый URL G2A Integration API. Автоматически нормализуется кодом (добавляется `/integration-api/v1` если нужно).

**Тип**: `string` (URL)

**Обязательно**: ✅ Да

**Возможные значения**:

**Production**:
```
G2A_API_URL=https://api.g2a.com/integration-api/v1
```
или просто:
```
G2A_API_URL=https://api.g2a.com
```
(код автоматически добавит `/integration-api/v1`)

**Sandbox** (для тестирования):
```
G2A_API_URL=https://sandboxapi.g2a.com/v1
```

**Пример**:
```
G2A_API_URL=https://api.g2a.com/integration-api/v1
```

**Где используется**:
- `backend/src/config/g2a.ts` - нормализация и валидация URL
- `backend/src/services/g2a.service.ts` - создание Axios клиента

**Документация**: [G2A Integration API Documentation](https://www.g2a.com/integration-api/documentation/)

**Примечание**: 
- Код автоматически нормализует URL, добавляя необходимые пути
- Для production всегда используйте `https://api.g2a.com/integration-api/v1`
- Для тестирования используйте sandbox: `https://sandboxapi.g2a.com/v1`

---

### G2A_API_KEY

**Описание**: API Key для аутентификации в G2A Integration API. Получается в G2A Seller Panel.

**Тип**: `string`

**Обязательно**: ✅ Да

**Как получить**:
1. Войдите в [G2A Seller Panel](https://www.g2a.com/cooperation/api-integration/)
2. Перейдите в раздел "API Integration"
3. Создайте или скопируйте API Key

**Пример**:
```
G2A_API_KEY=74026b3dc2c6db6a30a73e71cdb138b1e1b5eb7a97ced46689e2d28db1050875
```

**Где используется**:
- `backend/src/config/g2a.ts` - получение конфигурации
- `backend/src/services/g2a.service.ts` - аутентификация в G2A API
- Все запросы к G2A API включают этот ключ в заголовки

**Документация**: [G2A API Authentication](https://www.g2a.com/integration-api/documentation/)

**Безопасность**: 
- Никогда не коммитьте в Git
- Используйте разные ключи для sandbox и production
- Регулярно ротируйте ключи

---

### G2A_API_HASH

**Описание**: API Hash для аутентификации в G2A Integration API. Получается в G2A Seller Panel вместе с API Key.

**Тип**: `string`

**Обязательно**: ✅ Да

**Как получить**: Аналогично `G2A_API_KEY` - в G2A Seller Panel

**Пример**:
```
G2A_API_HASH=qdaiciDiyMaTjxMt
```

**Где используется**:
- `backend/src/config/g2a.ts` - получение конфигурации
- `backend/src/services/g2a.service.ts` - аутентификация в G2A API
- Используется для создания подписи запросов (HMAC)

**Документация**: [G2A API Authentication](https://www.g2a.com/integration-api/documentation/)

**Безопасность**: Аналогично `G2A_API_KEY`

**Важно**: API Hash и API Key должны быть из одной пары (созданы вместе в G2A Seller Panel).

---

### G2A_ENV

**Описание**: Окружение G2A API. Определяет, используется ли sandbox или production API.

**Тип**: `string` (enum)

**Обязательно**: ✅ Да

**Возможные значения**:
- `sandbox` - тестовое окружение (рекомендуется для разработки)
- `live` - production окружение

**Пример**:
```
G2A_ENV=sandbox
```

**Где используется**:
- `backend/src/config/g2a.ts` - определение окружения
- `backend/src/services/g2a.service.ts` - условная логика для sandbox/production

**Примечание**: 
- Используйте `sandbox` для тестирования и разработки
- Переключитесь на `live` только после полного тестирования
- Sandbox не выполняет реальные транзакции

---

### G2A_TIMEOUT_MS

**Описание**: Таймаут для запросов к G2A API в миллисекундах.

**Тип**: `number`

**Обязательно**: ❌ Нет

**По умолчанию**: `8000` (8 секунд)

**Пример**:
```
G2A_TIMEOUT_MS=8000
```

**Где используется**:
- `backend/src/config/g2a.ts` - настройка таймаута
- `backend/src/services/g2a.service.ts` - Axios клиент с таймаутом

**Примечание**: 
- Увеличьте значение, если G2A API медленно отвечает
- Не устанавливайте слишком большое значение (рекомендуется 5-15 секунд)

---

### G2A_RETRY_MAX

**Описание**: Максимальное количество повторов запросов к G2A API при ошибках.

**Тип**: `number`

**Обязательно**: ❌ Нет

**По умолчанию**: `2`

**Пример**:
```
G2A_RETRY_MAX=2
```

**Где используется**:
- `backend/src/config/g2a.ts` - настройка количества повторов
- `backend/src/services/g2a.service.ts` - retry логика с exponential backoff

**Примечание**: 
- Используется только для временных ошибок (network errors, 5xx responses)
- Не используется для 4xx ошибок (client errors)

---

## Сводная таблица

| Переменная | Категория | Обязательно | По умолчанию |
|------------|-----------|-------------|--------------|
| `VITE_API_BASE_URL` | Frontend | ✅ Да | - |
| `DATABASE_URL` | Backend | ✅ Да | - |
| `DIRECT_URL` | Backend | ✅ Да | - |
| `JWT_SECRET` | Backend | ✅ Да | - |
| `JWT_REFRESH_SECRET` | Backend | ✅ Да | - |
| `FRONTEND_URL` | Backend | ✅ Да | - |
| `NODE_ENV` | Backend | ✅ Да | - |
| `PORT` | Backend | ❌ Нет | `3001` |
| `REDIS_URL` | Backend | ❌ Нет | - |
| `G2A_API_URL` | G2A | ✅ Да | `https://api.g2a.com/integration-api/v1` |
| `G2A_API_KEY` | G2A | ✅ Да | - |
| `G2A_API_HASH` | G2A | ✅ Да | - |
| `G2A_ENV` | G2A | ✅ Да | `sandbox` |
| `G2A_TIMEOUT_MS` | G2A | ❌ Нет | `8000` |
| `G2A_RETRY_MAX` | G2A | ❌ Нет | `2` |

---

## Примеры конфигураций

### Development (.env)

```bash
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

# Redis (опционально)
REDIS_URL=redis://localhost:6379

# G2A (Sandbox для тестирования)
G2A_API_URL=https://sandboxapi.g2a.com/v1
G2A_API_KEY=your-sandbox-api-key
G2A_API_HASH=your-sandbox-api-hash
G2A_ENV=sandbox
```

### Production (Vercel Environment Variables)

```bash
# Frontend
VITE_API_BASE_URL=https://your-project.vercel.app/api

# Backend
DATABASE_URL=postgresql://user:pass@db.example.com:5432/gkeys_prod?sslmode=require
DIRECT_URL=postgresql://user:pass@db.example.com:5432/gkeys_prod?sslmode=require
JWT_SECRET=production-strong-secret-32-chars-minimum-random
JWT_REFRESH_SECRET=production-different-strong-secret-32-chars
FRONTEND_URL=https://your-project.vercel.app
NODE_ENV=production

# Redis (рекомендуется для production)
REDIS_URL=redis://redis.example.com:6379

# G2A (Production)
G2A_API_URL=https://api.g2a.com/integration-api/v1
G2A_API_KEY=your-production-api-key
G2A_API_HASH=your-production-api-hash
G2A_ENV=live
```

---

## Безопасность

### ✅ Рекомендации

1. **Никогда не коммитьте** `.env` файлы в Git
2. **Используйте разные значения** для development и production
3. **Регулярно ротируйте** секретные ключи (JWT_SECRET, G2A_API_KEY)
4. **Используйте сильные пароли** для JWT секретов (минимум 32 символа, случайные)
5. **Включите SSL** для production DATABASE_URL (`?sslmode=require`)
6. **Ограничьте доступ** к Environment Variables в Vercel (только нужным членам команды)

### ❌ Что НЕ делать

- Не используйте простые слова как секреты
- Не используйте одинаковые секреты для разных окружений
- Не делитесь секретами в чатах или email
- Не храните секреты в коде
- Не используйте production секреты в development

---

## Проверка конфигурации

### Локальная проверка

```bash
# Проверить, что все обязательные переменные установлены
cd backend
node -e "
  const required = ['DATABASE_URL', 'JWT_SECRET', 'G2A_API_KEY', 'G2A_API_HASH'];
  const missing = required.filter(v => !process.env[v]);
  if (missing.length) {
    console.error('Missing:', missing.join(', '));
    process.exit(1);
  }
  console.log('✅ All required variables are set');
"
```

### Проверка в Vercel

1. Перейдите в Vercel Dashboard → Project → Settings → Environment Variables
2. Убедитесь, что все обязательные переменные установлены для нужного окружения (Production/Preview/Development)
3. Проверьте значения на правильность (особенно URLs и connection strings)

---

## Дополнительные ресурсы

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Полное руководство по деплою
- [G2A API Documentation](https://www.g2a.com/integration-api/documentation/) - Официальная документация G2A
- [Prisma Environment Variables](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-strings) - Документация Prisma по connection strings
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables) - Документация Vercel

---

**Последнее обновление**: 2024-12-23
