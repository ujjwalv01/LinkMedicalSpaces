const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.delete({
    where: { email: '2k24.cs1q.2414113@gmail.com' }
  });
  console.log('User deleted successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
