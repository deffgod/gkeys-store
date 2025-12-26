# Полное Руководство по Деплою на Vercel

## 🚀 Быстрый старт (5 минут)

Если у вас уже все готово, выполните эти команды:

```bash
# 1. Git commit и push
git add . && git commit -m "Deploy: Ready for production" && git push

# 2. Деплой через CLI
vercel --prod
```

Или используйте [Vercel Dashboard](#метод-1-vercel-dashboard) для визуального деплоя.

---

## 📋 Предварительные требования

Перед началом деплоя убедитесь, что у вас есть:

- ✅ **Node.js 20+** установлен
- ✅ **Git репозиторий** с кодом проекта
- ✅ **Vercel аккаунт** (бесплатный: https://vercel.com/signup)
- ✅ **PostgreSQL база данных** (для production)
- ✅ **G2A API credentials** (API Key и API Hash)
  - Получить можно в [G2A Seller Panel](https://www.g2a.com/cooperation/api-integration/)
  - Документация: https://www.g2a.com/integration-api/documentation/

---

## 🔧 Подготовка к деплою

### 1. Git подготовка

Убедитесь, что все изменения закоммичены:

```bash
# Проверить статус
git status

# Добавить все изменения
git add .

# Создать коммит
git commit -m "feat: Prepare for production deployment

- Configure monolith deployment
- Update environment variables
- Complete G2A integration"

# Отправить в репозиторий
git push origin main
# или
git push origin 003-design-ui-kit
```

### 2. Локальная проверка сборки

Проверьте, что проект собирается без ошибок:

```bash
# Собрать frontend и backend
npm run build:all

# Проверить, что dist/ и backend/dist/ созданы
ls -la dist/
ls -la backend/dist/
```

Если сборка успешна, можно продолжать деплой.

### 3. Подготовка Environment Variables

Подготовьте список всех необходимых переменных окружения. Полный список см. в [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md).

**Минимально необходимые для первого деплоя:**

- `DATABASE_URL` - строка подключения к PostgreSQL
- `JWT_SECRET` - секретный ключ для JWT (32+ символов)
- `JWT_REFRESH_SECRET` - секретный ключ для refresh токенов
- `G2A_API_KEY` - G2A API ключ
- `G2A_API_HASH` - G2A API хеш
- `G2A_API_URL` - URL G2A API (обычно: `https://api.g2a.com/integration-api/v1`)
- `VITE_API_BASE_URL` - будет установлен после первого деплоя

---

## 🚢 Деплой на Vercel

### Метод 1: Vercel Dashboard (Рекомендуется)

#### Шаг 1: Импорт проекта

1. Перейдите на https://vercel.com/new
2. Войдите в аккаунт (или создайте новый)
3. Нажмите **"Import Git Repository"**
4. Выберите ваш репозиторий `gkeys2`
5. Нажмите **"Import"**

#### Шаг 2: Настройка проекта

В форме настройки проекта укажите:

- **Framework Preset**: `Vite`
- **Root Directory**: `.` (оставьте пустым или укажите точку)
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install && cd backend && npm install`

**Важно**: 
- Используйте именно `npm run vercel-build`, который собирает и frontend, и backend
- Команда автоматически применяет Prisma миграции к базе данных во время сборки
- Убедитесь, что `DATABASE_URL` и `DIRECT_URL` настроены в Environment Variables перед первым деплоем

#### Шаг 3: Environment Variables

Перед деплоем добавьте все необходимые переменные окружения:

1. Нажмите **"Environment Variables"**
2. Добавьте переменные для **Production**, **Preview** и **Development**:

**Frontend:**
```
VITE_API_BASE_URL = https://your-project.vercel.app/api
```
*(Используйте URL, который вы получите после деплоя. Можно обновить позже.)*

**Backend (обязательные):**
```
DATABASE_URL = postgresql://user:password@host:5432/database
DIRECT_URL = postgresql://user:password@host:5432/database
JWT_SECRET = your-strong-secret-key-minimum-32-characters
JWT_REFRESH_SECRET = different-strong-secret-key-minimum-32-characters
G2A_API_URL = https://api.g2a.com/integration-api/v1
G2A_API_KEY = your-g2a-api-key
G2A_API_HASH = your-g2a-api-hash
G2A_ENV = sandbox
FRONTEND_URL = https://your-project.vercel.app
NODE_ENV = production
```

**Опциональные:**
```
REDIS_URL = redis://host:6379
PORT = 3001
G2A_TIMEOUT_MS = 8000
G2A_RETRY_MAX = 2
```

3. Нажмите **"Save"** для каждой переменной

#### Шаг 4: Деплой

1. Нажмите **"Deploy"**
2. Дождитесь завершения сборки (~3-5 минут)
3. Скопируйте URL деплоя (например: `https://gkeys2-xxx.vercel.app`)

#### Шаг 5: Обновление VITE_API_BASE_URL

После первого деплоя:

1. Скопируйте URL деплоя
2. Перейдите в **Settings → Environment Variables**
3. Обновите `VITE_API_BASE_URL` на: `https://your-actual-url.vercel.app/api`
4. Нажмите **"Redeploy"** или подождите автоматического передеплоя

### Метод 2: Vercel CLI

#### Установка и авторизация

```bash
# Установить Vercel CLI глобально
npm i -g vercel

# Войти в аккаунт
vercel login
```

#### Первый деплой

```bash
# Из корня проекта
cd /path/to/gkeys2

# Запустить деплой
vercel

# Следовать подсказкам:
# - Set up and deploy? → Yes
# - Which scope? → выберите ваш аккаунт
# - Link to existing project? → No (для первого деплоя)
# - Project name? → gkeys2
# - Directory? → ./
# - Override settings? → No
```

#### Установка Environment Variables через CLI

```bash
# Добавить переменную
vercel env add DATABASE_URL production
# Введите значение при запросе

# Добавить для всех окружений
vercel env add JWT_SECRET production preview development

# Просмотреть все переменные
vercel env ls
```

#### Production деплой

```bash
# Деплой в production
vercel --prod
```

---

## 🔐 Environment Variables - Полный список

### Frontend Variables

| Переменная | Описание | Обязательно | Пример |
|------------|----------|-------------|--------|
| `VITE_API_BASE_URL` | Базовый URL API для frontend | ✅ Да | `https://your-project.vercel.app/api` |

**Важно**: URL должен заканчиваться на `/api`

### Backend Variables

| Переменная | Описание | Обязательно | Пример |
|------------|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Да | `postgresql://user:pass@host:5432/db` |
| `DIRECT_URL` | Прямое подключение к БД (обычно = DATABASE_URL) | ✅ Да | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Секретный ключ для JWT токенов (32+ символов) | ✅ Да | `your-very-strong-secret-key-here` |
| `JWT_REFRESH_SECRET` | Секретный ключ для refresh токенов (32+ символов) | ✅ Да | `different-strong-secret-key` |
| `FRONTEND_URL` | URL фронтенда для CORS | ✅ Да | `https://your-project.vercel.app` |
| `NODE_ENV` | Окружение приложения | ✅ Да | `production` |
| `PORT` | Порт сервера (не используется в serverless) | ❌ Нет | `3001` |
| `REDIS_URL` | Redis connection string для idempotency | ❌ Нет | `redis://host:6379` |

### G2A Integration Variables

| Переменная | Описание | Обязательно | Пример | Документация |
|------------|----------|-------------|--------|--------------|
| `G2A_API_URL` | Базовый URL G2A API | ✅ Да | `https://api.g2a.com/integration-api/v1` | [G2A API Docs](https://www.g2a.com/integration-api/documentation/) |
| `G2A_API_KEY` | G2A API Key (получить в Seller Panel) | ✅ Да | `74026b3dc2c6db6a30a73e71cdb138b1e1b5eb7a97ced46689e2d28db1050875` | [G2A API Docs](https://www.g2a.com/integration-api/documentation/) |
| `G2A_API_HASH` | G2A API Hash (получить в Seller Panel) | ✅ Да | `qdaiciDiyMaTjxMt` | [G2A API Docs](https://www.g2a.com/integration-api/documentation/) |
| `G2A_ENV` | Окружение G2A (`sandbox` или `live`) | ✅ Да | `sandbox` | - |
| `G2A_TIMEOUT_MS` | Таймаут запросов к G2A API (мс) | ❌ Нет | `8000` (по умолчанию) | - |
| `G2A_RETRY_MAX` | Максимальное количество повторов запросов | ❌ Нет | `2` (по умолчанию) | - |

**Как получить G2A credentials:**

1. Войдите в [G2A Seller Panel](https://www.g2a.com/cooperation/api-integration/)
2. Перейдите в раздел API Integration
3. Создайте или скопируйте API Key и API Hash
4. Используйте `sandbox` для тестирования, `live` для production

**Важно**: 
- `G2A_API_URL` автоматически нормализуется кодом (добавляется `/integration-api/v1` если нужно)
- Для sandbox используйте: `https://sandboxapi.g2a.com/v1`
- Для production используйте: `https://api.g2a.com/integration-api/v1`

Полный справочник см. в [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md).

---

## ✅ После деплоя

### 1. Миграции базы данных

**Миграции применяются автоматически** во время процесса сборки на Vercel. Команда `vercel-build` включает `prisma migrate deploy`, которая применяет все непримененные миграции к production базе данных.

**Важно**: 
- Убедитесь, что `DATABASE_URL` и `DIRECT_URL` правильно настроены в Vercel Environment Variables
- Миграции применяются только для новых миграций (безопасно для production)
- Если нужно применить миграции вручную (например, при проблемах), используйте:

```bash
cd backend
DATABASE_URL="your-production-database-url" npm run prisma:migrate:deploy
```

### 2. Проверка деплоя

#### Frontend

1. Откройте URL деплоя в браузере
2. Проверьте, что главная страница загружается
3. Откройте DevTools → Console, убедитесь, что нет ошибок
4. Проверьте Network tab - API запросы должны идти на `/api/*`

#### Backend API

Проверьте health endpoint:

```bash
curl https://your-project.vercel.app/api/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2024-12-23T...",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "g2a": "ok"
  }
}
```

### 3. Тестирование endpoints

#### Регистрация пользователя

```bash
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "nickname": "TestUser"
  }'
```

#### Получение списка игр

```bash
curl https://your-project.vercel.app/api/games
```

#### Health check с деталями

```bash
curl https://your-project.vercel.app/api/health
```

### 4. Обновление VITE_API_BASE_URL

Если вы использовали placeholder URL при первом деплое:

1. Скопируйте реальный URL деплоя
2. Перейдите в Vercel Dashboard → Project → Settings → Environment Variables
3. Обновите `VITE_API_BASE_URL` на: `https://your-actual-url.vercel.app/api`
4. Нажмите **"Redeploy"** или подождите автоматического передеплоя

---

## 🐛 Troubleshooting

### Build Fails

**Проблема**: Сборка падает с ошибками

**Решения**:
1. Проверьте логи сборки в Vercel Dashboard
2. Убедитесь, что Node.js версия >= 20
3. Проверьте, что все зависимости установлены:
   ```bash
   npm install && cd backend && npm install
   ```
4. Проверьте локальную сборку:
   ```bash
   npm run build:all
   ```

### API Returns 404

**Проблема**: API endpoints возвращают 404

**Решения**:
1. Проверьте `vercel.json` - должно быть правило rewrite для `/api/*`
2. Убедитесь, что `api/index.ts` существует
3. Проверьте логи serverless function в Vercel Dashboard → Functions → Logs
4. Убедитесь, что Express routes зарегистрированы правильно

### Database Connection Fails

**Проблема**: Ошибки подключения к базе данных

**Решения**:
1. Проверьте `DATABASE_URL` в Environment Variables
2. Убедитесь, что база данных доступна из Vercel (проверьте IP whitelist если используется)
3. Проверьте формат connection string: `postgresql://user:password@host:5432/database`
4. Убедитесь, что `DIRECT_URL` совпадает с `DATABASE_URL`
5. Проверьте логи в Vercel Dashboard → Functions → Logs

### CORS Errors

**Проблема**: CORS ошибки в браузере

**Решения**:
1. Установите `FRONTEND_URL` в Vercel на ваш frontend URL
2. Проверьте CORS middleware в `backend/src/index.ts`
3. Убедитесь, что `origin` в CORS config совпадает с frontend URL
4. Проверьте, что `VITE_API_BASE_URL` установлен правильно

### G2A API Errors

**Проблема**: Ошибки при вызове G2A API

**Решения**:
1. Проверьте `G2A_API_KEY` и `G2A_API_HASH` в Environment Variables
2. Убедитесь, что credentials правильные (проверьте в G2A Seller Panel)
3. Проверьте `G2A_API_URL` - должен быть `https://api.g2a.com/integration-api/v1` для production
4. Для тестирования используйте `G2A_ENV=sandbox`
5. Проверьте логи в Vercel Dashboard для деталей ошибки

### TypeScript Errors in Build

**Проблема**: TypeScript ошибки блокируют сборку

**Решение**: 
- Backend использует `--noEmitOnError false`, поэтому ошибки TypeScript не блокируют сборку
- Если сборка все равно падает, проверьте критические ошибки в логах

### Environment Variables Not Working

**Проблема**: Переменные окружения не применяются

**Решения**:
1. Убедитесь, что переменные добавлены для правильного окружения (Production/Preview/Development)
2. После добавления переменных выполните **Redeploy**
3. Проверьте, что названия переменных точно совпадают (чувствительны к регистру)
4. Используйте `vercel env ls` для проверки через CLI

---

## 📐 Архитектура деплоя

### Монолитный деплой на Vercel

Проект использует **монолитную архитектуру** - frontend и backend деплоятся в одном Vercel проекте:

```
Vercel Deployment
├── Frontend (Static Files)
│   ├── dist/index.html
│   ├── dist/assets/*.js
│   └── dist/assets/*.css
│
└── Backend (Serverless Function)
    └── api/index.ts → Express App
        ├── /api/auth/*
        ├── /api/games/*
        ├── /api/orders/*
        └── ... (все API routes)
```

### Поток запросов

```mermaid
flowchart TD
    A[User Browser] -->|Request /games| B[Vercel CDN]
    B -->|SPA Route| C[dist/index.html]
    C -->|API Call /api/games| D[Vercel Router]
    D -->|Rewrite /api/*| E[api/index.ts Serverless]
    E -->|Import| F[backend/src/index.ts Express App]
    F -->|Handle Request| G[Express Routes]
    G -->|Query| H[PostgreSQL Database]
    G -->|Call| I[G2A API]
    G -->|Response| E
    E -->|JSON Response| A
```

### Serverless Functions

- **Файл**: `api/index.ts`
- **Runtime**: Node.js 20.x (автоматически)
- **Триггер**: Все запросы к `/api/*`
- **Время выполнения**: До 60 секунд (Hobby), до 5 минут (Pro)
- **Cold start**: ~1-2 секунды при первом запросе

### Rewrites Configuration

В `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index"
    },
    {
      "source": "/((?!api|assets|_next).*)",
      "destination": "/index.html"
    }
  ]
}
```

Это означает:
- `/api/*` → serverless function `api/index.ts`
- Все остальные пути → `index.html` (SPA routing)

### Build Process

1. **Frontend Build**: `npm run build` → `dist/`
2. **Backend Build**: 
   - `prisma generate` → Генерация Prisma Client
   - `prisma migrate deploy` → **Автоматическое применение миграций к production БД**
   - `tsc` → Компиляция TypeScript → `backend/dist/`
3. **Serverless Wrapper**: TypeScript компилируется Vercel автоматически

**Важно**: Миграции применяются автоматически во время сборки. Убедитесь, что `DATABASE_URL` настроен правильно.

---

## 📚 Дополнительные ресурсы

- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Полный справочник переменных окружения
- [G2A API Documentation](https://www.g2a.com/integration-api/documentation/) - Официальная документация G2A
- [Vercel Documentation](https://vercel.com/docs) - Документация Vercel
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate) - Документация по миграциям

---

## ✅ Чеклист успешного деплоя

После деплоя проверьте:

- [ ] Frontend загружается: `https://your-project.vercel.app`
- [ ] Health check работает: `https://your-project.vercel.app/api/health`
- [ ] Регистрация работает: `POST /api/auth/register`
- [ ] Логин работает: `POST /api/auth/login`
- [ ] Игры загружаются: `GET /api/games`
- [ ] Нет CORS ошибок в консоли браузера
- [ ] Миграции базы данных применены автоматически (проверьте логи сборки в Vercel)
- [ ] Environment variables установлены правильно
- [ ] G2A интеграция работает (проверьте `/api/health` - должно быть `g2a: ok`)

---

## 🆘 Нужна помощь?

Если возникли проблемы:

1. Проверьте [Troubleshooting](#-troubleshooting) выше
2. Посмотрите логи в Vercel Dashboard → Functions → Logs
3. Проверьте [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) для правильных значений
4. Убедитесь, что все шаги из этого руководства выполнены

---

**Готово к деплою!** 🚀
