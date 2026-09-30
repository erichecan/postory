import { config as loadEnv } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

// Next.js 约定用 .env.local 存本地密钥,Prisma CLI 不会自动加载它,这里显式加载
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
