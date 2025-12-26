# API Changelog

История изменений API GKEYS Store.

## Version 1.0.0 (2024-12-23)

### Добавлено

- **Аутентификация**
  - `POST /api/auth/register` - Регистрация нового пользователя (атомарная операция, автоматическая миграция корзины/избранного)
  - `POST /api/auth/login` - Вход в систему (автоматическая миграция корзины/избранного при наличии сессии)
  - `POST /api/auth/refresh` - Обновление токена

- **Игры**
  - `GET /api/games` - Список игр с фильтрацией и пагинацией
  - `GET /api/games/{id}` - Информация об игре по ID
  - `GET /api/games/slug/{slug}` - Информация об игре по slug
  - `GET /api/games/search` - Поиск игр
  - `GET /api/games/autocomplete` - Автодополнение для поиска
  - `GET /api/games/best-sellers` - Лучшие продажи
  - `GET /api/games/new-in-catalog` - Новинки в каталоге
  - `GET /api/games/preorders` - Предзаказы
  - `GET /api/games/new` - Новые игры
  - `GET /api/games/by-genre/{genre}` - Игры по жанру
  - `GET /api/games/random` - Случайные игры
  - `GET /api/games/{id}/similar` - Похожие игры
  - `GET /api/games/genres` - Список жанров
  - `GET /api/games/platforms` - Список платформ
  - `GET /api/games/filter-options` - Опции фильтрации
  - `GET /api/games/collections` - Коллекции игр

- **Заказы**
  - `POST /api/orders` - Создание заказа (требует авторизации)
  - `GET /api/orders` - Список заказов пользователя (требует авторизации)
  - `GET /api/orders/{id}` - Информация о заказе (требует авторизации)

- **Корзина** (с Redis кешированием, TTL: 15 минут)
  - `GET /api/cart` - Получить корзину (поддерживает guest и authenticated, с кешированием)
  - `POST /api/cart` - Добавить товар в корзину (с инвалидацией кеша)
  - `PUT /api/cart/{gameId}` - Обновить количество товара (с инвалидацией кеша)
  - `DELETE /api/cart/{gameId}` - Удалить товар из корзины (с инвалидацией кеша)
  - `DELETE /api/cart` - Очистить корзину (с инвалидацией кеша)
  - `POST /api/cart/migrate` - Миграция корзины после логина (требует авторизации, атомарная операция, с инвалидацией кеша)

- **Избранное** (с Redis кешированием, TTL: 30 минут)
  - `GET /api/wishlist` - Получить избранное (поддерживает guest и authenticated, с кешированием)
  - `POST /api/wishlist` - Добавить игру в избранное (с инвалидацией кеша, предотвращение дубликатов)
  - `DELETE /api/wishlist/{gameId}` - Удалить игру из избранного (с инвалидацией кеша)
  - `GET /api/wishlist/{gameId}/check` - Проверить наличие игры в избранном
  - `POST /api/wishlist/migrate` - Миграция избранного после логина (требует авторизации, атомарная операция, с инвалидацией кеша)

- **Профиль пользователя**
  - `GET /api/user/profile` - Получить профиль (требует авторизации)
  - `PUT /api/user/profile` - Обновить профиль (требует авторизации)
  - `PUT /api/user/password` - Изменить пароль (требует авторизации)
  - `GET /api/user/stats` - Статистика пользователя (требует авторизации)
  - `GET /api/user/balance` - Баланс пользователя (требует авторизации)
  - `GET /api/user/transactions` - Транзакции пользователя (требует авторизации)
  - `GET /api/user/wishlist` - Избранное пользователя (требует авторизации)

- **Административная панель** (требует роль ADMIN, с логированием и аудитом)
  - `GET /api/admin/dashboard` - Статистика дашборда
  - `GET /api/admin/users` - Поиск пользователей
  - `GET /api/admin/users/{id}` - Детали пользователя
  - `PUT /api/admin/users/{id}` - Обновить пользователя (nickname, firstName, lastName, role, balance)
  - `DELETE /api/admin/users/{id}` - Удалить пользователя (с проверкой зависимостей)
  - `GET /api/admin/games` - Список игр
  - `GET /api/admin/games/{id}` - Детали игры (полная информация с relationships)
  - `POST /api/admin/games` - Создать игру (все поля, включая relationships, с инвалидацией кеша)
  - `PUT /api/admin/games/{id}` - Обновить игру (все поля, включая relationships, с инвалидацией кеша)
  - `DELETE /api/admin/games/{id}` - Удалить игру (с инвалидацией кеша)
  - `GET /api/admin/orders` - Список заказов
  - `GET /api/admin/orders/{id}` - Детали заказа (полная информация с items, keys, transactions)
  - `PUT /api/admin/orders/{id}` - Обновить заказ (status, paymentStatus, paymentMethod, promoCode)
  - `POST /api/admin/orders/{id}/cancel` - Отменить заказ (с возвратом средств и восстановлением инвентаря)
  - `PUT /api/admin/orders/{id}/status` - Обновить статус заказа
  - `GET /api/admin/transactions` - Список транзакций
  - `GET /api/admin/g2a/status` - Статус G2A интеграции
  - `GET /api/admin/g2a/sync-progress` - Прогресс синхронизации (real-time)
  - `POST /api/admin/g2a/sync` - Синхронизация с G2A (с инвалидацией кеша после успешной синхронизации)
  - `GET /api/admin/g2a/offers` - G2A предложения
  - `GET /api/admin/g2a/reservations` - G2A резервации
  - `GET /api/admin/cache` - Статистика кеша
  - `GET /api/admin/blog` - Список блог-постов
  - `GET /api/admin/blog/{id}` - Детали блог-поста (полная информация с content, imageUrl, tags)
  - `POST /api/admin/blog` - Создать блог-пост (автоматический slug, readTime, с инвалидацией кеша)
  - `PUT /api/admin/blog/{id}` - Обновить блог-пост (автоматический readTime, управление publishedAt, с инвалидацией кеша)
  - `DELETE /api/admin/blog/{id}` - Удалить блог-пост (с инвалидацией кеша)
  - `GET /api/admin/categories` - Список категорий
  - `POST /api/admin/categories` - Создать категорию (с инвалидацией кеша)
  - `PUT /api/admin/categories/{id}` - Обновить категорию (с инвалидацией кеша)
  - `DELETE /api/admin/categories/{id}` - Удалить категорию (с проверкой зависимостей, инвалидацией кеша)
  - `GET /api/admin/genres` - Список жанров
  - `POST /api/admin/genres` - Создать жанр (с инвалидацией кеша)
  - `PUT /api/admin/genres/{id}` - Обновить жанр (с инвалидацией кеша)
  - `DELETE /api/admin/genres/{id}` - Удалить жанр (с проверкой зависимостей, инвалидацией кеша)
  - `GET /api/admin/platforms` - Список платформ
  - `POST /api/admin/platforms` - Создать платформу (с инвалидацией кеша)
  - `PUT /api/admin/platforms/{id}` - Обновить платформу (с инвалидацией кеша)
  - `DELETE /api/admin/platforms/{id}` - Удалить платформу (с проверкой зависимостей, инвалидацией кеша)
  - `GET /api/admin/tags` - Список тегов
  - `POST /api/admin/tags` - Создать тег (с инвалидацией кеша)
  - `PUT /api/admin/tags/{id}` - Обновить тег (с инвалидацией кеша)
  - `DELETE /api/admin/tags/{id}` - Удалить тег (с проверкой зависимостей, инвалидацией кеша)

- **G2A Webhooks**
  - `POST /api/g2a/webhook` - Webhook для получения уведомлений от G2A

- **Health Check**
  - `GET /api/health` - Проверка работоспособности API

### Особенности

- JWT аутентификация с refresh токенами
- Поддержка guest пользователей для корзины и избранного (session-based)
- Автоматическая миграция корзины и избранного при логине (атомарные операции)
- Пагинация для всех списков
- Расширенная фильтрация игр
- Интеграция с G2A API
- Redis кеширование для cart (TTL: 15 минут) и wishlist (TTL: 30 минут)
- Автоматическая инвалидация кеша при изменениях данных
- Graceful degradation при недоступности Redis (система продолжает работать)
- Комплексное логирование ошибок и аудит для админ операций
- Автоматический расчет readTime для блог-постов
- Автоматическая генерация slug для блог-постов
- Валидация всех входных данных

### Безопасность

- JWT токены с настраиваемым временем жизни
- Хеширование паролей (bcrypt)
- Валидация всех входных данных
- Защита от SQL инъекций (Prisma ORM)
- CORS настройки
- Rate limiting (планируется)

### Ограничения

- Максимальный размер страницы: 100 элементов
- Минимальная длина пароля: 8 символов
- Максимальная длина nickname: 50 символов
- Таймаут запросов к G2A API: 8 секунд
- Максимальное количество повторов запросов к G2A: 2

---

## Планируемые изменения

### Version 1.1.0 (планируется)

- [ ] Версионирование API (`/v1/`, `/v2/`)
- [ ] Rate limiting для всех endpoints
- [ ] WebSocket поддержка для real-time обновлений
- [ ] GraphQL endpoint (опционально)
- [ ] Расширенная аналитика
- [ ] Webhook система для внешних интеграций
- [ ] Batch операции для игр
- [ ] Экспорт данных (CSV, JSON)

### Version 1.2.0 (планируется)

- [ ] Многоязычность API
- [ ] Расширенная система промокодов
- [ ] Программа лояльности
- [ ] Реферальная система
- [ ] Уведомления (email, push)
- [ ] Расширенная статистика

---

## Breaking Changes

На данный момент breaking changes отсутствуют. Все изменения будут документироваться здесь.

### Планируемые Breaking Changes

- **Version 2.0.0** (будущее)
  - Переход на `/v2/` endpoints
  - Изменение формата ответов для некоторых endpoints
  - Удаление deprecated endpoints

---

## Deprecated Endpoints

На данный момент deprecated endpoints отсутствуют.

---

## Миграция между версиями

### С Version 1.0.0 на Version 1.1.0

Миграция не требуется, изменения обратно совместимы.

---

## Полезные ссылки

- [OpenAPI Specification](./openapi.yaml)
- [Error Codes](./errors.md)
- [Основная документация](../../DOCUMENTATION.md)

