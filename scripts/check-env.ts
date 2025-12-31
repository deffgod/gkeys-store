#!/usr/bin/env tsx
/**
 * Environment Variables Checker
 * 
 * Проверяет наличие и корректность всех обязательных environment variables
 * для frontend и backend приложения.
 */

import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env files
const rootDir = resolve(__dirname, '..');
const backendDir = resolve(rootDir, 'backend');

// Load backend .env first (has priority)
dotenv.config({ path: resolve(backendDir, '.env') });
// Load root .env if exists
dotenv.config({ path: resolve(rootDir, '.env') });
// Load frontend .env.local if exists
dotenv.config({ path: resolve(rootDir, '.env.local') });

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
  category: 'frontend' | 'backend' | 'g2a';
}

const REQUIRED_VARS: EnvVar[] = [
  // Frontend
  {
    name: 'VITE_API_BASE_URL',
    required: true,
    description: 'Базовый URL API для frontend',
    category: 'frontend',
    validator: (value: string) => {
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    },
    errorMessage: 'Должен быть валидным URL (например: https://your-project.vercel.app/api)',
  },
  
  // Backend - Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    category: 'backend',
    validator: (value: string) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
    errorMessage: 'Должен начинаться с postgresql:// или postgres://',
  },
  {
    name: 'DIRECT_URL',
    required: true,
    description: 'Прямое подключение к БД (обычно = DATABASE_URL)',
    category: 'backend',
    validator: (value: string) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
    errorMessage: 'Должен начинаться с postgresql:// или postgres://',
  },
  
  // Backend - JWT
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'Секретный ключ для JWT access токенов',
    category: 'backend',
    validator: (value: string) => value.length >= 32,
    errorMessage: 'Должен быть минимум 32 символа',
  },
  {
    name: 'JWT_REFRESH_SECRET',
    required: true,
    description: 'Секретный ключ для JWT refresh токенов',
    category: 'backend',
    validator: (value: string) => value.length >= 32,
    errorMessage: 'Должен быть минимум 32 символа',
  },
  
  // Backend - General
  {
    name: 'FRONTEND_URL',
    required: true,
    description: 'URL фронтенда для CORS',
    category: 'backend',
    validator: (value: string) => {
      try {
        const url = new URL(value);
        return (url.protocol === 'http:' || url.protocol === 'https:') && !value.endsWith('/');
      } catch {
        return false;
      }
    },
    errorMessage: 'Должен быть валидным URL без завершающего слеша',
  },
  {
    name: 'NODE_ENV',
    required: true,
    description: 'Окружение приложения',
    category: 'backend',
    validator: (value: string) => ['development', 'production', 'test'].includes(value),
    errorMessage: 'Должен быть: development, production или test',
  },
  
  // G2A Integration (опционально, но рекомендуется)
  {
    name: 'G2A_API_URL',
    required: false,
    description: 'Базовый URL G2A Integration API',
    category: 'g2a',
    validator: (value: string) => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:';
      } catch {
        return false;
      }
    },
    errorMessage: 'Должен быть валидным HTTPS URL',
  },
  {
    name: 'G2A_API_KEY',
    required: false,
    description: 'G2A API Key',
    category: 'g2a',
  },
  {
    name: 'G2A_API_HASH',
    required: false,
    description: 'G2A API Hash',
    category: 'g2a',
  },
  {
    name: 'G2A_ENV',
    required: false,
    description: 'Окружение G2A (sandbox или live)',
    category: 'g2a',
    validator: (value: string) => ['sandbox', 'live'].includes(value.trim().toLowerCase()),
    errorMessage: 'Должен быть: sandbox или live',
  },
];

interface CheckResult {
  var: EnvVar;
  exists: boolean;
  value?: string;
  valid: boolean;
  error?: string;
}

function checkEnvironmentVariables(): CheckResult[] {
  const results: CheckResult[] = [];
  
  for (const envVar of REQUIRED_VARS) {
    const value = process.env[envVar.name];
    const exists = !!value;
    
    let valid = true;
    let error: string | undefined;
    
    if (exists && envVar.validator) {
      valid = envVar.validator(value);
      if (!valid) {
        error = envVar.errorMessage || 'Невалидное значение';
      }
    } else if (envVar.required && !exists) {
      valid = false;
      error = 'Переменная не установлена';
    }
    
    results.push({
      var: envVar,
      exists,
      value: exists ? (envVar.name.includes('SECRET') || envVar.name.includes('KEY') || envVar.name.includes('HASH') 
        ? '***' + value.slice(-4) 
        : value) : undefined,
      valid,
      error,
    });
  }
  
  return results;
}

function printResults(results: CheckResult[]): void {
  const categories = ['frontend', 'backend', 'g2a'] as const;
  
  for (const category of categories) {
    const categoryResults = results.filter(r => r.var.category === category);
    if (categoryResults.length === 0) continue;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${category.toUpperCase()} Variables`);
    console.log('='.repeat(60));
    
    for (const result of categoryResults) {
      const status = result.valid 
        ? '✅' 
        : (result.var.required ? '❌' : '⚠️');
      
      console.log(`${status} ${result.var.name}`);
      console.log(`   ${result.var.description}`);
      
      if (result.exists) {
        console.log(`   Значение: ${result.value || 'установлено'}`);
      }
      
      if (!result.valid && result.error) {
        console.log(`   Ошибка: ${result.error}`);
      }
      
      if (!result.exists && result.var.required) {
        console.log(`   ⚠️  ОБЯЗАТЕЛЬНО для работы приложения!`);
      }
      
      console.log('');
    }
  }
}

function printSummary(results: CheckResult[]): void {
  const required = results.filter(r => r.var.required);
  const missing = required.filter(r => !r.exists || !r.valid);
  const optional = results.filter(r => !r.var.required);
  const optionalMissing = optional.filter(r => !r.exists || !r.valid);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('Сводка');
  console.log('='.repeat(60));
  console.log(`Обязательные переменные: ${required.length - missing.length}/${required.length} установлены`);
  console.log(`Опциональные переменные: ${optional.length - optionalMissing.length}/${optional.length} установлены`);
  
  if (missing.length > 0) {
    console.log(`\n❌ Отсутствуют или невалидны обязательные переменные:`);
    missing.forEach(r => {
      console.log(`   - ${r.var.name}: ${r.error || 'не установлена'}`);
    });
    console.log('\n⚠️  Приложение не будет работать без этих переменных!');
    process.exit(1);
  } else {
    console.log('\n✅ Все обязательные переменные установлены и валидны!');
  }
  
  if (optionalMissing.length > 0) {
    console.log(`\n⚠️  Отсутствуют опциональные переменные:`);
    optionalMissing.forEach(r => {
      console.log(`   - ${r.var.name}: ${r.error || 'не установлена'}`);
    });
    console.log('\n💡 Эти переменные не обязательны, но рекомендуются для полной функциональности.');
  }
}

function main(): void {
  console.log('🔍 Проверка Environment Variables...\n');
  
  // Для frontend переменных нужно проверить через import.meta.env
  // Но в Node.js скрипте мы можем проверить только process.env
  // Поэтому для VITE_ переменных нужно запускать через Vite
  
  const results = checkEnvironmentVariables();
  printResults(results);
  printSummary(results);
}

// Run if executed directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkEnvironmentVariables, REQUIRED_VARS };
