import { faker } from '@faker-js/faker';
import { Faculty, ManualType, PrismaClient, ProjectStatus, SafetyTestFrequency, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import * as path from 'path';

// You have two options depending on whether you want to use the new Prisma 7 engine or keep the "classic" Rust-based connection.
// Option 1: The Modern Way (Recommended for v7)
// In Prisma 7, you must explicitly provide a driver adapter in your code.
// Install the adapter (using PostgreSQL as an example):

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
  console.log('Start seeding...');

  // Clear database
  await prisma.projectMember.deleteMany({});
  await prisma.projectDocument.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.eventParticipation.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.safetyTestAttempt.deleteMany({});
  await prisma.safetyTest.deleteMany({});
  await prisma.consumableAllocation.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.equipmentBooking.deleteMany({});
  await prisma.consumable.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed Users
  const users = await seedUsers();

  // Seed Faculties
  const faculties = await seedFaculties();

  // Seed Equipments
  await seedEquipments(faculties);

  // Seed Consumables
  await seedConsumables();

  // Seed Events
  await seedEvents(users);

  // Seed Projects
  await seedProjects(users);

  // Seed Safety Tests
  await seedSafetyTests();

  console.log('Seeding finished.');
}

async function seedUsers(): Promise<User[]> {
  const users: User[] = [];
  const roles: UserRole[] = [UserRole.ADMIN, UserRole.ADMIN_TECHNICIAN, UserRole.LAB_MANAGER, UserRole.TECHNICIAN, UserRole.STUDENT, UserRole.LECTURER];
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  // Create specific admin user
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      status: 'APPROVED',
    },
  });
  users.push(adminUser);

  for (const role of roles) {
    // Avoid creating a random admin user again
    if (role === UserRole.ADMIN) continue;

    const user = await prisma.user.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        password: hashedPassword,
        role: role,
        status: 'APPROVED',
      },
    });
    users.push(user);
  }
  console.log('Seeded users');
  return users;
}

async function seedFaculties(): Promise<Faculty[]> {
  const faculties: Faculty[] = [];
  const facultyNames = ['Engineering', 'Science', 'Arts', 'Medicine', 'Business'];

  for (const name of facultyNames) {
    const faculty = await prisma.faculty.create({
      data: {
        name: name,
      },
    });
    faculties.push(faculty);
  }
  console.log('Seeded faculties');
  return faculties;
}

function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function seedEquipments(faculties: Faculty[]) {
  const filePath = path.join(__dirname, '../public/Equipment.csv');
  const file = fs.readFileSync(filePath, 'utf8');

  const results = Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
  });

  let currentCategory = '';

  for (const row of results.data as any[]) {
    if (row.FIELD) {
      currentCategory = row.FIELD;
    }

    if (row.Equipment) {
      const quantity = parseInt(row.Quantitty, 10) || 1;
      for (let i = 0; i < quantity; i++) {
        let serialNumber: string | null = null;
        if (row.SN) {
          serialNumber = `${row.SN}-${i + 1}-${generateRandomString(2)}`;
        } else {
          serialNumber = generateRandomString(8);
        }

        await prisma.equipment.create({
          data: {
            name: row.Equipment,
            model: row.Specs,
            serialNumber: serialNumber,
            category: currentCategory,
            manufacturer: row.Specs, // Assuming specs might contain manufacturer info
            status: 'AVAILABLE',
            facultyId: faker.helpers.arrayElement(faculties).id,
            description: faker.lorem.sentence(),
            location: 'Chandaria CDIE center',
            image: faker.image.url(),
            manualUrl: faker.internet.url(),
            purchaseDate: faker.date.past(),
            purchasePrice: parseFloat(faker.commerce.price({ min: 100, max: 10000, dec: 2 })),
            specifications: {
              weight: faker.number.int({ min: 1, max: 100 }),
              dimensions: {
                length: faker.number.int({ min: 10, max: 100 }),
                width: faker.number.int({ min: 10, max: 100 }),
                height: faker.number.int({ min: 10, max: 100 }),
              },
            },
            warrantyExpiry: faker.date.future(),
            estimatedPrice: parseFloat(faker.commerce.price({ min: 100, max: 10000, dec: 2 })),
            actualPrice: parseFloat(faker.commerce.price({ min: 100, max: 10000, dec: 2 })),
            notes: faker.lorem.sentence(),
            requiresSafetyTest: faker.datatype.boolean(),
            dailyCapacity: faker.number.int({ min: 1, max: 20 }),
          },
        });
      }
    }
  }
  console.log('Seeded equipments');
}

async function seedConsumables() {
  const filePath = path.join(__dirname, '../public/Consumables.csv');
  const file = fs.readFileSync(filePath, 'utf8');

  const results = Papa.parse(file, {
    header: false, // The CSV does not have a consistent header
    skipEmptyLines: true,
  });

  // Skip header rows
  const dataRows = results.data.slice(2);

  for (const row of dataRows as any[]) {
    const name = row[0];
    if (!name) continue;

    const manufacturer = row[1] || null;
    const specs = row[2] || null;
    const type = row[3] || null;
    let quantityString = row[4] || '1';

    // Clean quantity string
    quantityString = quantityString.replace(/pcs/gi, '').replace(/packets/gi, '').replace(/box/gi, '').trim();
    const quantity = parseInt(quantityString, 10) || 1;

    const description = [manufacturer, specs, type].filter(Boolean).join(', ');

    await prisma.consumable.create({
      data: {
        name: name,
        description: description,
        quantity: quantity,
        currentStock: quantity,
        category: 'CONSUMABLE',
        status: 'AVAILABLE',
        unit: 'units'
      },
    });
  }
  console.log('Seeded consumables');
}

async function seedEvents(users: User[]) {
  for (let i = 0; i < 10; i++) {
    await prisma.event.create({
      data: {
        name: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        startDate: faker.date.future(),
        endDate: faker.date.future(),
        location: faker.location.city(),
        createdById: faker.helpers.arrayElement(users).id,
      },
    });
  }
  console.log('Seeded events');
}

async function seedProjects(users: User[]) {
  for (let i = 0; i < 10; i++) {
    await prisma.project.create({
      data: {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(Object.values(ProjectStatus)),
        creatorId: faker.helpers.arrayElement(users).id,
      },
    });
  }
  console.log('Seeded projects');
}

async function seedSafetyTests() {
  for (let i = 0; i < 5; i++) {
    await prisma.safetyTest.create({
      data: {
        name: `Safety Test ${i + 1}`,
        description: faker.lorem.paragraph(),
        frequency: faker.helpers.arrayElement(Object.values(SafetyTestFrequency)),
        manualType: faker.helpers.arrayElement(Object.values(ManualType)),
      },
    });
  }
  console.log('Seeded safety tests');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });