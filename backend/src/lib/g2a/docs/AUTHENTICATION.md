# G2A API Authentication Guide

Подробное руководство по аутентификации в G2A Import API и Export API.

---

## 📚 Обзор

G2A использует **два разных метода аутентификации** в зависимости от типа API:

1. **Import API** - OAuth2 Bearer Token (современный метод)
2. **Export API** - Hash-based Authentication (legacy метод)

Наша реализация поддерживает **оба метода** автоматически.

---

## 🔐 Import API Authentication (OAuth2)

### Процесс аутентификации

```
1. Client → G2A: POST /token (с hash-based auth)
2. G2A → Client: { access_token, expires_in, token_type }
3. Client → G2A: API Request (с Bearer token)
```

### Детали реализации

#### 1. Получение токена

**Endpoint:** `GET /token`

**Authentication Headers:**
- **Sandbox:**
  ```
  Authorization: "{apiHash}, {apiKey}"
  ```

- **Production:**
  ```
  Authorization: "{apiHash}, {apiKey}"
  Content-Type: application/json
  ```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

#### 2. Использование токена

Все последующие запросы к Import API:
```
Authorization: Bearer {access_token}
```

### Кеширование токенов

Наша реализация автоматически кеширует токены:

**Redis (приоритет 1):**
- ключ: `g2a:oauth2:token:{env}`
- TTL: `expires_in` секунд
- Автоматическое обновление за 5 минут до истечения

**In-Memory (fallback):**
- Используется, если Redis недоступен
- Автоматическое обновление за 5 минут до истечения

**Пример кода:**
```typescript
import { G2AIntegrationClient } from './lib/g2a/index.js';

const client = await G2AIntegrationClient.create({
  apiKey: process.env.G2A_API_KEY!,
  apiHash: process.env.G2A_API_HASH!,
  env: 'sandbox',
});

// Токен автоматически получается и кешируется
const products = await client.products.list();
```

---

## 🔑 Export API Authentication (Hash-based)

### Sandbox Environment

**Простой формат:**
```
Authorization: "{apiHash}, {apiKey}"
```

**Пример:**
```http
GET /products HTTP/1.1
Host: sandboxapi.g2a.com
Authorization: qdaiciDiyMaTjxMt, ibHtsEljmCxjOFAn
```

### Production Environment

**Специальный формат с generated API Key:**
```
Authorization: "{clientId}, {generatedApiKey}"
```

где `generatedApiKey = SHA256(clientId + email + clientSecret)`

**Пример генерации:**
```typescript
import crypto from 'node:crypto';

const clientId = 'ibHtsEljmCxjOFAn';
const email = 'Welcome@nalytoo.com';
const clientSecret = 'qdaiciDiyMaTjxMt';

const generatedApiKey = crypto
  .createHash('sha256')
  .update(clientId + email + clientSecret)
  .digest('hex');

// Authorization: ibHtsEljmCxjOFAn, {generatedApiKey}
```

**Пример запроса:**
```http
GET /products HTTP/1.1
Host: api.g2a.com
Authorization: ibHtsEljmCxjOFAn, a7f5d2e8b9c3a1f4d6e7b8c9a2f3d4e5b6c7a8f9d0e1b2c3a4f5d6e7b8c9a0f1
```

---

## 🔧 Реализация в проекте

### Архитектура

```
G2AIntegrationClient
  └── AuthManager (выбирает метод аутентификации)
      ├── TokenManager (OAuth2 для Import API)
      │   ├── Redis Cache
      │   └── In-Memory Cache (fallback)
      └── HashAuthenticator (Hash-based для Export API)
          ├── Sandbox Auth (простой формат)
          └── Production Auth (с generated API Key)
```

### Автоматический выбор метода

```typescript
// Автоматически использует правильный метод
const client = await G2AIntegrationClient.create(config);

// Import API → OAuth2 Bearer Token
await client.products.list();  // Export API → Hash-based
await client.orders.create({...});  // Export API → Hash-based
await client.bestsellers.list();  // Import API → OAuth2 Bearer Token
```

---

## 📝 Конфигурация

### Обязательные переменные

```bash
# Основные учетные данные
G2A_API_KEY=ibHtsEljmCxjOFAn        # Client ID
G2A_API_HASH=qdaiciDiyMaTjxMt       # Client Secret

# Окружение
G2A_ENV=sandbox                      # или 'live'
G2A_API_URL=https://sandboxapi.g2a.com/v1

# Email (для Production Export API)
G2A_EMAIL=Welcome@nalytoo.com
```

### Опциональные (Redis для кеширования)

```bash
REDIS_URL=redis://localhost:6379
# или
REDIS_GKEYS_REDIS_URL=redis://default:password@host:6379
```

---

## 🔍 Проверка аутентификации

### Тестирование Import API (OAuth2)

```typescript
const client = await G2AIntegrationClient.create(config);

try {
  // Это автоматически проверит аутентификацию
  const bestsellers = await client.bestsellers.list();
  console.log('✅ Import API authentication successful');
} catch (error) {
  console.error('❌ Import API authentication failed:', error);
}
```

### Тестирование Export API (Hash-based)

```typescript
const client = await G2AIntegrationClient.create(config);

try {
  // Это автоматически использует hash-based auth
  const products = await client.products.list();
  console.log('✅ Export API authentication successful');
} catch (error) {
  console.error('❌ Export API authentication failed:', error);
}
```

---

## ⚠️ Важные замечания

### 1. Токены Import API

- **Срок действия:** 3600 секунд (1 час)
- **Автоматическое обновление:** За 5 минут до истечения
- **Кеширование:** В Redis (если доступен) + in-memory fallback

### 2. Export API Production

- **Требуется email:** Для генерации API Key
- **Формула:** `SHA256(ClientId + Email + ClientSecret)`
- **Регистрозависимость:** Email должен совпадать с зарегистрированным в G2A

### 3. Sandbox vs Production

| Параметр | Sandbox | Production |
|----------|---------|------------|
| **Base URL** | `https://sandboxapi.g2a.com/v1` | `https://api.g2a.com/integration-api/v1` |
| **Import API Auth** | OAuth2 (простой) | OAuth2 (стандартный) |
| **Export API Auth** | `Authorization: hash, key` | `Authorization: clientId, generatedApiKey` |
| **Email требуется** | ❌ Нет | ✅ Да (для Export API) |

---

## 🐛 Troubleshooting

### Ошибка: 401 Unauthorized (Import API)

**Причины:**
1. Неправильный API Key или Hash
2. Токен истек и не обновился
3. Redis недоступен и in-memory cache очищен

**Решения:**
```typescript
// 1. Проверьте credentials
const client = await G2AIntegrationClient.create(config);
await client.testAuthentication('import');

// 2. Принудительно обновите токен
await client.authManager.refreshOAuth2Token();

// 3. Проверьте Redis
console.log('Redis URL:', process.env.REDIS_URL);
```

### Ошибка: 401 Unauthorized (Export API)

**Причины:**
1. Неправильный generated API Key
2. Email не совпадает с зарегистрированным
3. Используется sandbox auth в production или наоборот

**Решения:**
```typescript
// 1. Проверьте email
console.log('G2A_EMAIL:', process.env.G2A_EMAIL);

// 2. Проверьте generated API Key
import { HashAuthenticator } from './lib/g2a/auth/HashAuthenticator.js';
const apiKey = HashAuthenticator.generateExportApiKey(
  process.env.G2A_API_KEY!,
  process.env.G2A_EMAIL!,
  process.env.G2A_API_HASH!
);
console.log('Generated API Key:', apiKey);

// 3. Проверьте окружение
console.log('Environment:', client.config.env);
console.log('Base URL:', client.config.baseUrl);
```

### Ошибка: Token expired

**Автоматическое решение:**
```typescript
// Токен автоматически обновляется за 5 минут до истечения
// Но если нужно принудительно:
await client.authManager.refreshOAuth2Token();
```

---

## 📊 Логирование

### Debug режим

```typescript
const client = await G2AIntegrationClient.create({
  ...config,
  logging: {
    enabled: true,
    level: 'debug',
    maskSecrets: true,  // Маскирует токены и ключи
  },
});
```

### Примеры логов

**OAuth2 токен (Import API):**
```
[INFO] Fetching new OAuth2 token from G2A API
[DEBUG] Token retrieved from Redis cache { expiresIn: 3200 }
[INFO] OAuth2 token obtained successfully { expiresIn: 3600, tokenType: 'Bearer' }
```

**Hash-based auth (Export API):**
```
[DEBUG] Generated Export API auth headers (Authorization) { clientId: 'ibHtsElj...', exportApiKeyLength: 64 }
[DEBUG] Generated sandbox auth headers
```

---

## 🔐 Безопасность

### Рекомендации

1. **Никогда не логируйте токены полностью**
   ```typescript
   // ❌ НЕ ДЕЛАЙТЕ ТАК:
   console.log('Token:', token);
   
   // ✅ ДЕЛАЙТЕ ТАК:
   console.log('Token:', token.substring(0, 8) + '...');
   ```

2. **Используйте разные ключи для sandbox и production**
   ```bash
   # Development
   G2A_API_KEY=sandbox-key
   G2A_ENV=sandbox
   
   # Production
   G2A_API_KEY=production-key
   G2A_ENV=live
   ```

3. **Храните credentials в environment variables**
   ```bash
   # ✅ Правильно
   G2A_API_KEY=...
   
   # ❌ Неправильно
   const apiKey = 'ibHtsEljmCxjOFAn';  // Hardcoded
   ```

4. **Используйте Redis для production**
   ```bash
   # Обязательно для production
   REDIS_URL=redis://...
   ```

---

## 📚 Дополнительные ресурсы

- **[Official G2A Documentation](https://www.g2a.com/integration-api/documentation/)** - Официальная документация
- **[G2AIntegrationClient README](../README.md)** - Документация клиента
- **[Client Usage Guide](../../../../docs/g2a/client-usage.md)** - Руководство по использованию
- **[Migration Guide](../../../../G2A_MIGRATION_GUIDE.md)** - Миграция переменных окружения

---

**Последнее обновление:** 30 декабря 2024  
**Версия:** 1.1.0  
**Автор:** G2A Integration Team
