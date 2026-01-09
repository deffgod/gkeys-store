#!/usr/bin/env tsx
/**
 * Quick G2A Sync Script
 * Syncs a limited number of games for testing
 */

import dotenv from 'dotenv';
import { syncG2ACatalog } from '../src/services/g2a.service.js';

dotenv.config();

async function main() {
  try {
    console.log('🚀 Starting G2A sync...\n');
    
    const result = await syncG2ACatalog({
      fullSync: false,
      includeRelationships: true,
      categories: ['games'],
    });
    
    console.log('\n✅ Sync completed!');
    console.log('📊 Results:');
    console.log(`   Added: ${result.added}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Removed: ${result.removed}`);
    console.log(`   Categories: ${result.categoriesCreated}`);
    console.log(`   Genres: ${result.genresCreated}`);
    console.log(`   Platforms: ${result.platformsCreated}`);
    console.log(`   Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.slice(0, 10).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.productId}: ${err.error}`);
      });
      if (result.errors.length > 10) {
        console.log(`   ... and ${result.errors.length - 10} more errors`);
      }
    }
    
    process.exit(0);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Sync failed:', error.message);
      console.error(error);
      process.exit(1);
    }
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

main();
