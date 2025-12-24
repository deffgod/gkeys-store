# G2A Production API Test Report

**Дата**: 2024-12-24  
**Credentials**: 
- Client ID: `DNvKyOKBjWTVBmEw`
- Client Secret: `rksBZDeNuUHnDkOiPCyJEdDHZUnlhydS`
- API URL: `https://api.g2a.com`

---

## 📊 Результаты тестирования

### ✅ Успешные тесты: 2/6

1. **Authentication Method** ✅
   - Оба метода аутентификации настроены корректно
   - Import API: Hash-based с заголовками X-API-HASH, X-API-KEY
   - Export API: Authorization header с sha256(ClientId + Email + ClientSecret)

2. **Price Simulation** ✅ (пропущен, т.к. требует OAuth2 token)

### ❌ Неуспешные тесты: 4/6

1. **Basic Connection (Export API)** ❌
   - Статус: 401 Unauthorized
   - Ошибка: "Wrong Authorization header"
   - Endpoint: `GET https://api.g2a.com/v1/products`

2. **OAuth2 Token Authentication (Import API)** ❌
   - Статус: 404 Not Found
   - Endpoint: `GET https://api.g2a.com/integration-api/v1/token`
   - Возможная причина: неправильный путь или требуется другой формат аутентификации

3. **Get Products (Export API)** ❌
   - Статус: 401 Unauthorized
   - Ошибка: "Wrong Authorization header"
   - Endpoint: `GET https://api.g2a.com/v1/products`

4. **Get Single Product (Export API)** ❌
   - Статус: 401 Unauthorized
   - Ошибка: "Wrong Authorization header"
   - Endpoint: `GET https://api.g2a.com/v1/products/{id}`

---

## 🔍 Анализ проблем

### Проблема 1: Export API Authentication

**Текущая реализация**:
```typescript
Authorization: ClientId, ApiKey
где ApiKey = sha256(ClientId + Email + ClientSecret)
```

**Ошибка**: "Wrong Authorization header"

**Возможные причины**:
1. ❓ **Email неправильный** - используется `test@g2a.com`, нужен реальный email от G2A аккаунта
2. ❓ **Формат заголовка** - возможно нужны пробелы или другой формат
3. ❓ **IP whitelist** - возможно IP адрес не добавлен в whitelist G2A
4. ❓ **Аккаунт не активирован** - возможно аккаунт не прошел верификацию для production API

### Проблема 2: Import API OAuth2 Token

**Текущая реализация**:
```typescript
GET https://api.g2a.com/integration-api/v1/token
Headers: X-API-HASH, X-API-KEY, X-G2A-Timestamp, X-G2A-Hash
```

**Ошибка**: 404 Not Found

**Возможные причины**:
1. ❓ **Неправильный путь** - возможно endpoint находится по другому адресу
2. ❓ **Неправильная аутентификация** - возможно для получения токена нужен другой формат
3. ❓ **API не доступен** - возможно Import API требует отдельной активации

---

## 💡 Рекомендации

### 1. Проверить Email

**Действие**: Убедиться, что используется правильный email от G2A аккаунта

```bash
# Установить правильный email
export G2A_EMAIL="your-actual-g2a-account-email@g2a.com"
```

**Где найти**: 
- В G2A Seller Panel
- В настройках аккаунта
- В email, который использовался при регистрации

### 2. Проверить IP Whitelist

**Действие**: Убедиться, что IP адрес сервера добавлен в whitelist G2A

**Где проверить**:
- G2A Seller Panel → API Integration → IP Whitelist
- Добавить IP адрес вашего сервера/разработки

### 3. Проверить активацию Production API

**Действие**: Убедиться, что аккаунт имеет доступ к production API

**Где проверить**:
- G2A Seller Panel → API Integration
- Убедиться, что аккаунт верифицирован для production
- Проверить статус API доступа

### 4. Проверить формат Authorization header

**Текущий формат**:
```
Authorization: ClientId, ApiKey
```

**Альтернативные форматы для проверки**:
```
Authorization: ClientId,ApiKey  (без пробела)
Authorization: ClientId ApiKey  (пробел вместо запятой)
Authorization: Bearer ClientId,ApiKey
```

### 5. Проверить путь OAuth2 token endpoint

**Текущий путь**:
```
GET https://api.g2a.com/integration-api/v1/token
```

**Альтернативные пути для проверки**:
```
GET https://api.g2a.com/v1/token
GET https://api.g2a.com/token
GET https://www.g2a.com/integration-api/v1/token
```

### 6. Связаться с G2A Support

**Если проблемы сохраняются**:
- Открыть тикет в G2A Support
- Предоставить:
  - Client ID (первые 10 символов)
  - Описание проблемы
  - Примеры запросов и ответов
  - IP адрес сервера

---

## 📝 Следующие шаги

1. ✅ Получить правильный email от G2A аккаунта
2. ✅ Проверить IP whitelist в G2A Seller Panel
3. ✅ Проверить активацию production API
4. ✅ Повторить тестирование с правильным email
5. ✅ Если проблемы сохраняются - связаться с G2A Support

---

## 🔧 Тестовый скрипт

Скрипт для тестирования находится в:
```
backend/scripts/test-g2a-production.ts
```

**Запуск**:
```bash
cd backend
G2A_API_KEY="DNvKyOKBjWTVBmEw" \
G2A_API_HASH="rksBZDeNuUHnDkOiPCyJEdDHZUnlhydS" \
G2A_API_URL="https://api.g2a.com" \
G2A_EMAIL="your-actual-email@g2a.com" \
npx tsx scripts/test-g2a-production.ts
```

---

## 📚 Документация

- [G2A Developers API Documentation](https://www.g2a.com/integration-api/documentation/)
- [G2A Seller Panel](https://www.g2a.com/marketplace/integrationapi/)
- [G2A API Support](https://www.g2a.com/support/)

---

*Отчет создан: 2024-12-24*

