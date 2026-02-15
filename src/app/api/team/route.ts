import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { getSessionUser } from "@/lib/auth-helper";

// --- GET ALL TEAM LIST ---
export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    
    // 1. Cek User Null Dulu (Wajib)
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ekstrak Role dengan Aman (Fix Error 'never')
    // Kita paksa cast ke 'any' agar TS tidak rewel soal string vs object
    const roleData = user.role as any; 
    const userRole = typeof roleData === 'string' ? roleData : roleData?.name;

    // 3. Cek Permission
    const allowedRoles = ['ADMIN', 'OWNER', 'PROJECT MANAGER', 'PROJECT_MANAGER']; // Tambahkan variasi
    
    if (!userRole || !allowedRoles.includes(userRole.toUpperCase())) { 
        return NextResponse.json({ 
            message: "Forbidden: Sales team cannot view team management." 
        }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null, 
    };

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      whereClause.role = { name: role };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          photo: true,
          status: true,
          createdAt: true,
          managerId: true, // 🔥 WAJIB DITAMBAHKAN AGAR DATA MANAGER MUNCUL
          role: { select: { name: true } },     
          workInfo: { select: {                 
             roleTitle: true, 
             department: true,
             joinedAt: true,
             location: true,
             bio: true,
             skills: true
          }}
        },
        skip: skip,
        take: limit,
        orderBy: { fullName: 'asc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // ✅ TRANSFORMASI DATA DI SINI
    // Map data raw dari Prisma menjadi data bersih
    const cleanData = users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      photo: user.photo,
      roleName: user.role?.name || "Member",
      roleTitle: user.workInfo?.roleTitle || "Staff",
      department: user.workInfo?.department || "-",
      joinedAt: user.workInfo?.joinedAt,
      // Mapping detail lain untuk Edit Modal
      location: user.workInfo?.location,
      bio: user.workInfo?.bio,
      skills: user.workInfo?.skills,
      reportsTo: user.managerId // 🔥 PENTING: Mapping ini yang dibaca Edit Modal
    }));
    
    return NextResponse.json({ 
      data: cleanData, // Kirim data yang sudah bersih
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching team list:", error);
    return NextResponse.json({ message: "Failed to fetch team data." }, { status: 500 });
  }
}

// --- CREATE TEAM MEMBER ---
export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    
    // 1. Cek User Null Dulu
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Ekstrak Role dengan Aman
    const roleData = user.role as any;
    const userRole = typeof roleData === 'string' ? roleData : roleData?.name;

    // 3. Cek Permission (Only Admin & Owner)
    const allowedcreators = ['ADMIN', 'OWNER'];

    if (!userRole || !allowedcreators.includes(userRole.toUpperCase())) {
       return NextResponse.json({ message: "Forbidden: Read-only access" }, { status: 403 });
    }

    const body = await req.json();
    const { 
        fullName, email, password, roleName, phone, 
        department, roleTitle, 
        bio, skills, status, location, joinedAt, managerId
    } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
        return NextResponse.json({ 
            // Pesan ini nanti akan ditangkap frontend dan dimasukkan ke state error
            message: "Invalid email format" 
        }, { status: 400 });
    }

    const passwordToHash = password || 'password123'; 
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    // Cek email duplikat
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return NextResponse.json({ message: "Email already in use." }, { status: 400 });

    // Cari Role ID
    const role = await prisma.role.findUnique({ where: { name: roleName || 'SALES' } });
    if (!role) return NextResponse.json({ message: "Invalid role." }, { status: 400 });

    // Transaksi: Buat User & WorkInfo
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash: hashedPassword,
        status: status || 'ACTIVE',
        // Note: Untuk skills, pastikan di schema.prisma tipenya String[] atau Json. 
        // Jika schema-nya String, pakai: skills.join(", ")
        roleId: role.id,
        managerId: managerId || null,
        workInfo: {
          create: {
            department: department || 'General',
            roleTitle: roleTitle || 'Staff',
            location: location, 
            bio: bio,
            skills: Array.isArray(skills) ? skills : [],
            // ✅ UPDATE JOIN DATE
            // Pakai tanggal inputan, kalau kosong baru NOW
            joinedAt: joinedAt ? new Date(joinedAt) : new Date()
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        targetId: newUser.id,
        actionType: 'CREATE_TEAM_MEMBER',
        detailsJson: {
          message: `Admin created account for ${fullName}`,
          initialPassword: passwordToHash, 
          role: roleName
        }
      }
    });

    return NextResponse.json({ 
      message: `Success! Login with password: ${passwordToHash}`, 
      data: newUser 
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json({ message: "Failed to add team member." }, { status: 500 });
  }
}
