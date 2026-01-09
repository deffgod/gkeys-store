import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'
import path from 'path'
import { fileURLToPath } from 'url'
console.log('DATABASE_URL', env('DATABASE_URL'))

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  schema: path.join(__dirname, 'schema.prisma'),
  migrations: {
    path: path.join(__dirname, 'migrations'),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
        