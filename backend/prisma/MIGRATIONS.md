# Prisma Migrations Guide

## Overview

This directory contains Prisma database migrations. Migrations are applied in chronological order based on their timestamps.

## Current Migrations

1. **20251205120727_** - Initial schema creation
   - Creates all base tables (users, games, orders, etc.)
   - Sets up relationships and indexes

2. **20251223180000_add_external_order_id** - Adds external order ID support
   - Adds `externalOrderId` field to orders table
   - Creates unique index for external order tracking

3. **20260103053940_last_build** - Adds sessions, FAQs, and login history
   - Creates `sessions` table for session management
   - Creates `faqs` table for FAQ management
   - Creates `login_history` table for user login tracking
   - Adds additional indexes to games table

4. **20260108194553_add_g2a_settings** - Adds G2A integration settings
   - Creates `g2a_settings` table for G2A API configuration

5. **20260108201507_add_email_settings** - Adds email configuration
   - Creates `email_settings` table for SMTP configuration

6. **20260109023326_add_g2a_environment** - Adds G2A environment field
   - Adds `environment` field to `g2a_settings` table

## Migration Commands

### Development

```bash
# Create a new migration
npm run prisma:migrate -- --name migration_name

# Apply migrations
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npm run db:sync migrate:reset --force
```

### Production

```bash
# Apply migrations (no prompts)
npm run prisma:migrate:deploy
```

### Using the sync-db script

```bash
# Full synchronization (generate + migrate + seed)
npm run db:sync sync

# Initial setup
npm run db:setup

# Check migration status
npm run db:sync status

# Open Prisma Studio
npm run db:sync studio
```

## Migration Best Practices

1. **Always test migrations locally** before applying to production
2. **Backup database** before running migrations in production
3. **Review migration SQL** before applying
4. **Use descriptive migration names** that explain the change
5. **Never edit existing migrations** - create new ones instead
6. **Keep migrations small and focused** - one logical change per migration

## Troubleshooting

### Migration conflicts

If you have migration conflicts:

```bash
# Check migration status
npm run db:sync status

# Reset and reapply (development only)
npm run db:sync migrate:reset --force
npm run db:sync setup
```

### Schema drift

If your database schema doesn't match Prisma schema:

```bash
# Generate migration from current schema
npm run prisma:migrate -- --create-only migration_name

# Review and edit the generated migration
# Then apply it
npm run prisma:migrate
```

## Notes

- Migrations are version-controlled and should not be deleted
- The `migration_lock.toml` file ensures all team members use the same database provider
- Always run `prisma generate` after migrations to update the Prisma Client
