import { PrismaClient, LeadStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // ==========================================
  // 1. BERSIHKAN DATABASE (Clean Slate)
  // ==========================================
  // Urutan delete penting (Child dulu baru Parent)
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.meetingAttendee.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.call.deleteMany();
  await prisma.email.deleteMany();
  await prisma.note.deleteMany();
  await prisma.leadLabel.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.userWorkInfo.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  
  console.log('🧹 Database cleaned.');

  // ==========================================
  // 2. SETUP ROLES
  // ==========================================
  const roleAdmin = await prisma.role.create({ data: { name: 'ADMIN' } });
  const roleSales = await prisma.role.create({ data: { name: 'SALES' } });
  const roleViewer = await prisma.role.create({ data: { name: 'VIEWER' } });

  console.log('✅ Roles created: ADMIN, SALES, VIEWER');

  // ==========================================
  // 3. SETUP USERS (1 Admin, 3 Sales, 1 Viewer)
  // ==========================================
  const hashedPassword = await bcrypt.hash('password123', 10);
  const commonPhoto = 'https://i.pravatar.cc/150';

  // A. USER ADMIN
  const adminUser = await prisma.user.create({
    data: {
      fullName: 'Super Admin',
      email: 'ranindq@gmail.com',
      passwordHash: hashedPassword,
      roleId: roleAdmin.id,
      photo: `${commonPhoto}?u=admin`,
      status: 'ACTIVE'
    }
  });

  // B. USER SALES (3 Orang)
  const sales1 = await prisma.user.create({
    data: { fullName: 'Sales Andi (1)', email: 'raninjuni@gmail.com', passwordHash: hashedPassword, roleId: roleSales.id, photo: `${commonPhoto}?u=sales1`, status: 'ACTIVE' }
  });
  const sales2 = await prisma.user.create({
    data: { fullName: 'Sales Budi (2)', email: 'sales2@crm.com', passwordHash: hashedPassword, roleId: roleSales.id, photo: `${commonPhoto}?u=sales2`, status: 'ACTIVE' }
  });
  const sales3 = await prisma.user.create({
    data: { fullName: 'Sales Citra (3)', email: 'sales3@crm.com', passwordHash: hashedPassword, roleId: roleSales.id, photo: `${commonPhoto}?u=sales3`, status: 'ACTIVE' }
  });

  // Array sales agar mudah dibagi-bagi nanti
  const salesTeam = [sales1, sales2, sales3];

  // C. USER VIEWER
  const viewerUser = await prisma.user.create({
    data: {
      fullName: 'Viewer Guest',
      email: 'ranindyadq@student.ub.ac.id',
      passwordHash: hashedPassword,
      roleId: roleViewer.id,
      photo: `${commonPhoto}?u=viewer`,
      status: 'ACTIVE'
    }
  });

  console.log('👥 Users Created:');
  console.log('   - Admin: ranindq@gmail.com');
  console.log('   - Sales: raninjuni@gmail.com, sales2@crm.com, sales3@crm.com');
  console.log('   - Viewer: ranindyadq@student.ub.ac.id');
  console.log('   (Password semua: password123)');

  // ==========================================
  // 4. SETUP CONTACTS & COMPANIES
  // ==========================================
  const company = await prisma.company.create({ data: { name: 'PT. Maju Bersama', address: 'Jakarta Selatan' } });
  const contact = await prisma.contact.create({ data: { name: 'Pak Bos Klien', email: 'client@maju.com', companyId: company.id } });

  // ==========================================
  // 5. GENERATE DATA (Terdistribusi ke 3 Sales)
  // ==========================================
  
  console.log('📊 Generating Distributed Data with Custom Stages...');

  const statuses: LeadStatus[] = ['WON', 'LOST', 'ACTIVE', 'ACTIVE', 'ACTIVE']; // Banyakin ACTIVE biar variasi stage terlihat
  const sources = ['Website', 'Ads', 'Referral', 'Cold Call'];

  // Daftar Stage Khusus untuk status ACTIVE
  const activeStages = [
    "Lead In", 
    "Contact Mode", 
    "Need Identified", 
    "Proposal Mode", 
    "Negotiation", 
    "Contract Sent"
  ];

  const leads = [];
  for (let i = 0; i < 60; i++) {
    const assignedSales = salesTeam[i % 3]; 
    
    // Random Tanggal
    const date = new Date();
    date.setMonth(date.getMonth() - Math.floor(Math.random() * 12));
    date.setDate(Math.floor(Math.random() * 28) + 1);

    // Tentukan Status Dulu
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Tentukan Stage Berdasarkan Status
    let stage = "";
    
    if (status === 'WON') {
        stage = "Won";
    } else if (status === 'LOST') {
        stage = "Lost";
    } else {
        // Jika ACTIVE, pilih acak dari tahap Lead In s/d Contract Sent
        stage = activeStages[Math.floor(Math.random() * activeStages.length)];
    }

    const value = (Math.floor(Math.random() * 100) + 10) * 1000000; 

    const lead = await prisma.lead.create({
      data: {
        title: `Proyek ${stage} #${i+1} (${assignedSales.fullName})`, // Judul saya kasih nama stage biar gampang dicek
        value: value,
        currency: 'IDR',
        status: status as LeadStatus,
        stage: stage, // <--- Stage sudah sesuai logika baru
        sourceOrigin: sources[Math.floor(Math.random() * sources.length)],
        ownerId: assignedSales.id,
        contactId: contact.id,
        createdAt: date,
        updatedAt: date
      }
    });
    leads.push(lead);
  }

  // ==========================================
  // 6. GENERATE UPCOMING ACTIVITIES (Spesifik per Sales)
  // ==========================================
  // Kita buat tanggal BESOK agar muncul di Dashboard
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  // A. Aktivitas untuk SALES 1 (Meeting & Call)
  await prisma.meeting.create({
    data: {
      title: 'Meeting Sales A - Presentasi',
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 3600000),
      organizerId: sales1.id, // Punya Sales 1
      leadId: leads[0].id
    }
  });

  // B. Aktivitas untuk SALES 2 (Call)
  await prisma.call.create({
    data: {
      title: 'Call Sales B - Follow Up',
      callTime: tomorrow,
      status: 'SCHEDULED',
      userId: sales2.id, // Punya Sales 2
      leadId: leads[1].id
    }
  });

  // C. Aktivitas untuk SALES 3 (Invoice)
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-SALES3-001',
      status: 'SENT',
      dueDate: tomorrow,
      subtotal: 50000000,
      totalAmount: 55000000,
      invoiceDate: new Date(),
      leadId: leads[2].id // Lead ini milik Sales 3 (karena index 2 % 3 = 2)
    }
  });

  console.log('✅ Seeding Finished! Ready to test Role Management.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });