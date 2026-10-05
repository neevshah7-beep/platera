import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
console.log('restocked', (await db.product.updateMany({ where: { slug: { in: ['station-chain-set', 'fringe-line-necklace'] } }, data: { stock: 1 } })).count)
await db.$disconnect()
