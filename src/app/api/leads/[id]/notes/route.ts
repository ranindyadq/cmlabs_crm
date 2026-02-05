import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSessionUser } from "@/lib/auth-helper"; // <--- PASTIKAN IMPORT INI ADA

const prisma = new PrismaClient();

export async function POST(
    req: Request, 
    { params }: { params: { id: string } }
) {
    try {
        const leadId = params.id;

        // 1. Cek Login
        const user = await getSessionUser(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Ambil Data Body
        const body = await req.json();
        const { content, title } = body;

        if (!content) {
            return NextResponse.json({ message: "Note content is required" }, { status: 400 });
        }
        
        // 3. Simpan Note dan Hubungkan ke Lead & User
        const newNote = await prisma.note.create({
            data: {
                title: title || 'Quick Note',
                content: content,
                // Hubungkan ke Lead berdasarkan ID di URL
                leadId: leadId, 
                // Hubungkan ke User berdasarkan Session
                userId: user.id 
            }
        });

        return NextResponse.json({
            message: "Note created successfully",
            data: newNote,
        }, { status: 201 });

    } catch (error: any) {
        // Cek P2003 (Foreign Key constraint - Lead tidak ditemukan)
        if (error.code === 'P2003') {
             return NextResponse.json({ message: "Lead not found (Invalid ID)" }, { status: 404 });
        }
        console.error("Error creating note:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}