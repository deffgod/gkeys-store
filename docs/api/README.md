# GKEYS Store API Documentation

Полная документация RESTful API для платформы GKEYS Store.

## Структура документации

```
docs/api/
├── openapi.yaml              # Основная OpenAPI спецификация
├── components/               # Переиспользуемые компоненты
│   ├── schemas.yaml         # Модели данных
│   ├── parameters.yaml      # Параметры запросов
│   ├── responses.yaml       # Определения ответов
│   └── requestBodies.yaml   # Тела запросов
├── paths/                    # Определения endpoints (опционально)
│   └── auth/
│       ├── register.yaml
│       └── login.yaml
├── errors.md                # Коды ошибок
├── changelog.md             # История изменений API
└── README.md                # Этот файл
```

## Быстрый старт

### Просмотр документации

#### Вариант 1: Swagger UI (рекомендуется)

1. Установите Swagger UI:
```bash
npm install -g swagger-ui-serve
```

2. Запустите локальный сервер:
```bash
swagger-ui-serve docs/api/openapi.yaml
```

3. Откройте в браузере: `http://localhost:3000`

#### Вариант 2: Online редактор

1. Откройте [Swagger Editor](https://editor.swagger.io/)
2. Скопируйте содержимое `openapi.yaml`
3. Вставьте в редактор

#### Вариант 3: Redoc

1. Установите Redoc CLI:
```bash
npm install -g redoc-cli
```

2. Сгенерируйте HTML:
```bash
redoc-cli bundle docs/api/openapi.yaml -o docs/api/index.html
```

3. Откройте `docs/api/index.html` в браузере

### Использование API

#### Базовый URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-project.vercel.app/api`

#### Аутентификация

Большинство endpoints требуют JWT токен в заголовке:

```http
Authorization: Bearer <your-jwt-token>
```

#### Пример запроса

```bash
# Регистрация
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "nickname": "UserNickname"
  }'

# Получение списка игр
curl http://localhost:3001/api/games?page=1&pageSize=20

# Создание заказа (требует авторизации)
curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "gameId": "123e4567-e89b-12d3-a456-426614174000",
        "quantity": 1
      }
    ]
  }'
```

## Основные разделы

### 1. Аутентификация (`/auth`)

- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `POST /auth/refresh` - Обновление токена

### 2. Игры (`/games`)

- `GET /games` - Список игр с фильтрацией
- `GET /games/{id}` - Информация об игре
- `GET /games/search` - Поиск игр
- `GET /games/autocomplete` - Автодополнение
- И другие...

### 3. Заказы (`/orders`)

- `POST /orders` - Создание заказа (требует авторизации)
- `GET /orders` - Список заказов (требует авторизации)
- `GET /orders/{id}` - Детали заказа (требует авторизации)

### 4. Корзина (`/cart`)

- `GET /cart` - Получить корзину
- `POST /cart` - Добавить товар
- `PUT /cart/{gameId}` - Обновить количество
- `DELETE /cart/{gameId}` - Удалить товар
- `POST /cart/migrate` - Миграция после логина

### 5. Избранное (`/wishlist`)

- `GET /wishlist` - Получить избранное
- `POST /wishlist` - Добавить игру
- `DELETE /wishlist/{gameId}` - Удалить игру
- `GET /wishlist/{gameId}/check` - Проверить наличие

### 6. Профиль (`/user`)

- `GET /user/profile` - Профиль (требует авторизации)
- `PUT /user/profile` - Обновить профиль
- `GET /user/stats` - Статистика
- `GET /user/balance` - Баланс
- `GET /user/transactions` - Транзакции

### 7. Админ-панель (`/admin`)

Все endpoints требуют роль ADMIN.

- `GET /admin/dashboard` - Статистика
- `GET /admin/users` - Поиск пользователей
- `GET /admin/games` - Список игр
- `POST /admin/games` - Создать игру
- И другие...

## Коды ошибок

Полный список кодов ошибок см. в [errors.md](./errors.md).

Основные категории:
- **AUTH** - Ошибки аутентификации
- **VAL** - Ошибки валидации
- **NOTFOUND** - Ресурс не найден
- **CONFLICT** - Конфликт
- **BIZ** - Бизнес-логика
- **RATE** - Rate limiting
- **SERVER** - Ошибки сервера

## Версионирование

Текущая версия API: **1.0.0**

История изменений: [changelog.md](./changelog.md)

## Ограничения

- Максимальный размер страницы: 100 элементов
- Минимальная длина пароля: 8 символов
- Максимальная длина nickname: 50 символов
- Таймаут запросов: 30 секунд (для большинства endpoints)
- Rate limiting: планируется в версии 1.1.0

## Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте [errors.md](./errors.md) для кодов ошибок
2. Проверьте [changelog.md](./changelog.md) для изменений
3. Обратитесь к основной документации: [DOCUMENTATION.md](../../DOCUMENTATION.md)

## Генерация клиентов

### TypeScript

```bash
# Установите openapi-generator
npm install -g @openapitools/openapi-generator-cli

# Сгенерируйте клиент
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g typescript-axios \
  -o src/api-client
```

### JavaScript

```bash
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g javascript \
  -o src/api-client
```

### Python

```bash
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g python \
  -o src/api-client
```

## Интеграция с кодом

### Валидация запросов

Можно использовать OpenAPI спецификацию для валидации запросов:

```typescript
import { validateRequest } from 'openapi-validator-middleware';

app.use('/api', validateRequest({
  openapiSpec: './docs/api/openapi.yaml'
}));
```

### Автогенерация типов

```typescript
// Используйте openapi-typescript для генерации типов
import type { paths } from './api-types';

type RegisterRequest = paths['/auth/register']['post']['requestBody']['content']['application/json'];
type AuthResponse = paths['/auth/register']['post']['responses']['201']['content']['application/json'];
```

## Дополнительные ресурсы

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Redoc](https://github.com/Redocly/redoc)
- [OpenAPI Generator](https://openapi-generator.tech/)

