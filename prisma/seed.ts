import { ManualType, PrismaClient, Prisma } from "@prisma/client";
import { DOCUMENTS_CONFIG } from "../lib/docs/documentsConfig";

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// You MUST pass the adapter to the constructor in v7

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
  adapter,
});

async function main() {
  console.log("🚀 Starting database seeding process...");

  // 1. Clear existing safety tests to ensure a clean slate
  console.log("🗑️ Clearing existing SafetyTest records...");
  await prisma.safetyTest.deleteMany({});
  console.log("✅ SafetyTest table cleared.");

  // 2. Seed Safety Tests from the configuration file
  console.log("🌱 Seeding Safety Tests from documentsConfig.ts...");
  const createdSafetyTestsMap = new Map<string, string>(); // Map to store doc.id -> manualUrl (for single docs) or doc.id-video-idx -> manualUrl (for multiple videos)

  for (const doc of DOCUMENTS_CONFIG) {
    // Process Google Doc URLs if available
    if (doc.google_doc_url) {
      try {
        await prisma.safetyTest.create({
          data: {
            id: doc.id,
            name: doc.title,
            description: doc.description,
            manualUrl: doc.google_doc_url,
            manualType: ManualType.LINK,
          },
        });
        createdSafetyTestsMap.set(doc.id, doc.google_doc_url);
        console.log(`✨ Created document safety test record: ${doc.title}`);
      } catch (error) {
        console.error(
          `❌ Failed to seed document: ${doc.title} (ID: ${doc.id})`,
          error
        );
      }
    }

    // Process video URLs if available
    if (doc.video_urls && doc.video_urls.length > 0) {
      for (let i = 0; i < doc.video_urls.length; i++) {
        const videoUrl = doc.video_urls[i];
        // Create a unique ID for each video, appending to the original doc.id
        const uniqueId = `${doc.id}-video-${i}`;
        const videoTitle = `${doc.title} (Video ${i + 1})`;

        try {
          await prisma.safetyTest.create({
            data: {
              id: uniqueId,
              name: videoTitle,
              description: doc.description,
              manualUrl: videoUrl,
              manualType: ManualType.VIDEO,
            },
          });
          createdSafetyTestsMap.set(uniqueId, videoUrl);
          console.log(`✨ Created video safety test record: ${videoTitle}`);
        } catch (error) {
          console.error(
            `❌ Failed to seed video document: ${videoTitle} (ID: ${uniqueId})`,
            error
          );
        }
      }
    }
  }

  // 3. Associate Safety Tests with Equipment and update Equipment manualUrl
  console.log("🔗 Associating Safety Tests with Equipment and updating manual URLs...");
  for (const doc of DOCUMENTS_CONFIG) {
    // Determine which equipment names to search for
    const equipmentNamesToSearch = (doc.equipments && doc.equipments.length > 0)
      ? doc.equipments
      : [doc.title]; // Fallback to doc.title if no specific equipments are listed

    // Get all safety tests related to this doc (original ID and video-specific IDs)
    const relatedSafetyTestIds = Array.from(createdSafetyTestsMap.keys()).filter(key =>
      key.startsWith(doc.id)
    );

    for (const safetyTestId of relatedSafetyTestIds) {
      const safetyTestManualUrl = createdSafetyTestsMap.get(safetyTestId);

      if (safetyTestManualUrl) {
        for (const equipmentName of equipmentNamesToSearch) {
          try {
            // Construct flexible search conditions
            const searchTerms = equipmentName.split(' ').filter(term => term.length > 0);
            const orConditions = searchTerms.map(term => ({
              name: {
                contains: term,
                mode: Prisma.QueryMode.insensitive,
              },
            }));

            // Add the full phrase as a search term if it's not already covered by single words
            if (searchTerms.length > 1 && !orConditions.some(cond => cond.name.contains === equipmentName)) {
                orConditions.push({
                    name: {
                        contains: equipmentName,
                        mode: Prisma.QueryMode.insensitive,
                    }
                });
            }
            // If no specific search terms were generated, use the full equipmentName as a single condition
            const whereCondition = orConditions.length > 0 ? { OR: orConditions } : {
                name: {
                    contains: equipmentName,
                    mode: Prisma.QueryMode.insensitive,
                },
            };

            // Log what we are searching for
            console.log(`  Searching for equipment with conditions: ${JSON.stringify(whereCondition)}`);

            // Find equipment that would be updated
            const equipmentToUpdate = await prisma.equipment.findMany({
              where: whereCondition,
              select: { id: true, name: true },
            });

            if (equipmentToUpdate.length > 0) {
              console.log(`  Found ${equipmentToUpdate.length} equipment(s) for "${equipmentName}":`);
              equipmentToUpdate.forEach(eq => console.log(`    - ID: ${eq.id}, Name: "${eq.name}"`));
            } else {
              console.log(`  No equipment found for "${equipmentName}" with current criteria.`);
            }

            // Find equipment with similar names (case-insensitive)
            const updatedEquipments = await prisma.equipment.updateMany({
              where: whereCondition,
              data: {
                manualUrl: safetyTestManualUrl,
              },
            });
            if (updatedEquipments.count > 0) {
              console.log(
                `🔄 Updated ${updatedEquipments.count} equipment records with manualUrl for '${equipmentName}' from safety test '${safetyTestId}'`
              );
            } else {
              console.warn(
                `⚠️ No equipment found matching '${equipmentName}' for safety test '${safetyTestId}'.`
              );
            }
          } catch (error) {
            console.error(
              `❌ Failed to update equipment for '${equipmentName}' from safety test '${safetyTestId}'`,
              error
            );
          }
        }
      } else {
        console.warn(
          `⚠️ No manualUrl found for safety test ID '${safetyTestId}'. Skipping equipment update.`
        );
      }
    }
  }

  console.log("✅ Database seeding process completed successfully.");
}

main()
  .catch((e) => {
    console.error("🔥 An error occurred during the seeding process:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });