import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const seedPassword = process.env.SEED_PASSWORD || 'Password123';
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  await prisma.user.upsert({
    where: { email: 'admin@financemanager.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@financemanager.com',
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@financemanager.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'user@financemanager.com',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  console.log('Seed data created successfully');
  console.log('Admin: admin@financemanager.com / Password123');
  console.log('User: user@financemanager.com / Password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
