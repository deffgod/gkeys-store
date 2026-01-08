-- AlterTable
ALTER TABLE "g2a_settings" ADD COLUMN IF NOT EXISTS "environment" TEXT NOT NULL DEFAULT 'sandbox';
