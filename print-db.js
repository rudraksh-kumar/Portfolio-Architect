import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const portfolios = await prisma.portfolio.findMany();
  for (const p of portfolios) {
    console.log(`Slug: ${p.slug}`);
    console.log(JSON.stringify(JSON.parse(p.profileData), null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
