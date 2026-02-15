import { PrismaClient, LeadStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // ==========================================
  // 1. BERSIHKAN DATABASE (Clean Slate)
  // ==========================================
  await prisma.customFieldValue.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.meetingAttendee.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.call.deleteMany();
  await prisma.email.deleteMany();
  await prisma.note.deleteMany();
  await prisma.leadLabel.deleteMany();
  await prisma.label.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.userWorkInfo.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.organizationProfile.deleteMany();
  
  console.log('🧹 Database cleaned.');

  // ==========================================
  // 2. SETUP ROLES
  // ==========================================
  const roleAdmin = await prisma.role.create({ data: { name: 'ADMIN' } });
  const roleSales = await prisma.role.create({ data: { name: 'SALES' } });
  const roleViewer = await prisma.role.create({ data: { name: 'VIEWER' } });

  console.log('✅ Roles created: ADMIN, SALES, VIEWER');

  // ==========================================
  // 3. SETUP LABELS
  // ==========================================
  const labelCold = await prisma.label.create({ data: { name: 'Cold', colorHex: '#3B82F6' } });
  const labelHot = await prisma.label.create({ data: { name: 'Hot', colorHex: '#EF4444' } });
  const labelPitching = await prisma.label.create({ data: { name: 'Pitching', colorHex: '#F97316' } });
  const labelDeal = await prisma.label.create({ data: { name: 'Deal', colorHex: '#22C55E' } });
  const allLabels = [labelCold, labelHot, labelPitching, labelDeal];

  console.log('🏷️ Labels created: Cold, Hot, Pitching, Deal');

  // ==========================================
  // 4. SETUP ORGANIZATION PROFILE
  // ==========================================
  await prisma.organizationProfile.create({
    data: {
      companyName: 'CMLabs CRM',
      tagline: 'Your Complete CRM Solution',
      addressLine1: 'Jl. Sudirman No. 123',
      addressLine2: 'Gedung Graha Tower Lt. 15',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      country: 'Indonesia',
      email: 'contact@cmlabs-crm.com',
      phone: '+62 21 1234 5678',
      website: 'https://cmlabs-crm.com'
    }
  });

  console.log('🏢 Organization Profile created');

  // ==========================================
  // 5. SETUP USERS (1 Admin, 3 Sales, 1 Viewer)
  // ==========================================
  const hashedPassword = await bcrypt.hash('password123', 10);
  const commonPhoto = 'https://i.pravatar.cc/150';

  const adminUser = await prisma.user.create({
    data: {
      fullName: 'Super Admin',
      email: 'ranindq@gmail.com',
      phone: '+62 812 1234 5678',
      passwordHash: hashedPassword,
      roleId: roleAdmin.id,
      photo: `${commonPhoto}?u=admin`,
      status: 'ACTIVE'
    }
  });

  const sales1 = await prisma.user.create({
    data: { 
      fullName: 'Sales Andi', 
      email: 'raninjuni@gmail.com', 
      phone: '+62 813 1111 1111',
      passwordHash: hashedPassword, 
      roleId: roleSales.id, 
      photo: `${commonPhoto}?u=sales1`, 
      status: 'ACTIVE' 
    }
  });
  
  const sales2 = await prisma.user.create({
    data: { 
      fullName: 'Sales Budi', 
      email: 'sales2@crm.com', 
      phone: '+62 813 2222 2222',
      passwordHash: hashedPassword, 
      roleId: roleSales.id, 
      photo: `${commonPhoto}?u=sales2`, 
      status: 'ACTIVE' 
    }
  });
  
  const sales3 = await prisma.user.create({
    data: { 
      fullName: 'Sales Citra', 
      email: 'sales3@crm.com', 
      phone: '+62 813 3333 3333',
      passwordHash: hashedPassword, 
      roleId: roleSales.id, 
      photo: `${commonPhoto}?u=sales3`, 
      status: 'ACTIVE' 
    }
  });

  const salesTeam = [sales1, sales2, sales3];

  const viewerUser = await prisma.user.create({
    data: {
      fullName: 'Viewer Guest',
      email: 'ranindyadq@student.ub.ac.id',
      phone: '+62 814 4444 4444',
      passwordHash: hashedPassword,
      roleId: roleViewer.id,
      photo: `${commonPhoto}?u=viewer`,
      status: 'ACTIVE'
    }
  });

  console.log('👥 Users Created: Admin + 3 Sales + Viewer');

  // ==========================================
  // 6. SETUP USER WORK INFO
  // ==========================================
  await prisma.userWorkInfo.create({
    data: {
      userId: adminUser.id,
      department: 'Management',
      roleTitle: 'System Administrator',
      location: 'Jakarta HQ',
      bio: 'Managing the CRM system and overseeing all operations.',
      skills: ['System Administration', 'Project Management', 'Analytics'],
      joinedAt: new Date('2024-01-15')
    }
  });

  await prisma.userWorkInfo.create({
    data: {
      userId: sales1.id,
      department: 'Sales',
      roleTitle: 'Senior Sales Executive',
      location: 'Jakarta',
      bio: 'Experienced in B2B sales with focus on enterprise clients.',
      skills: ['Negotiation', 'Client Relations', 'Presentation'],
      joinedAt: new Date('2024-03-01')
    }
  });

  await prisma.userWorkInfo.create({
    data: {
      userId: sales2.id,
      department: 'Sales',
      roleTitle: 'Sales Executive',
      location: 'Surabaya',
      bio: 'Specializing in SME market segment.',
      skills: ['Cold Calling', 'Lead Generation', 'CRM'],
      joinedAt: new Date('2024-06-15')
    }
  });

  await prisma.userWorkInfo.create({
    data: {
      userId: sales3.id,
      department: 'Sales',
      roleTitle: 'Junior Sales Executive',
      location: 'Bandung',
      bio: 'New to the team, eager to learn and grow.',
      skills: ['Communication', 'Research', 'Data Entry'],
      joinedAt: new Date('2025-01-10')
    }
  });

  await prisma.userWorkInfo.create({
    data: {
      userId: viewerUser.id,
      department: 'Operations',
      roleTitle: 'Sales Analyst',
      location: 'Remote',
      bio: 'Analyzing sales performance and generating reports.',
      skills: ['Excel', 'Data Analysis', 'Reporting'],
      joinedAt: new Date('2025-02-01')
    }
  });

  console.log('💼 User Work Info created for all users');

  // ==========================================
  // 7. SETUP COMPANIES & CONTACTS
  // ==========================================
  const companies = await Promise.all([
    prisma.company.create({ data: { name: 'PT. Maju Bersama', address: 'Jl. Sudirman No. 10, Jakarta Selatan', website: 'https://majubersama.co.id' } }),
    prisma.company.create({ data: { name: 'CV. Teknologi Nusantara', address: 'Jl. Gatot Subroto No. 25, Bandung', website: 'https://teknusa.com' } }),
    prisma.company.create({ data: { name: 'PT. Digital Solusi', address: 'Jl. HR Rasuna Said, Jakarta', website: 'https://digitalsolusi.id' } }),
    prisma.company.create({ data: { name: 'PT. Karya Mandiri', address: 'Jl. Ahmad Yani No. 50, Surabaya', website: 'https://karyamandiri.co.id' } }),
    prisma.company.create({ data: { name: 'CV. Abadi Jaya', address: 'Jl. Diponegoro No. 88, Semarang' } }),
  ]);

  const contacts = await Promise.all([
    prisma.contact.create({ data: { name: 'Budi Santoso', email: 'budi@majubersama.co.id', phone: '+62 811 1000 001', position: 'CEO', companyId: companies[0].id } }),
    prisma.contact.create({ data: { name: 'Siti Rahayu', email: 'siti@teknusa.com', phone: '+62 811 1000 002', position: 'Procurement Manager', companyId: companies[1].id } }),
    prisma.contact.create({ data: { name: 'Ahmad Wijaya', email: 'ahmad@digitalsolusi.id', phone: '+62 811 1000 003', position: 'CTO', companyId: companies[2].id } }),
    prisma.contact.create({ data: { name: 'Dewi Lestari', email: 'dewi@karyamandiri.co.id', phone: '+62 811 1000 004', position: 'Finance Director', companyId: companies[3].id } }),
    prisma.contact.create({ data: { name: 'Rudi Hartono', email: 'rudi@abadijaya.com', phone: '+62 811 1000 005', position: 'Owner', companyId: companies[4].id } }),
  ]);

  console.log('🏢 5 Companies + 5 Contacts created');

  // ==========================================
  // 8. GENERATE LEADS (60 leads distributed)
  // ==========================================
  const statuses: LeadStatus[] = ['WON', 'LOST', 'ACTIVE', 'ACTIVE', 'ACTIVE'];
  const sources = ['Website', 'Ads/Campaign', 'Referral', 'Event / Offline', 'Social Media'];
  const activeStages = ['Lead In', 'Contact Made', 'Need Identified', 'Proposal Made', 'Negotiation', 'Contract Send'];

  const leads: any[] = [];
  for (let i = 0; i < 60; i++) {
    const assignedSales = salesTeam[i % 3];
    const assignedContact = contacts[i % 5];
    const assignedCompany = companies[i % 5];
    
    const date = new Date();
    date.setMonth(date.getMonth() - Math.floor(Math.random() * 12));
    date.setDate(Math.floor(Math.random() * 28) + 1);

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    let stage = '';
    
    if (status === 'WON') stage = 'Won';
    else if (status === 'LOST') stage = 'Lost';
    else stage = activeStages[Math.floor(Math.random() * activeStages.length)];

    const value = (Math.floor(Math.random() * 100) + 10) * 1000000;

    const lead = await prisma.lead.create({
      data: {
        title: `Project ${i + 1} - ${assignedCompany.name.split(' ')[0]}`,
        value: value,
        currency: 'IDR',
        status: status as LeadStatus,
        stage: stage,
        sourceOrigin: sources[Math.floor(Math.random() * sources.length)],
        description: `Lead ${i + 1}: Initial contact established. Potential value: IDR ${value.toLocaleString()}`,
        ownerId: assignedSales.id,
        contactId: assignedContact.id,
        companyId: assignedCompany.id,
        dueDate: new Date(Date.now() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000),
        createdAt: date,
        updatedAt: date
      }
    });
    leads.push(lead);
  }

  console.log('📊 60 Leads created');

  // ==========================================
  // 9. CONNECT LABELS TO LEADS (LeadLabel)
  // ==========================================
  for (let i = 0; i < leads.length; i++) {
    const numLabels = Math.floor(Math.random() * 2) + 1;
    const usedLabels = new Set<string>();
    
    for (let j = 0; j < numLabels; j++) {
      const randomLabel = allLabels[Math.floor(Math.random() * allLabels.length)];
      if (!usedLabels.has(randomLabel.id)) {
        usedLabels.add(randomLabel.id);
        await prisma.leadLabel.create({
          data: {
            leadId: leads[i].id,
            labelId: randomLabel.id
          }
        });
      }
    }
  }

  console.log('🏷️ Labels connected to Leads');

  // ==========================================
  // 10. GENERATE NOTES (2-3 per lead for first 20 leads)
  // ==========================================
  const noteTemplates = [
    { title: 'Initial Contact', content: 'Made initial contact with the client. They showed interest in our services.' },
    { title: 'Follow-up Call', content: 'Discussed requirements in detail. Client needs a proposal by next week.' },
    { title: 'Meeting Summary', content: 'Met with the decision maker. Budget has been approved internally.' },
    { title: 'Negotiation Update', content: 'Price negotiation in progress. Client requesting 10% discount.' },
    { title: 'Technical Discussion', content: 'Technical team joined the call. All requirements are feasible.' },
  ];

  for (let i = 0; i < 20; i++) {
    const numNotes = Math.floor(Math.random() * 2) + 2;
    for (let j = 0; j < numNotes; j++) {
      const template = noteTemplates[Math.floor(Math.random() * noteTemplates.length)];
      const noteDate = new Date(leads[i].createdAt);
      noteDate.setDate(noteDate.getDate() + j * 3);
      
      await prisma.note.create({
        data: {
          title: template.title,
          content: `${template.content} [Lead: ${leads[i].title}]`,
          leadId: leads[i].id,
          userId: salesTeam[i % 3].id,
          createdAt: noteDate
        }
      });
    }
  }

  console.log('📝 Notes created for first 20 leads');

  // ==========================================
  // 11. GENERATE EMAILS (1-2 per lead for first 15 leads)
  // ==========================================
  const emailSubjects = [
    'Introduction - CMLabs CRM Services',
    'Follow-up: Our Meeting',
    'Proposal Attached',
    'Thank You for Your Interest',
    'Next Steps Discussion'
  ];

  for (let i = 0; i < 15; i++) {
    const numEmails = Math.floor(Math.random() * 2) + 1;
    for (let j = 0; j < numEmails; j++) {
      const emailDate = new Date(leads[i].createdAt);
      emailDate.setDate(emailDate.getDate() + j * 2);
      
      await prisma.email.create({
        data: {
          fromAddress: salesTeam[i % 3].email,
          toAddress: contacts[i % 5].email || 'client@example.com',
          subject: emailSubjects[Math.floor(Math.random() * emailSubjects.length)],
          body: `Dear ${contacts[i % 5].name},\n\nThank you for your time today. I wanted to follow up on our discussion regarding ${leads[i].title}.\n\nBest regards,\n${salesTeam[i % 3].fullName}`,
          status: 'SENT',
          leadId: leads[i].id,
          userId: salesTeam[i % 3].id,
          sentAt: emailDate
        }
      });
    }
  }

  console.log('📧 Emails created for first 15 leads');

  // ==========================================
  // 12. GENERATE MEETINGS
  // ==========================================
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const meetings = await Promise.all([
    prisma.meeting.create({
      data: {
        title: 'Product Demo - PT. Maju Bersama',
        description: 'Demonstrate CRM features to potential client',
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 3600000),
        location: 'Google Meet',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        organizerId: sales1.id,
        leadId: leads[0].id,
        reminderMinutesBefore: 30
      }
    }),
    prisma.meeting.create({
      data: {
        title: 'Contract Review - CV. Teknologi Nusantara',
        description: 'Review and finalize contract terms',
        startTime: new Date(tomorrow.getTime() + 7200000),
        endTime: new Date(tomorrow.getTime() + 10800000),
        location: 'Client Office',
        organizerId: sales2.id,
        leadId: leads[1].id,
        reminderMinutesBefore: 60
      }
    }),
    prisma.meeting.create({
      data: {
        title: 'Kick-off Meeting - PT. Digital Solusi',
        description: 'Project kick-off with new client',
        startTime: new Date(tomorrow.getTime() + 86400000),
        endTime: new Date(tomorrow.getTime() + 90000000),
        location: 'Zoom',
        meetingLink: 'https://zoom.us/j/123456789',
        organizerId: sales3.id,
        leadId: leads[2].id,
        reminderMinutesBefore: 15
      }
    }),
  ]);

  console.log('📅 3 Meetings created');

  // ==========================================
  // 13. ADD MEETING ATTENDEES
  // ==========================================
  await prisma.meetingAttendee.createMany({
    data: [
      { meetingId: meetings[0].id, userId: sales1.id },
      { meetingId: meetings[0].id, userId: adminUser.id },
      { meetingId: meetings[1].id, userId: sales2.id },
      { meetingId: meetings[1].id, userId: sales1.id },
      { meetingId: meetings[2].id, userId: sales3.id },
      { meetingId: meetings[2].id, userId: sales2.id },
      { meetingId: meetings[2].id, userId: adminUser.id },
    ]
  });

  console.log('👥 Meeting Attendees added');

  // ==========================================
  // 14. GENERATE CALLS
  // ==========================================
  await Promise.all([
    prisma.call.create({
      data: {
        title: 'Follow-up Call - PT. Karya Mandiri',
        callTime: tomorrow,
        status: 'SCHEDULED',
        direction: 'OUTBOUND',
        userId: sales1.id,
        leadId: leads[3].id,
        contactId: contacts[3].id,
        reminderMinutesBefore: 15
      }
    }),
    prisma.call.create({
      data: {
        title: 'Introduction Call - CV. Abadi Jaya',
        callTime: new Date(tomorrow.getTime() + 3600000),
        status: 'SCHEDULED',
        direction: 'OUTBOUND',
        userId: sales2.id,
        leadId: leads[4].id,
        contactId: contacts[4].id,
        reminderMinutesBefore: 10
      }
    }),
    prisma.call.create({
      data: {
        title: 'Technical Discussion',
        callTime: new Date(Date.now() - 86400000),
        status: 'COMPLETED',
        direction: 'INBOUND',
        durationMinutes: 45,
        result: 'Successful - Client agreed to proceed',
        notes: 'Client confirmed budget allocation. Ready for proposal.',
        userId: sales3.id,
        leadId: leads[5].id,
        contactId: contacts[0].id
      }
    }),
  ]);

  console.log('📞 3 Calls created');

  // ==========================================
  // 15. GENERATE INVOICES WITH ITEMS
  // ==========================================
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-001',
      status: 'SENT',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: 'Payment due within 14 days',
      subtotal: 75000000,
      taxPercent: 11,
      totalAmount: 83250000,
      leadId: leads[0].id
    }
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: invoice1.id, itemName: 'CRM Implementation', quantity: 1, unitPrice: 50000000, total: 50000000 },
      { invoiceId: invoice1.id, itemName: 'Training (5 sessions)', quantity: 5, unitPrice: 3000000, total: 15000000 },
      { invoiceId: invoice1.id, itemName: 'Support Package (3 months)', quantity: 3, unitPrice: 3333333, total: 10000000 },
    ]
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-002',
      status: 'DRAFT',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 25000000,
      taxPercent: 11,
      totalAmount: 27750000,
      leadId: leads[1].id
    }
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: invoice2.id, itemName: 'Consultation Fee', quantity: 10, unitPrice: 1500000, total: 15000000 },
      { invoiceId: invoice2.id, itemName: 'Custom Development', quantity: 1, unitPrice: 10000000, total: 10000000 },
    ]
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-003',
      status: 'PAID',
      invoiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
      notes: 'Paid via bank transfer',
      subtotal: 35000000,
      taxPercent: 11,
      totalAmount: 38850000,
      leadId: leads[2].id
    }
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: invoice3.id, itemName: 'Annual License', quantity: 1, unitPrice: 35000000, total: 35000000 },
    ]
  });

  console.log('💰 3 Invoices with Items created');

  // ==========================================
  // 16. GENERATE NOTIFICATIONS
  // ==========================================
  await prisma.notification.createMany({
    data: [
      { userId: sales1.id, title: 'New Lead Assigned', message: 'You have been assigned a new lead: Project 1', type: 'INFO', leadId: leads[0].id },
      { userId: sales1.id, title: 'Meeting Reminder', message: 'Meeting with PT. Maju Bersama tomorrow at 10:00', type: 'WARNING', leadId: leads[0].id },
      { userId: sales2.id, title: 'Invoice Overdue', message: 'Invoice INV-2026-001 is overdue', type: 'WARNING' },
      { userId: sales3.id, title: 'Lead Won!', message: 'Congratulations! Lead "Project 5" has been won!', type: 'SUCCESS', leadId: leads[4].id },
      { userId: adminUser.id, title: 'Weekly Report', message: 'Your weekly sales report is ready for review', type: 'INFO' },
    ]
  });

  console.log('🔔 5 Notifications created');

  // ==========================================
  // 17. NOTIFICATION PREFERENCES
  // ==========================================
  await prisma.notificationPreference.createMany({
    data: [
      { userId: adminUser.id, emailDealUpdates: true, emailActivityReminders: true, emailMarketing: false, pushDealUpdates: true, pushReminders: true },
      { userId: sales1.id, emailDealUpdates: true, emailActivityReminders: true, emailMarketing: true, pushDealUpdates: true, pushReminders: true },
      { userId: sales2.id, emailDealUpdates: true, emailActivityReminders: false, emailMarketing: false, pushDealUpdates: true, pushReminders: false },
      { userId: sales3.id, emailDealUpdates: true, emailActivityReminders: true, emailMarketing: false, pushDealUpdates: false, pushReminders: true },
    ]
  });

  console.log('⚙️ Notification Preferences created');

  // ==========================================
  // 18. CUSTOM FIELDS
  // ==========================================
  const customField1 = await prisma.customField.create({
    data: { name: 'Industry', type: 'SELECT' }
  });

  const customField2 = await prisma.customField.create({
    data: { name: 'Employee Count', type: 'NUMBER' }
  });

  const customField3 = await prisma.customField.create({
    data: { name: 'Notes Internal', type: 'TEXT' }
  });

  await prisma.customFieldValue.createMany({
    data: [
      { leadId: leads[0].id, fieldId: customField1.id, value: 'Technology' },
      { leadId: leads[0].id, fieldId: customField2.id, value: '150' },
      { leadId: leads[1].id, fieldId: customField1.id, value: 'Manufacturing' },
      { leadId: leads[1].id, fieldId: customField2.id, value: '500' },
      { leadId: leads[2].id, fieldId: customField1.id, value: 'Finance' },
      { leadId: leads[2].id, fieldId: customField3.id, value: 'Priority client - handle with care' },
    ]
  });

  console.log('📋 Custom Fields created');

  // ==========================================
  // FINAL SUMMARY
  // ==========================================
  console.log('\n========================================');
  console.log('✅ SEEDING COMPLETE!');
  console.log('========================================');
  console.log('📊 Summary:');
  console.log('   - 3 Roles');
  console.log('   - 4 Labels (Cold, Hot, Pitching, Deal)');
  console.log('   - 5 Users (1 Admin, 3 Sales, 1 Viewer)');
  console.log('   - 5 User Work Info');
  console.log('   - 5 Companies');
  console.log('   - 5 Contacts');
  console.log('   - 60 Leads (with labels attached)');
  console.log('   - 40+ Notes');
  console.log('   - 15+ Emails');
  console.log('   - 3 Meetings (with attendees)');
  console.log('   - 3 Calls');
  console.log('   - 3 Invoices (with items)');
  console.log('   - 5 Notifications');
  console.log('   - 4 Notification Preferences');
  console.log('   - 3 Custom Fields (with values)');
  console.log('   - 1 Organization Profile');
  console.log('========================================');
  console.log('🔑 Login Credentials:');
  console.log('   Admin: ranindq@gmail.com / password123');
  console.log('   Sales: raninjuni@gmail.com / password123');
  console.log('   Viewer: ranindyadq@student.ub.ac.id / password123');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
