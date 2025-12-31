# G2A Games Sync Script

Скрипт для синхронизации всех игр из G2A Export API через метод `GetProducts` с автоматической пагинацией.

## Описание

Этот скрипт использует официальный G2A Export API для получения полного каталога продуктов (игр) с автоматической обработкой пагинации. Все страницы запрашиваются последовательно до тех пор, пока не будут получены все доступные продукты.

## Требования

1. **G2A API Credentials**:
   - `G2A_API_KEY` (или `G2A_CLIENT_ID`) - Client ID
   - `G2A_API_HASH` (или `G2A_CLIENT_SECRET`) - Client Secret
   - `G2A_EMAIL` - Email для генерации Export API ключа (production)
   - `G2A_ENV` - Окружение: `sandbox` или `live`
   - `G2A_API_URL` (или `G2A_API_BASE`) - Базовый URL API

2. **Database**:
   - Настроенный `DATABASE_URL` для Prisma
   - Выполненные миграции Prisma

## Использование

### Базовый запуск (dry-run)

Проверить работу без сохранения в БД:

```bash
cd backend
npx tsx scripts/sync-all-g2a-games.ts --dry-run
```

### Полная синхронизация

Получить все игры и сохранить в БД:

```bash
npx tsx scripts/sync-all-g2a-games.ts
```

### С фильтрами

Получить только игры в наличии (minQty >= 1):

```bash
npx tsx scripts/sync-all-g2a-games.ts --filters
```

### Ограничение количества (для тестирования)

Получить только первые 100 продуктов:

```bash
npx tsx scripts/sync-all-g2a-games.ts --limit=100
```

### Комбинированные опции

```bash
npx tsx scripts/sync-all-g2a-games.ts --filters --limit=50 --dry-run
```

## Опции

- `--dry-run` - Не сохранять в БД, только получить и показать статистику
- `--limit=N` - Ограничить количество продуктов (для тестирования)
- `--filters` - Применить фильтры (minQty=1, только в наличии)
- `--help, -h` - Показать справку

## Как это работает

1. **Инициализация клиента**: Создается `G2AIntegrationClient` с конфигурацией из environment variables
2. **Автоматическая пагинация**: Используется `BatchProductFetcher.fetchAll()` который:
   - Запрашивает первую страницу через `GET /products?page=1`
   - Проверяет общее количество продуктов (`total`)
   - Продолжает запрашивать следующие страницы до получения всех продуктов
   - Автоматически обрабатывает rate limiting (задержка 200ms между запросами)
3. **Фильтрация**: Отбираются только игры (по типу или категории)
4. **Сохранение**: Создаются записи в таблице `Game` с полями:
   - `title` - название игры
   - `description` - описание
   - `price` - цена
   - `currency` - валюта
   - `stock` - количество в наличии
   - `platform` - платформа
   - `imageUrl` - обложка
   - `g2aProductId` - ID продукта в G2A
   - `g2aLastSync` - время последней синхронизации

## Пример вывода

```
🎮 G2A Games Sync Script

📋 Configuration:
   Dry Run: NO (will save to DB)
   Filters: { minQty: 1, includeOutOfStock: false }

🔗 Connecting to G2A Export API...
   Environment: sandbox
   API URL: https://sandboxapi.g2a.com/v1

📥 Fetching all products from G2A Export API...

📄 Page 1 | Fetched: 100/5000 (2.0%)
📄 Page 2 | Fetched: 200/5000 (4.0%)
...
📄 Page 50 | Fetched: 5000/5000 (100.0%)

✅ Fetching completed!
   Total fetched: 5000
   Errors: 0
   Duration: 12.34s

💾 Saving products to database...

✅ Sync completed!
   Total fetched: 5000
   Total saved: 4850
   Total skipped: 150 (duplicates or non-games)
   Total errors: 0
   Total duration: 45.67s
```

## Технические детали

### API Endpoint

Скрипт использует G2A Export API:
- **Endpoint**: `GET /products`
- **Authentication**: Hash-based (для Export API)
- **Pagination**: Параметр `page` в query string

### Пагинация

G2A API возвращает ответ в формате:
```json
{
  "total": 5000,
  "page": 1,
  "docs": [...]
}
```

Скрипт автоматически:
- Определяет общее количество (`total`)
- Запрашивает все страницы последовательно
- Останавливается когда `accumulated >= total` или `docs.length === 0`

### Rate Limiting

- Задержка 200ms между запросами страниц
- Автоматическое управление через `RateLimiter` в клиенте
- При ошибках - задержка 1000ms перед повтором

### Обработка ошибок

- Ошибки на отдельных страницах логируются, но не останавливают процесс
- Дубликаты (по `g2aProductId`) пропускаются
- Не-игры (по типу/категории) пропускаются

## Интеграция с кодом

Скрипт использует новый unified G2A client:

```typescript
import { G2AIntegrationClient } from '../src/lib/g2a/index.js';

const client = await G2AIntegrationClient.create({
  apiKey: process.env.G2A_API_KEY!,
  apiHash: process.env.G2A_API_HASH!,
  email: process.env.G2A_EMAIL,
  env: 'sandbox',
});

// Получить все продукты
const batchFetcher = client.getBatchProductFetcher();
const result = await batchFetcher.fetchAll(
  { minQty: 1 }, // фильтры
  (page, total, current) => { // progress callback
    console.log(`Page ${page}: ${current}/${total}`);
  }
);
```

## См. также

- [G2A Integration Client README](../../src/lib/g2a/README.md)
- [G2A Authentication Documentation](../../src/lib/g2a/docs/AUTHENTICATION.md)
- [G2A Export API Documentation](https://www.g2a.com/integration-api/documentation/export/)
