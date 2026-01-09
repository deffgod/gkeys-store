#!/usr/bin/env tsx
/**
 * Database Synchronization Script
 * 
 * Удобный скрипт для синхронизации базы данных с Prisma схемой
 * Выполняет миграции, генерацию Prisma Client и сидирование БД
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendDir = resolve(__dirname, '..');

function runCommand(command: string, description: string): void {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, {
      cwd: backendDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' },
    });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🗄️  Database Synchronization Tool\n');

  switch (command) {
    case 'generate':
      // Generate Prisma Client only
      runCommand('npx prisma generate', 'Generating Prisma Client');
      break;

    case 'migrate':
    case 'migrate:dev':
      // Create and apply migration
      const migrationName = args[1] || 'update';
      runCommand(
        `npx prisma migrate dev --name ${migrationName}`,
        `Creating and applying migration: ${migrationName}`
      );
      break;

    case 'migrate:deploy':
      // Apply migrations (for production)
      runCommand('npx prisma migrate deploy', 'Applying migrations');
      break;

    case 'migrate:reset':
      // Reset database (WARNING: deletes all data)
      console.log('⚠️  WARNING: This will delete all data in the database!');
      if (args.includes('--force') || args.includes('-f')) {
        runCommand('npx prisma migrate reset --force', 'Resetting database');
      } else {
        console.log('   Use --force or -f flag to confirm');
        process.exit(1);
      }
      break;

    case 'seed':
      // Seed database
      runCommand('npx tsx prisma/seed.ts', 'Seeding database');
      break;

    case 'studio':
      // Open Prisma Studio
      console.log('🚀 Opening Prisma Studio...');
      runCommand('npx prisma studio', 'Starting Prisma Studio');
      break;

    case 'status':
      // Check migration status
      runCommand('npx prisma migrate status', 'Checking migration status');
      break;

    case 'full':
    case 'sync':
      // Full synchronization: generate + migrate + seed
      console.log('🔄 Full database synchronization\n');
      runCommand('npx prisma generate', 'Generating Prisma Client');
      runCommand('npx prisma migrate dev', 'Applying migrations');
      
      const shouldSeed = !args.includes('--no-seed');
      if (shouldSeed) {
        const seedAnswer = args.includes('--seed') ? 'yes' : 'no';
        if (seedAnswer === 'yes' || args.includes('--seed')) {
          runCommand('npx tsx prisma/seed.ts', 'Seeding database');
        } else {
          console.log('\n💡 To seed database, run: npm run db:sync --seed');
        }
      }
      break;

    case 'setup':
      // Initial setup: generate + migrate + seed
      console.log('🚀 Initial database setup\n');
      runCommand('npx prisma generate', 'Generating Prisma Client');
      runCommand('npx prisma migrate dev', 'Applying migrations');
      runCommand('npx tsx prisma/seed.ts', 'Seeding database');
      console.log('\n✅ Database setup complete!');
      break;

    case 'help':
    case '--help':
    case '-h':
      console.log(`
Usage: npx tsx scripts/sync-db.ts <command> [options]

Commands:
  generate              Generate Prisma Client only
  migrate [name]        Create and apply a new migration
  migrate:deploy        Apply migrations (for production)
  migrate:reset         Reset database (WARNING: deletes all data, use --force)
  migrate:status        Check migration status
  seed                  Seed database with initial data
  studio                Open Prisma Studio
  sync|full             Full sync: generate + migrate + seed
  setup                 Initial setup: generate + migrate + seed

Options:
  --seed                Include seeding in sync/full command
  --no-seed             Skip seeding in sync/full command
  --force, -f           Force operation (for reset)

Examples:
  npx tsx scripts/sync-db.ts setup
  npx tsx scripts/sync-db.ts sync
  npx tsx scripts/sync-db.ts migrate add_user_fields
  npx tsx scripts/sync-db.ts migrate:deploy
  npx tsx scripts/sync-db.ts seed
  npx tsx scripts/sync-db.ts studio
      `);
      break;

    default:
      console.log('❌ Unknown command:', command);
      console.log('   Run: npx tsx scripts/sync-db.ts help');
      process.exit(1);
  }

  console.log('\n✅ Done!\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
