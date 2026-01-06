import { ManualType, PrismaClient } from "@prisma/client";
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
  for (const doc of DOCUMENTS_CONFIG) {
    try {
      await prisma.safetyTest.create({
        data: {
          id: doc.id,
          name: doc.title,
          description: doc.description,
          // Store the direct Google Doc URL. The text will be extracted on the fly.
          manualUrl: doc.google_doc_url, 
          manualType: ManualType.LINK,
        },
      });
      console.log(`✨ Created safety test record: ${doc.title}`);
    } catch (error) {
      console.error(
        `❌ Failed to seed document: ${doc.title} (ID: ${doc.id})`,
        error
      );
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

