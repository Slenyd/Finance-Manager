import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const seedPassword = process.env.SEED_PASSWORD || 'Password123';
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  await prisma.user.upsert({
    where: { email: 'admin@cointoss.app' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@cointoss.app',
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@cointoss.app' },
    update: {},
    create: {
      name: 'Test User',
      email: 'user@cointoss.app',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  console.log('Seed data created successfully');
  console.log('Admin: admin@cointoss.app / Password123');
  console.log('User: user@cointoss.app / Password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
