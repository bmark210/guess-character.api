import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateChaptersAndVerses() {
  try {
    // Get all records
    const records = await prisma.baseEntity.findMany();

    // Update each record
    for (const record of records) {
      const match = record.mention.match(/Быт\.\s*(\d+):(\d+)/);
      if (match) {
        const chapter = parseInt(match[1], 10);
        const verse = parseInt(match[2], 10);

        await prisma.baseEntity.update({
          where: { id: record.id },
          data: { chapter, verse },
        });

        console.log(
          `Updated ${record.name}: Chapter ${chapter}, Verse ${verse}`,
        );
      }
    }

    console.log('Update completed successfully');
  } catch (error) {
    console.error('Error updating records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateChaptersAndVerses();
