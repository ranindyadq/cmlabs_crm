import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { getSessionUser } from "@/lib/auth-helper";

// --- GET ALL TEAM LIST ---
export async function GET(req: Request) {
  try {
    // 🔒 Security Check
    const user = await getSessionUser(req);
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
          status: true,
          createdAt: true, 
          role: { select: { name: true } },
          workInfo: { 
            select: { 
              roleTitle: true, 
              department: true,
              joinedAt: true 
            } 
          }
        },
        skip: skip,
        take: limit,
        orderBy: { fullName: 'asc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);
    
    return NextResponse.json({ 
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching team list:", error);
    return NextResponse.json({ message: "Gagal mengambil data tim." }, { status: 500 });
  }
}

// --- CREATE TEAM MEMBER ---
export async function POST(req: Request) {
  try {
    // 🔒 Security Check (Only Admin)
    const user = await getSessionUser(req);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, email, password, roleName, phone, department, roleTitle } = body;
    const passwordToHash = password || 'password123'; 
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    // Cek email duplikat
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return NextResponse.json({ message: "Email sudah digunakan." }, { status: 400 });

    // Cari Role ID
    const role = await prisma.role.findUnique({ where: { name: roleName || 'SALES' } });
    if (!role) return NextResponse.json({ message: "Role tidak valid." }, { status: 400 });

    // Transaksi: Buat User & WorkInfo
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        roleId: role.id,
        workInfo: {
          create: {
            department: department || 'General',
            roleTitle: roleTitle || 'Staff',
            joinedAt: new Date()
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
          message: `Admin membuat akun untuk ${fullName}`,
          initialPassword: passwordToHash, 
          role: roleName
        }
      }
    });

    return NextResponse.json({ 
      message: `Berhasil! Login dengan password: ${passwordToHash}`, 
      data: newUser 
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json({ message: "Gagal menambahkan anggota tim." }, { status: 500 });
  }
}