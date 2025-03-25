import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateMentionsToEnglish() {
  try {
    // Get all records
    const records = await prisma.baseEntity.findMany();
    let updatedCount = 0;

    // Update each record
    for (const record of records) {
      // First try to extract chapter and verse if they exist in the mention
      const match = record.mention.match(/(?:Быт\.|Genesis)\s*(\d+):(\d+)/);
      
      if (match) {
        const [_, chapter, verse] = match;
        // Clean mention - remove all digits and colons, trim whitespace
        const newMention = record.mention.includes('Быт') ? 'Быт.' : 'Genesis';

        await prisma.baseEntity.update({
          where: { id: record.id },
          data: { 
            mention: newMention,
            chapter: parseInt(chapter, 10),
            verse: parseInt(verse, 10)
          },
        });

        console.log(`Updated "${record.name}": ${record.mention} -> ${newMention} (${chapter}:${verse})`);
        updatedCount++;
      } else {
        // If no match found but mention contains digits or colons, clean it up
        if (/[\d:]/.test(record.mention)) {
          const newMention = record.mention.includes('Быт') ? 'Быт.' : 'Genesis';
          
          await prisma.baseEntity.update({
            where: { id: record.id },
            data: { 
              mention: newMention
            },
          });

          console.log(`Cleaned up "${record.name}": ${record.mention} -> ${newMention}`);
          updatedCount++;
        }
      }
    }

    console.log(`\nUpdate completed successfully. Updated ${updatedCount} records.`);
  } catch (error) {
    console.error('Error updating records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMentionsToEnglish(); 