// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.device.deleteMany();
  await prisma.species.deleteMany();
  await prisma.appearance_record.deleteMany();

  await prisma.device.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      device_id: i + 1,
      device_name: `Device ${i + 1}`,
    })),
  });

  await prisma.species.createMany({
    data: Array.from({ length: 3 }, (_, i) => ({
      species_id: i + 1,
      species_name: `Species ${i + 1}`,
    })),
  });
}
main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });