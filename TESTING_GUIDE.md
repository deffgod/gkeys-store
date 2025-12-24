# Руководство по тестированию

## Обзор

Это руководство описывает процесс тестирования интеграции G2A, Prisma DB, Redis и админ-панели.

## Предварительные требования

1. База данных PostgreSQL должна быть запущена и доступна
2. Redis должен быть запущен и доступен (опционально, но рекомендуется)
3. Все environment variables должны быть настроены (см. `ENVIRONMENT_VARIABLES.md`)

## Автоматические тесты

### Запуск интеграционных тестов

```bash
cd backend
npx tsx src/test-integration.ts
```

Тесты проверяют:
- ✅ Подключение к Redis
- ✅ Подключение к базе данных
- ✅ Инвалидацию кеша
- ✅ Функции миграции корзины/избранного
- ✅ CRUD операции админ-панели
- ✅ G2A сервис функции
- ✅ Проверку типов TypeScript

## Ручное тестирование

### 1. Тестирование регистрации и авторизации

#### Регистрация нового пользователя

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "nickname": "TestUser"
  }'
```

**Ожидаемый результат:**
- Статус: 201 Created
- Тело ответа содержит `user`, `token`, `refreshToken`

#### Авторизация пользователя

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

**Ожидаемый результат:**
- Статус: 200 OK
- Тело ответа содержит `user`, `token`, `refreshToken`

### 2. Тестирование корзины

#### Добавление товара в корзину (guest)

```bash
# Сначала получите sessionId из cookie после первого запроса
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=YOUR_SESSION_ID" \
  -d '{
    "gameId": "GAME_ID",
    "quantity": 1
  }'
```

#### Миграция корзины после логина

```bash
curl -X POST http://localhost:3000/api/cart/migrate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Cookie: sessionId=YOUR_SESSION_ID"
```

**Ожидаемый результат:**
- Статус: 200 OK
- Сообщение: "Cart migrated successfully"
- Товары из session cart должны появиться в user cart

### 3. Тестирование избранного

#### Добавление в избранное (guest)

```bash
curl -X POST http://localhost:3000/api/wishlist \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=YOUR_SESSION_ID" \
  -d '{
    "gameId": "GAME_ID"
  }'
```

#### Миграция избранного после логина

```bash
curl -X POST http://localhost:3000/api/wishlist/migrate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Cookie: sessionId=YOUR_SESSION_ID"
```

### 4. Тестирование админ-панели

#### Создание игры с G2A полями

```bash
curl -X POST http://localhost:3000/api/admin/games \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Game",
    "slug": "test-game",
    "description": "Test description",
    "price": 10.99,
    "imageUrl": "https://example.com/image.jpg",
    "platform": "Steam",
    "genre": "Action",
    "tags": ["test"],
    "g2aProductId": "test-g2a-id",
    "g2aStock": true
  }'
```

**Ожидаемый результат:**
- Статус: 200 OK
- Игра создана с G2A полями
- Кеш Redis инвалидирован

#### Обновление игры с G2A полями

```bash
curl -X PUT http://localhost:3000/api/admin/games/GAME_ID \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "g2aProductId": "updated-g2a-id",
    "g2aStock": false,
    "g2aLastSync": "2024-01-01T00:00:00.000Z"
  }'
```

**Ожидаемый результат:**
- Статус: 200 OK
- G2A поля обновлены
- Кеш Redis инвалидирован

### 5. Тестирование G2A синхронизации

#### Проверка статуса G2A

```bash
curl -X GET http://localhost:3000/api/admin/g2a/status \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Ожидаемый результат:**
- Статус: 200 OK
- Информация о последней синхронизации
- Количество продуктов

#### Запуск синхронизации G2A

```bash
curl -X POST http://localhost:3000/api/admin/g2a/sync \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullSync": true,
    "includeRelationships": true
  }'
```

**Ожидаемый результат:**
- Статус: 200 OK
- Синхронизация запущена
- Прогресс можно отследить через `/api/admin/g2a/sync-progress`

#### Проверка прогресса синхронизации

```bash
curl -X GET http://localhost:3000/api/admin/g2a/sync-progress \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Ожидаемый результат:**
- Статус: 200 OK
- Информация о прогрессе синхронизации
- Данные из Redis (если доступен)

### 6. Тестирование кеша Redis

#### Проверка кеширования OAuth2 токенов

1. Запустите G2A синхронизацию
2. Проверьте Redis:
   ```bash
   redis-cli
   > GET g2a:oauth2:token
   > GET g2a:oauth2:token:expiry
   ```

**Ожидаемый результат:**
- Токен сохранен в Redis
- Expiry время установлено корректно

#### Проверка инвалидации кеша

1. Создайте/обновите игру через админ-панель
2. Проверьте Redis:
   ```bash
   redis-cli
   > KEYS home:*
   > KEYS game:*
   > KEYS catalog:*
   ```

**Ожидаемый результат:**
- Кеш инвалидирован (ключи удалены или обновлены)

## Проверка логов

### Backend логи

Проверьте логи сервера на наличие:
- ✅ Успешных операций
- ⚠️ Предупреждений (например, Redis недоступен)
- ❌ Ошибок

### Типичные сообщения

**Успешная миграция корзины:**
```
[Cart Migration] Migrating cart from session SESSION_ID to user USER_ID
```

**Инвалидация кеша:**
```
[Cache] Invalidated 5 keys matching: home:*
```

**G2A синхронизация:**
```
[G2A] Sync completed: 10 added, 5 updated, 0 removed
[G2A] Cache invalidated successfully
```

## Проверка базы данных

### Проверка миграции корзины

```sql
-- Проверить session cart
SELECT * FROM cart_items WHERE user_id = 'SESSION_ID';

-- Проверить user cart после миграции
SELECT * FROM cart_items WHERE user_id = 'USER_ID';

-- Session cart должен быть пустым, user cart должен содержать товары
```

### Проверка G2A полей

```sql
-- Проверить игры с G2A полями
SELECT id, title, g2a_product_id, g2a_stock, g2a_last_sync 
FROM games 
WHERE g2a_product_id IS NOT NULL;
```

## Тестовые сценарии

### Сценарий 1: Полный цикл пользователя

1. ✅ Регистрация нового пользователя
2. ✅ Добавление товаров в корзину как guest
3. ✅ Добавление товаров в избранное как guest
4. ✅ Авторизация
5. ✅ Проверка миграции корзины и избранного
6. ✅ Проверка, что товары доступны в user cart/wishlist

### Сценарий 2: Админ редактирование

1. ✅ Создание игры через админ-панель
2. ✅ Добавление G2A полей
3. ✅ Обновление G2A полей
4. ✅ Проверка инвалидации кеша
5. ✅ Проверка, что изменения отображаются на фронтенде

### Сценарий 3: G2A синхронизация

1. ✅ Запуск G2A синхронизации
2. ✅ Проверка прогресса синхронизации
3. ✅ Проверка обновления продуктов в базе данных
4. ✅ Проверка инвалидации кеша
5. ✅ Проверка OAuth2 токенов в Redis

## Устранение неполадок

### Redis недоступен

Если Redis недоступен:
- ✅ Приложение должно продолжать работать
- ⚠️ Кеш не будет использоваться
- ⚠️ OAuth2 токены будут запрашиваться каждый раз
- ⚠️ Прогресс синхронизации не будет сохраняться

**Решение:** Проверьте подключение к Redis и переменные окружения.

### Ошибки миграции корзины

Если миграция корзины не работает:
- ✅ Проверьте, что sessionId передается в cookie
- ✅ Проверьте, что пользователь авторизован
- ✅ Проверьте логи на наличие ошибок

**Решение:** Убедитесь, что `sessionMiddleware` применяется глобально.

### G2A синхронизация не работает

Если G2A синхронизация не работает:
- ✅ Проверьте G2A credentials в environment variables
- ✅ Проверьте подключение к G2A API
- ✅ Проверьте логи на наличие ошибок

**Решение:** Проверьте `G2A_API_URL`, `G2A_API_KEY`, `G2A_API_HASH`.

## Метрики успешного тестирования

После успешного тестирования должны быть выполнены:

- ✅ Все интеграционные тесты проходят
- ✅ Регистрация и авторизация работают
- ✅ Корзина и избранное работают для guest и authenticated пользователей
- ✅ Миграция корзины/избранного происходит автоматически при логине
- ✅ Админ-панель позволяет редактировать G2A поля
- ✅ Кеш Redis инвалидируется при изменениях
- ✅ G2A синхронизация работает и отслеживается
- ✅ Ошибки обрабатываются корректно

## Дополнительные ресурсы

- `DEVELOPMENT_PLAN_G2A_PRISMA_REDIS_ADMIN.md` - План разработки
- `ENVIRONMENT_VARIABLES.md` - Документация по переменным окружения
- `README.md` - Общая документация проекта

