#!/usr/bin/env tsx
/**
 * Database Backup Script
 * 
 * Создает полный бэкап базы данных PostgreSQL и сохраняет его в папке prisma
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

async function backupDatabase() {
  console.log('📦 Creating database backup...\n');

  try {
    const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL or DIRECT_URL not found in environment variables');
      process.exit(1);
    }

    // Parse database URL
    const url = new URL(databaseUrl);
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbName = url.pathname.slice(1).split('?')[0]; // Remove leading / and query params
    const dbUser = url.username;
    const dbPassword = url.password;

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(process.cwd(), 'prisma');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
    const backupFileGz = `${backupFile}.gz`;

    // Ensure prisma directory exists
    await fs.mkdir(backupDir, { recursive: true });

    console.log(`📊 Database: ${dbName}`);
    console.log(`📊 Host: ${dbHost}:${dbPort}`);
    console.log(`📊 Backup file: ${backupFile}\n`);

    // Set PGPASSWORD environment variable for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: dbPassword,
    };

    // Create pg_dump command
    // Using custom format for better compression and restore options
    const dumpCommand = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f "${backupFileGz}" --no-owner --no-acl`;

    console.log('🔄 Running pg_dump...');
    const { stdout, stderr } = await execAsync(dumpCommand, { env });

    if (stderr && !stderr.includes('WARNING')) {
      console.warn('⚠️  Warnings:', stderr);
    }

    if (stdout) {
      console.log(stdout);
    }

    // Check if backup file was created
    try {
      const stats = await fs.stat(backupFileGz);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`\n✅ Backup created successfully!`);
      console.log(`   File: ${backupFileGz}`);
      console.log(`   Size: ${fileSizeMB} MB`);
      console.log(`   Timestamp: ${timestamp}`);

      // Also create a plain SQL backup for easier inspection
      console.log('\n🔄 Creating plain SQL backup...');
      const sqlDumpCommand = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-owner --no-acl > "${backupFile}"`;
      await execAsync(sqlDumpCommand, { env });

      const sqlStats = await fs.stat(backupFile);
      const sqlFileSizeMB = (sqlStats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Plain SQL backup created!`);
      console.log(`   File: ${backupFile}`);
      console.log(`   Size: ${sqlFileSizeMB} MB`);

      // Create a latest symlink or copy
      const latestBackup = path.join(backupDir, 'backup-latest.sql.gz');
      try {
        await fs.unlink(latestBackup);
      } catch {
        // File doesn't exist, that's ok
      }
      await fs.copyFile(backupFileGz, latestBackup);
      console.log(`\n✅ Latest backup link created: ${latestBackup}`);

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.error('❌ Backup file was not created. Check pg_dump installation and database connection.');
        throw error;
      }
      throw error;
    }

  } catch (error: any) {
    console.error('❌ Error creating backup:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  backupDatabase()
    .then(() => {
      console.log('\n✅ Backup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Backup failed:', error);
      process.exit(1);
    });
}
