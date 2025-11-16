import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as menuData from './menu.seed.json';

const prisma = new PrismaClient();

async function generateClientCode(): Promise<string> {
  const count = await prisma.family.count();
  const number = (count + 1).toString().padStart(6, '0');
  return `TF-${number}`;
}

async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL || 'admin@teddy.pt';
  const password = process.env.ADMIN_SEED_PASSWORD || 'change_me';

  const existingAdmin = await prisma.staff.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping...');
    return;
  }

  const passwordHash = await argon2.hash(password);

  const admin = await prisma.staff.create({
    data: {
      email,
      name: 'System Admin',
      role: 'ADMIN',
      passwordHash,
    },
  });

  console.log(`✅ Created admin user: ${admin.email}`);
}

async function seedMenu() {
  console.log('Seeding menu items...');

  for (const category of menuData.categories) {
    for (const item of category.items) {
      const existingItem = await prisma.menuItem.findUnique({
        where: { sku: item.sku },
      });

      if (existingItem) {
        console.log(`Menu item ${item.sku} already exists, skipping...`);
        continue;
      }

      const menuItem = await prisma.menuItem.create({
        data: {
          sku: item.sku,
          nameEn: item.name_en,
          namePt: item.name_pt,
          descEn: item.desc_en || null,
          descPt: item.desc_pt || null,
          priceCents: Math.round(item.price_eur * 100), // Convert EUR to cents
          category: category.key.toUpperCase() as 'FOOD' | 'DRINKS',
          isActive: true,
        },
      });

      console.log(`✅ Created menu item: ${menuItem.sku}`);
    }
  }
}

async function seedTestFamily() {
  const existingFamily = await prisma.family.findFirst({
    where: { clientCode: { startsWith: 'TF-' } },
  });

  if (existingFamily) {
    console.log('Test family already exists, skipping...');
    return;
  }

  const clientCode = await generateClientCode();

  const family = await prisma.family.create({
    data: {
      phone: '+351912345678',
      waId: '351912345678',
      lang: 'PT',
      clientCode,
      kidsCount: 2,
      consentMarketing: true,
    },
  });

  // Create loyalty counter
  await prisma.loyaltyCounter.create({
    data: {
      familyId: family.id,
      currentCycleCount: 0,
      totalVisits: 0,
    },
  });

  console.log(`✅ Created test family: ${family.clientCode}`);
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    await seedAdmin();
    await seedMenu();
    await seedTestFamily();

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
