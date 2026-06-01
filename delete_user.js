const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({
    where: { 
      email: { 
        in: ['ujjwalverma010305@gmail.com', 'nothingu142@gmail.com'] 
      } 
    }
  });
  console.log('User deleted successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
