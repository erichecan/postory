import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminPasswordHash = await bcrypt.hash('admin12345', 10)
  await prisma.adminUser.upsert({
    where: { email: 'owner@social-agency.local' },
    update: {},
    create: {
      email: 'owner@social-agency.local',
      passwordHash: adminPasswordHash,
      role: 'OWNER',
    },
  })

  const clientPasswordHash = await bcrypt.hash('client12345', 10)
  await prisma.client.upsert({
    where: { contactEmail: 'demo@sunrisebakery.local' },
    update: {},
    create: {
      businessName: 'Sunrise Bakery(测试商家)',
      contactEmail: 'demo@sunrisebakery.local',
      passwordHash: clientPasswordHash,
      toneKeywords: ['温暖', '手工'],
      status: 'ACTIVE',
    },
  })

  console.log('Seed 完成:')
  console.log('  运营方账号: owner@social-agency.local / admin12345')
  console.log('  商家测试账号: demo@sunrisebakery.local / client12345')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
