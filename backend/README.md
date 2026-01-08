# GKEYS Store Backend API

Backend API для GKEYS Store на Node.js + Express + TypeScript + Prisma.

## Установка

```bash
npm install
```

## Настройка

1. Скопируйте `.env.example` в `.env`
2. Заполните все необходимые переменные окружения
3. Настройте PostgreSQL базу данных

## Запуск

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## Prisma

```bash
# Генерация Prisma Client
npm run prisma:generate

# Миграции
npm run prisma:migrate

# Seed данные
npm run prisma:seed

# Восстановление из бэкапа (для форка проекта)
npm run db:restore

# Prisma Studio (GUI для БД)
npm run prisma:studio
```

### Использование Prisma типов

После генерации Prisma Client, типы доступны для импорта:

```typescript
import { User, Game, Order, Transaction, Article } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// Использование базовых типов
const user: User = await prisma.user.findUnique({ where: { id } });

// Использование типов с отношениями
const userWithOrders: Prisma.UserGetPayload<{
  include: { orders: true }
}> = await prisma.user.findUnique({
  where: { id },
  include: { orders: true }
});
```

## Структура проекта

```
backend/
├── src/
│   ├── config/          # Конфигурация (DB, Redis, JWT)
│   ├── controllers/      # Контроллеры
│   ├── services/        # Бизнес-логика
│   ├── middleware/      # Middleware
│   ├── routes/          # API routes
│   ├── types/           # TypeScript типы
│   ├── utils/           # Утилиты
│   ├── validators/      # Валидация
│   └── index.ts         # Entry point
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── package.json
```

