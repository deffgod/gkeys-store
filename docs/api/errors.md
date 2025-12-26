# API Error Codes

Документация кодов ошибок API GKEYS Store.

## Формат ошибки

Все ошибки возвращаются в следующем формате:

```json
{
  "success": false,
  "error": {
    "message": "Описание ошибки",
    "code": "ERROR_CODE",
    "details": [
      {
        "field": "fieldName",
        "message": "Детальное сообщение об ошибке"
      }
    ]
  }
}
```

## Категории ошибок

### Authentication Errors (AUTH)

Ошибки аутентификации и авторизации.

| Код | HTTP Status | Описание |
|-----|-------------|----------|
| AUTH001 | 401 | Неверный или отсутствующий токен |
| AUTH002 | 401 | Токен истек |
| AUTH003 | 403 | Недостаточно прав доступа |
| AUTH004 | 401 | Неверные учетные данные |
| AUTH005 | 401 | Пользователь не найден |
| AUTH006 | 401 | Аккаунт не активирован |

### Validation Errors (VAL)

Ошибки валидации входных данных.

| Код | HTTP Status | Описание |
|-----|-------------|----------|
| VAL001 | 400 | Общая ошибка валидации |
| VAL002 | 400 | Неверный формат email |
| VAL003 | 400 | Пароль слишком слабый |
| VAL004 | 400 | Пароль должен содержать минимум 8 символов |
| VAL005 | 400 | Пароль должен содержать заглавную букву, строчную букву и цифру |
| VAL006 | 400 | Nickname должен быть от 2 до 50 символов |
| VAL007 | 400 | Обязательное поле отсутствует |
| VAL008 | 400 | Неверный формат UUID |
| VAL009 | 400 | Неверный формат даты |

### Not Found Errors (NOTFOUND)

Ошибки отсутствия ресурсов.

| Код | HTTP Status | Описание |
|-----|-------------|----------|
| NOTFOUND001 | 404 | Ресурс не найден |
| NOTFOUND002 | 404 | Игра не найдена |
| NOTFOUND003 | 404 | Заказ не найден |
| NOTFOUND004 | 404 | Пользователь не найден |
| NOTFOUND005 | 404 | Товар не найден в корзине |
| NOTFOUND006 | 404 | Игра не найдена в избранном |

### Conflict Errors (CONFLICT)

Ошибки конфликтов (ресурс уже существует).

| Код | HTTP Status | Описание |
|-----|-------------|----------|
| CONFLICT001 | 409 | Ресурс уже существует |
| CONFLICT002 | 409 | Email уже зарегистрирован |
| CONFLICT003 | 409 | Игра уже в корзине |
| CONFLICT004 | 409 | Игра уже в избранном |

### Business Logic Errors (BIZ)

Ошибки бизнес-логики.

| Код | HTTP Status | Описание |
|-----|-------------|----------|
| BIZ001 | 400 | Недостаточно средств на балансе |
| BIZ002 | 400 | Товар отсутствует в наличии |
| BIZ003 | 400 | Неверный промокод |
| BIZ004 | 400 | Промокод уже использован |
| BIZ005 | 400 | Промокод истек |
| BIZ006 | 400 | Минимальная сумма заказа не достигнута |
| BIZ007 | 400 | Заказ уже обработан |
| BIZ008 | 400 | Невозможно отменить заказ |

### Rate Limiting Errors (RATE)

Ошибки ограничения частоты запросов.

| Код | HTTP Status | Описание |
|-----|-------------|----------|
| RATE001 | 429 | Слишком много запросов |
| RATE002 | 429 | Превышен лимит запросов в минуту |
| RATE003 | 429 | Превышен лимит запросов в час |

### Server Errors (SERVER)

Внутренние ошибки сервера.

| Код | HTTP Status | Описание |
|-----|-------------|----------|
| SERVER001 | 500 | Внутренняя ошибка сервера |
| SERVER002 | 500 | Ошибка базы данных |
| SERVER003 | 500 | Ошибка внешнего сервиса |

### Gateway Errors (GATEWAY)

Ошибки шлюза.

| Код | HTTP Status | Описание |
|-----|-------------|----------|
| GATEWAY001 | 502 | Ошибка шлюза |
| GATEWAY002 | 503 | Сервис временно недоступен |
| GATEWAY003 | 504 | Таймаут шлюза |

### G2A Integration Errors (G2A)

Ошибки интеграции с G2A API.

| Код | HTTP Status | Описание |
|-----|-------------|----------|
| G2A001 | 500 | Ошибка подключения к G2A API |
| G2A002 | 401 | Неверные учетные данные G2A |
| G2A003 | 429 | Превышен лимит запросов к G2A API |
| G2A004 | 404 | Продукт не найден в G2A |
| G2A005 | 400 | Ошибка синхронизации с G2A |

## Примеры использования

### Пример 1: Ошибка валидации

**Запрос:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "invalid-email",
  "password": "weak"
}
```

**Ответ:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VAL001",
    "details": [
      {
        "field": "email",
        "message": "Valid email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

### Пример 2: Ошибка аутентификации

**Запрос:**
```http
GET /api/user/profile
Authorization: Bearer invalid-token
```

**Ответ:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid token",
    "code": "AUTH001"
  }
}
```

### Пример 3: Ресурс не найден

**Запрос:**
```http
GET /api/games/00000000-0000-0000-0000-000000000000
```

**Ответ:**
```json
{
  "success": false,
  "error": {
    "message": "Game not found",
    "code": "NOTFOUND002"
  }
}
```

### Пример 4: Конфликт

**Запрос:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "existing@example.com",
  "password": "Password123"
}
```

**Ответ:**
```json
{
  "success": false,
  "error": {
    "message": "Email already registered",
    "code": "CONFLICT002"
  }
}
```

### Пример 5: Бизнес-логика

**Запрос:**
```http
POST /api/orders
Authorization: Bearer valid-token
Content-Type: application/json

{
  "items": [
    {
      "gameId": "123e4567-e89b-12d3-a456-426614174000",
      "quantity": 1
    }
  ]
}
```

**Ответ (недостаточно средств):**
```json
{
  "success": false,
  "error": {
    "message": "Insufficient balance",
    "code": "BIZ001"
  }
}
```

## Обработка ошибок на клиенте

Рекомендуется обрабатывать ошибки по кодам:

```typescript
try {
  const response = await api.post('/auth/register', data);
} catch (error) {
  if (error.response?.data?.error?.code === 'CONFLICT002') {
    // Email уже зарегистрирован
    showError('Этот email уже используется');
  } else if (error.response?.data?.error?.code === 'VAL001') {
    // Ошибка валидации
    const details = error.response.data.error.details;
    details.forEach(detail => {
      showFieldError(detail.field, detail.message);
    });
  } else {
    // Общая ошибка
    showError(error.response?.data?.error?.message || 'Произошла ошибка');
  }
}
```

## Обновления

Список изменений в кодах ошибок см. в [Changelog](./changelog.md).

