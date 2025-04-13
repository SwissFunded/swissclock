import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('shein123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'shein' },
    update: {},
    create: {
      name: 'Shein',
      email: 'shein',
      password: hashedPassword,
    },
  });

  console.log('Test user created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 