import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Membuat data inti: Roles (ADMIN, SALES, VIEWER) dan 1 User ADMIN.
 */
async function seedCoreData(prisma: PrismaClient, hashedPassword: string) {
  console.log('🌱 Seeding Roles...');
  
  const rolesToCreate = ['ADMIN', 'SALES', 'VIEWER'];
  
  for (const roleName of rolesToCreate) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
  
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const salesRole = await prisma.role.findUnique({ where: { name: 'SALES' } });

  console.log('✅ Roles seeded.');

  // 2. Seed Admin User
  console.log('🌱 Seeding Admin User...');
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'ranindq@gmail.com';
  
  if (adminRole) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { roleId: adminRole.id, status: 'ACTIVE' },
      create: {
        fullName: 'Super Admin',
        email: adminEmail,
        passwordHash: hashedPassword,
        roleId: adminRole.id,
        status: 'ACTIVE',
        isOauthUser: false,
      },
    });
    console.log(`✅ Admin User seeded: ${adminEmail}`);
  }
  
  return { salesRole, adminRole };
}

/**
 * Membuat data dummy (Historical) agar Dashboard terlihat bagus.
 */
async function seedDummyData(prisma: PrismaClient, roles: any, hashedPassword: string) {
  console.log('🧪 Seeding data dummy (development only)...');

  // 1. Seed Sales User
  const salesUser = await prisma.user.upsert({
    where: { email: 'raninjuni@gmail.com' },
    update: {},
    create: {
      fullName: 'Sales Person',
      email: 'raninjuni@gmail.com',
      passwordHash: hashedPassword,
      roleId: roles.salesRole.id,
      status: 'ACTIVE',
    },
  });

  // 2. Seed Company & Contact
  const company = await prisma.company.upsert({
    where: { name: 'PT. Klien Percobaan' },
    update: {},
    create: {
      name: 'PT. Klien Percobaan',
      website: 'klien-percobaan.com',
      address: 'Jl. Uji Coba No. 1, Jakarta',
    },
  });

  const contact = await prisma.contact.upsert({
    where: { email: 'budi@klien-percobaan.com' },
    update: {},
    create: {
      name: 'Budi Santoso',
      email: 'budi@klien-percobaan.com',
      phone: '08123456789',
      position: 'Manajer IT',
      companyId: company.id,
    },
  });

  // --- 🔥 TAMBAHAN: GENERATE HISTORICAL LEADS (PENTING UNTUK CHART) ---
  console.log('📊 Generating Historical Leads for Dashboard...');
  
  const statuses = ['WON', 'LOST', 'ACTIVE', 'WON', 'ACTIVE']; // Lebih banyak WON/ACTIVE biar grafik bagus
  const sources = ['Website', 'Ads', 'Referral', 'Social Media'];
  
  // Buat 30 Lead dummy tersebar dalam 6 bulan terakhir
  for (let i = 0; i < 30; i++) {
    const randomMonthBack = Math.floor(Math.random() * 6); // 0-5 bulan lalu
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - randomMonthBack);
    createdAt.setDate(Math.floor(Math.random() * 28) + 1); // Tanggal acak

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const value = (Math.floor(Math.random() * 50) + 10) * 1000000; // 10jt - 60jt

    let closedAt = null;
    // Jika WON/LOST, harus ada tanggal closing (misal 5 hari setelah dibuat)
    if (status === 'WON' || status === 'LOST') {
        closedAt = new Date(createdAt);
        closedAt.setDate(closedAt.getDate() + 5);
    }

    await prisma.lead.create({
      data: {
        title: `Lead Dummy #${i+1} - ${status}`,
        value: value,
        currency: 'IDR',
        stage: status === 'WON' ? 'Deal' : 'Negotiation',
        status: status as any,
        sourceOrigin: sources[Math.floor(Math.random() * sources.length)],
        ownerId: salesUser.id,
        contactId: contact.id,
        companyId: company.id,
        createdAt: createdAt, // Tanggal dibuat mundur
        closedAt: closedAt,   // Tanggal closing (PENTING UNTUK CHART REVENUE)
        updatedAt: createdAt,
      }
    });
  }
  console.log('✅ 30 Historical Leads generated.');

  // 4. Seed Activities for Lead (Contoh 1 lead aktif masa depan)
  const activeLead = await prisma.lead.create({
    data: {
        title: 'BIG PROJECT - Implementasi CRM 2025',
        value: 250000000,
        currency: 'IDR',
        stage: 'Proposal Made',
        status: 'ACTIVE',
        sourceOrigin: 'Referral',
        ownerId: salesUser.id,
        contactId: contact.id,
        companyId: company.id,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Due 2 minggu lagi
    }
  });

  // Meeting Upcoming
  await prisma.meeting.create({
    data: {
      title: 'Finalisasi Kontrak CRM',
      description: 'Membahas termin pembayaran.',
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 hari lagi
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      leadId: activeLead.id,
      organizerId: salesUser.id,
    },
  });

  console.log('✅ Upcoming Activities seeded.');
}

// 3. SEED LABELS
async function seedLabels(prisma: PrismaClient) {
  console.log('🏷️ Seeding Labels...');
  const labels = [
    { name: 'Cold', colorHex: '#2D8EFF' },
    { name: 'Hot', colorHex: '#C11106' },
    { name: 'Pitching', colorHex: '#5A4FB5' },
    { name: 'Deal', colorHex: '#257047' },
  ];

  for (const label of labels) {
    await prisma.label.upsert({
      where: { name: label.name },
      update: { colorHex: label.colorHex },
      create: label,
    });
  }
}

async function main() {
  console.log('🚀 Mulai proses seeding...');

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10); 

  const roles = await seedCoreData(prisma, hashedPassword);
  await seedLabels(prisma);

  // Jalankan dummy data di mode dev
  if (process.env.NODE_ENV !== 'production') {
    await seedDummyData(prisma, roles, hashedPassword);
  }

  console.log('🏁 Proses seeding selesai.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });