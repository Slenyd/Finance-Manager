const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findFirst({ where: { email: 'user@financemanager.com' } }).then(u => {
  console.log('passwordHash:', u.passwordHash.substring(0, 30) + '...');
  return p.$disconnect();
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
