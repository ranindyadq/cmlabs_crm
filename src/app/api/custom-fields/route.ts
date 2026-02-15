import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
import { createCustomFieldSchema } from "@/validations/customField.schema";

// GET: Ambil semua definisi field
export async function GET() {
  try {
    const fields = await prisma.customField.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ data: fields });
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST: Buat field baru (Admin Only)
export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    
    // Validasi dengan Zod schema
    const validation = createCustomFieldSchema.shape.body.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: "Validation failed", 
        errors: validation.error.issues 
      }, { status: 400 });
    }

    const { name, type } = validation.data;

    // Cek duplikasi nama field
    const existing = await prisma.customField.findFirst({ where: { name } });
    if (existing) {
      return NextResponse.json({ message: "A field with that name already exists." }, { status: 409 });
    }

    const newField = await prisma.customField.create({
      data: { name, type }
    });

    return NextResponse.json({ message: "Field created", data: newField }, { status: 201 });

  } catch (error) {
    console.error("Error creating custom field:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
